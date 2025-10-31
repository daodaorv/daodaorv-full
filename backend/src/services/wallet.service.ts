import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Wallet, WalletStatus } from '../entities/Wallet';
import { WalletTransaction, TransactionType } from '../entities/WalletTransaction';
import { WithdrawalRecord, WithdrawalStatus, WithdrawalMethod } from '../entities/WithdrawalRecord';
import { User } from '../entities/User';
import { generateWithdrawalNumber } from '../utils/withdrawal-number';
import { logger } from '../utils/logger';

/**
 * 创建钱包DTO
 */
export interface CreateWalletDTO {
  userId: string;
}

/**
 * 消费DTO
 */
export interface ConsumeDTO {
  userId: string;
  amount: number;
  relatedId: string; // 订单ID等
  relatedType: string; // order/other
  description: string;
}

/**
 * 提现申请DTO
 */
export interface WithdrawalDTO {
  userId: string;
  amount: number;
  method: WithdrawalMethod;
  account: string;
  accountName?: string;
  bankName?: string;
}

/**
 * 处理提现DTO
 */
export interface ProcessWithdrawalDTO {
  withdrawalId: string;
  approved: boolean;
  rejectReason?: string;
  reviewerId: string;
}

/**
 * 调整余额DTO
 */
export interface AdjustBalanceDTO {
  userId: string;
  amount: number; // 正数为增加，负数为减少
  reason: string;
  operatorId: string;
}

/**
 * 查询交易记录DTO
 */
export interface TransactionQueryDTO {
  userId: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

/**
 * 钱包服务类
 */
export class WalletService {
  private walletRepository: Repository<Wallet>;
  private transactionRepository: Repository<WalletTransaction>;
  private withdrawalRepository: Repository<WithdrawalRecord>;
  private userRepository: Repository<User>;

  constructor() {
    this.walletRepository = AppDataSource.getRepository(Wallet);
    this.transactionRepository = AppDataSource.getRepository(WalletTransaction);
    this.withdrawalRepository = AppDataSource.getRepository(WithdrawalRecord);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * 创建用户钱包
   */
  async createWallet(dto: CreateWalletDTO): Promise<Wallet> {
    logger.info(`创建钱包: 用户ID=${dto.userId}`);

    // 检查用户是否存在
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查是否已有钱包
    const existingWallet = await this.walletRepository.findOne({
      where: { userId: dto.userId },
    });
    if (existingWallet) {
      throw new Error('用户已有钱包');
    }

    // 创建钱包
    const wallet = this.walletRepository.create({
      userId: dto.userId,
      balance: 0,
      frozenAmount: 0,
      totalRecharge: 0,
      totalConsume: 0,
      totalWithdrawal: 0,
      status: WalletStatus.ACTIVE,
    });

    await this.walletRepository.save(wallet);
    logger.info(`钱包创建成功: walletId=${wallet.id}`);

    return wallet;
  }

  /**
   * 获取钱包信息
   */
  async getWallet(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new Error('钱包不存在');
    }

    return wallet;
  }

  /**
   * 获取或创建钱包
   */
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    try {
      return await this.getWallet(userId);
    } catch (error) {
      // 钱包不存在，自动创建
      return await this.createWallet({ userId });
    }
  }

  /**
   * 消费（订单支付等）
   */
  async consume(dto: ConsumeDTO): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    logger.info(`钱包消费: 用户ID=${dto.userId}, 金额=${dto.amount}`);

    // 验证金额
    if (dto.amount <= 0) {
      throw new Error('消费金额必须大于0');
    }

    // 获取钱包
    const wallet = await this.getOrCreateWallet(dto.userId);

