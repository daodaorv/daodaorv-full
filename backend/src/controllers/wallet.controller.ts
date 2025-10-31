import { WalletService, WithdrawalDTO, TransactionQueryDTO } from '../services/wallet.service';
import { logger } from '../utils/logger';

/**
 * 钱包控制器 - 用户端API
 */
export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  /**
   * 获取钱包信息
   * GET /api/wallet
   */
  getWalletInfo = async (ctx: any): Promise<void> => {
    try {
      const userId = ctx.state.user.userId;

      const wallet = await this.walletService.getOrCreateWallet(userId);

      // 计算可用余额
      const availableBalance = (Number(wallet.balance) - Number(wallet.frozenAmount)).toFixed(2);

      ctx.success({
        id: wallet.id,
        balance: Number(wallet.balance).toFixed(2),
        frozenAmount: Number(wallet.frozenAmount).toFixed(2),
        availableBalance,
        totalRecharge: Number(wallet.totalRecharge).toFixed(2),
        totalConsume: Number(wallet.totalConsume).toFixed(2),
        totalWithdrawal: Number(wallet.totalWithdrawal).toFixed(2),
        status: wallet.status,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      });
    } catch (error: any) {
      logger.error('获取钱包信息失败', error);
      ctx.error(500, error.message || '获取钱包信息失败');
    }
  };

  /**
   * 获取交易记录
   * GET /api/wallet/transactions
   */
  getTransactions = async (ctx: any): Promise<void> => {
    try {
      const userId = ctx.state.user.userId;
      const { type, startDate, endDate, page = 1, pageSize = 20 } = ctx.query;

      const query: TransactionQueryDTO = {
        userId,
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      };

      const { transactions, total } = await this.walletService.getTransactions(query);

      // 格式化交易记录
      const formattedTransactions = transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount).toFixed(2),
        balanceAfter: Number(t.balanceAfter).toFixed(2),
        description: t.description,
        relatedId: t.relatedId,
        relatedType: t.relatedType,
        createdAt: t.createdAt,
      }));

      ctx.success({
        transactions: formattedTransactions,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      });
    } catch (error: any) {
      logger.error('获取交易记录失败', error);
      ctx.error(500, error.message || '获取交易记录失败');
    }
  };

  /**
   * 申请提现
   * POST /api/wallet/withdraw
   */
  requestWithdrawal = async (ctx: any): Promise<void> => {
    try {
      const userId = ctx.state.user.userId;
      const { amount, method, account, accountName, bankName } = ctx.request.body as any;

      // 验证输入
      if (!amount || amount <= 0) {
        ctx.error(400, '提现金额必须大于0');
        return;
      }

      if (!method || !['wechat', 'alipay', 'bank_card'].includes(method)) {
        ctx.error(400, '提现方式无效');
        return;
      }

      if (!account) {
        ctx.error(400, '收款账号不能为空');
        return;
      }

      // 银行卡提现需要提供开户人和银行名称
      if (method === 'bank_card') {
        if (!accountName || !bankName) {
          ctx.error(400, '银行卡提现需要提供开户人和银行名称');
          return;
        }
      }

      const dto: WithdrawalDTO = {
        userId,
        amount: parseFloat(amount),
        method,
        account,
        accountName,
        bankName,
      };

      const withdrawal = await this.walletService.requestWithdrawal(dto);

      ctx.success(
        {
          id: withdrawal.id,
          withdrawalNo: withdrawal.withdrawalNo,
          amount: Number(withdrawal.amount).toFixed(2),
          fee: Number(withdrawal.fee).toFixed(2),
          actualAmount: Number(withdrawal.actualAmount).toFixed(2),
          method: withdrawal.method,
          status: withdrawal.status,
          createdAt: withdrawal.createdAt,
        },
        '提现申请成功，等待审核'
      );
    } catch (error: any) {
      logger.error('申请提现失败', error);
      if (error.message.includes('余额不足') || error.message.includes('钱包已冻结')) {
        ctx.error(400, error.message);
      } else {
        ctx.error(500, error.message || '申请提现失败');
      }
    }
  };

  /**
   * 获取提现记录
   * GET /api/wallet/withdrawals
   */
  getWithdrawals = async (ctx: any): Promise<void> => {
    try {
      const userId = ctx.state.user.userId;
      const { page = 1, pageSize = 20 } = ctx.query;

      // 查询提现记录
      const { withdrawals } = await this.walletService.getWithdrawalList(
        undefined,
        parseInt(page),
        parseInt(pageSize)
      );

      // 过滤出当前用户的提现记录
      const userWithdrawals = withdrawals.filter(w => w.userId === userId);
      const userTotal = userWithdrawals.length;

      const formattedWithdrawals = userWithdrawals.map(w => ({
        id: w.id,
        withdrawalNo: w.withdrawalNo,
        amount: Number(w.amount).toFixed(2),
        fee: Number(w.fee).toFixed(2),
        actualAmount: Number(w.actualAmount).toFixed(2),
        method: w.method,
        status: w.status,
        account: w.account.replace(/(.{4}).*(.{4})/, '$1****$2'), // 脱敏
        createdAt: w.createdAt,
        reviewedAt: w.reviewedAt,
        completedAt: w.completedAt,
        rejectReason: w.rejectReason,
      }));

      ctx.success({
        withdrawals: formattedWithdrawals,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: userTotal,
          totalPages: Math.ceil(userTotal / parseInt(pageSize)),
        },
      });
    } catch (error: any) {
      logger.error('获取提现记录失败', error);
      ctx.error(500, error.message || '获取提现记录失败');
    }
  };
}