    // 检查钱包状态
    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new Error('钱包已冻结或关闭');
    }

    // 检查余额是否充足
    const availableBalance = Number(wallet.balance) - Number(wallet.frozenAmount);
    if (availableBalance < dto.amount) {
      throw new Error('余额不足');
    }

    // 扣减余额
    wallet.balance = Number(wallet.balance) - dto.amount;
    wallet.totalConsume = Number(wallet.totalConsume) + dto.amount;
    await this.walletRepository.save(wallet);

    // 创建交易记录
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      userId: dto.userId,
      type: TransactionType.CONSUME,
      amount: -dto.amount,
      balanceAfter: wallet.balance,
      relatedId: dto.relatedId,
      relatedType: dto.relatedType,
      description: dto.description,
    });
    await this.transactionRepository.save(transaction);

    logger.info(`消费成功: 扣减${dto.amount}, 剩余${wallet.balance}`);

    return { wallet, transaction };
  }

  /**
   * 退款到钱包
   */
  async refund(
    userId: string,
    amount: number,
    relatedId: string,
    relatedType: string,
    description: string
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    logger.info(`钱包退款: 用户ID=${userId}, 金额=${amount}`);

    // 验证金额
    if (amount <= 0) {
      throw new Error('退款金额必须大于0');
    }

    // 获取钱包
    const wallet = await this.getOrCreateWallet(userId);

    // 增加余额
    wallet.balance = Number(wallet.balance) + amount;
    await this.walletRepository.save(wallet);

    // 创建交易记录
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      userId,
      type: TransactionType.REFUND,
      amount: amount,
      balanceAfter: wallet.balance,
      relatedId,
      relatedType,
      description,
    });
    await this.transactionRepository.save(transaction);

    logger.info(`退款成功: 增加${amount}, 余额${wallet.balance}`);

    return { wallet, transaction };
  }

  /**
   * 申请提现
   */
  async requestWithdrawal(dto: WithdrawalDTO): Promise<WithdrawalRecord> {
    logger.info(`申请提现: 用户ID=${dto.userId}, 金额=${dto.amount}`);

    // 验证金额
    if (dto.amount <= 0) {
      throw new Error('提现金额必须大于0');
    }

    // 获取钱包
    const wallet = await this.getWallet(dto.userId);

    // 检查钱包状态
    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new Error('钱包已冻结或关闭');
    }

    // 检查可用余额
    const availableBalance = Number(wallet.balance) - Number(wallet.frozenAmount);
    if (availableBalance < dto.amount) {
      throw new Error('可用余额不足');
    }

    // 计算手续费（可配置，这里暂时为0）
    const fee = 0;
    const actualAmount = dto.amount - fee;

    // 生成提现单号
    let withdrawalNo = generateWithdrawalNumber();
    let attempts = 0;
    while (await this.withdrawalRepository.findOne({ where: { withdrawalNo } })) {
      withdrawalNo = generateWithdrawalNumber();
      attempts++;
      if (attempts > 10) {
        throw new Error('提现单号生成失败，请重试');
      }
    }

    // 冻结金额
    wallet.frozenAmount = Number(wallet.frozenAmount) + dto.amount;
    await this.walletRepository.save(wallet);

    // 创建冻结交易记录
    const freezeTransaction = this.transactionRepository.create({
      walletId: wallet.id,
      userId: dto.userId,
      type: TransactionType.FREEZE,
      amount: -dto.amount,
      balanceAfter: wallet.balance,
      relatedId: withdrawalNo,
      relatedType: 'withdrawal',
      description: `提现冻结: ${dto.amount}元`,
    });
    await this.transactionRepository.save(freezeTransaction);

    // 创建提现记录
    const withdrawal = this.withdrawalRepository.create({
      withdrawalNo,
      userId: dto.userId,
      walletId: wallet.id,
      amount: dto.amount,
      fee,
      actualAmount,
      method: dto.method,
      account: dto.account,
      accountName: dto.accountName,
      bankName: dto.bankName,
      status: WithdrawalStatus.PENDING,
    });
    await this.withdrawalRepository.save(withdrawal);

    logger.info(`提现申请成功: 提现单号=${withdrawalNo}`);

    return withdrawal;
  }

  /**
   * 处理提现（管理端）
   */
  async processWithdrawal(dto: ProcessWithdrawalDTO): Promise<WithdrawalRecord> {
    logger.info(`处理提现: ID=${dto.withdrawalId}, 审核结果=${dto.approved ? '通过' : '拒绝'}`);

    // 获取提现记录
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { id: dto.withdrawalId },
    });

    if (!withdrawal) {
      throw new Error('提现记录不存在');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new Error('提现记录状态不正确');
    }

    // 获取钱包
    const wallet = await this.getWallet(withdrawal.userId);

    if (dto.approved) {
      // 审核通过：扣减余额，解冻金额
      wallet.balance = Number(wallet.balance) - withdrawal.amount;
      wallet.frozenAmount = Number(wallet.frozenAmount) - withdrawal.amount;
      wallet.totalWithdrawal = Number(wallet.totalWithdrawal) + withdrawal.amount;
      await this.walletRepository.save(wallet);

      // 创建提现交易记录
      const withdrawalTransaction = this.transactionRepository.create({
        walletId: wallet.id,
        userId: withdrawal.userId,
        type: TransactionType.WITHDRAWAL,
        amount: -withdrawal.amount,
        balanceAfter: wallet.balance,
        relatedId: withdrawal.id,
        relatedType: 'withdrawal',
        description: `提现: ${withdrawal.amount}元`,
        operatorId: dto.reviewerId,
      });
      await this.transactionRepository.save(withdrawalTransaction);

      // 更新提现记录
      withdrawal.status = WithdrawalStatus.COMPLETED;
      withdrawal.reviewerId = dto.reviewerId;
      withdrawal.reviewedAt = new Date();
      withdrawal.completedAt = new Date();

      logger.info(`提现审核通过: ${withdrawal.withdrawalNo}`);
    } else {
      // 审核拒绝：解冻金额，不扣减余额
      wallet.frozenAmount = Number(wallet.frozenAmount) - withdrawal.amount;
      await this.walletRepository.save(wallet);

      // 创建解冻交易记录
      const unfreezeTransaction = this.transactionRepository.create({
        walletId: wallet.id,
        userId: withdrawal.userId,
        type: TransactionType.UNFREEZE,
        amount: withdrawal.amount,
        balanceAfter: wallet.balance,
        relatedId: withdrawal.id,
        relatedType: 'withdrawal',
        description: `提现拒绝，解冻: ${withdrawal.amount}元`,
        operatorId: dto.reviewerId,
      });
      await this.transactionRepository.save(unfreezeTransaction);

      // 更新提现记录
      withdrawal.status = WithdrawalStatus.REJECTED;
      withdrawal.reviewerId = dto.reviewerId;
      withdrawal.rejectReason = dto.rejectReason;
      withdrawal.reviewedAt = new Date();

      logger.info(`提现审核拒绝: ${withdrawal.withdrawalNo}`);
    }

    await this.withdrawalRepository.save(withdrawal);

    return withdrawal;
  }

  /**
   * 手动调整余额（管理端）
   */
  async adjustBalance(
    dto: AdjustBalanceDTO
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    logger.info(`手动调整余额: 用户ID=${dto.userId}, 金额=${dto.amount}`);

    // 获取钱包
    const wallet = await this.getOrCreateWallet(dto.userId);

    // 调整余额
    const oldBalance = Number(wallet.balance);
    wallet.balance = oldBalance + dto.amount;

    // 如果是增加余额，更新充值统计
    if (dto.amount > 0) {
      wallet.totalRecharge = Number(wallet.totalRecharge) + dto.amount;
    }

    await this.walletRepository.save(wallet);

    // 创建调整交易记录
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      userId: dto.userId,
      type: TransactionType.ADJUSTMENT,
      amount: dto.amount,
      balanceAfter: wallet.balance,
      description: '管理员手动调整',
      operatorId: dto.operatorId,
      remarks: dto.reason,
    });
    await this.transactionRepository.save(transaction);

    logger.info(`余额调整成功: ${oldBalance} -> ${wallet.balance}`);

    return { wallet, transaction };
  }

  /**
   * 查询交易记录
   */
  async getTransactions(
    dto: TransactionQueryDTO
  ): Promise<{ transactions: WalletTransaction[]; total: number }> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { userId: dto.userId };

    if (dto.type) {
      where.type = dto.type;
    }

    // 时间范围筛选
    // TODO: 需要TypeORM的Between操作符来实现日期范围查询

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return { transactions, total };
  }

  /**
   * 获取提现记录列表（管理端）
   */
  async getWithdrawalList(
    status?: WithdrawalStatus,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ withdrawals: WithdrawalRecord[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [withdrawals, total] = await this.withdrawalRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
      relations: ['user'],
    });

    return { withdrawals, total };
  }

  /**
   * 获取提现详情
   */
  async getWithdrawalDetail(withdrawalId: string): Promise<WithdrawalRecord> {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { id: withdrawalId },
      relations: ['user'],
    });

    if (!withdrawal) {
      throw new Error('提现记录不存在');
    }

    return withdrawal;
  }
}
