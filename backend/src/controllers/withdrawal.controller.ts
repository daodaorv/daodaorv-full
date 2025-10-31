import { WalletService, ProcessWithdrawalDTO } from '../services/wallet.service';
import { WithdrawalStatus } from '../entities/WithdrawalRecord';
import { logger } from '../utils/logger';
import { maskPhone, maskIdCard, maskBankCard } from '../utils/data-mask';

/**
 * 提现管理控制器 - 管理端API
 */
export class WithdrawalController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  /**
   * 获取提现记录列表（管理端）
   * GET /api/admin/withdrawals
   */
  getWithdrawalList = async (ctx: any): Promise<void> => {
    try {
      const { status, page = 1, pageSize = 20 } = ctx.query;

      const { withdrawals, total } = await this.walletService.getWithdrawalList(
        status as WithdrawalStatus,
        parseInt(page),
        parseInt(pageSize)
      );

      // 格式化并脱敏
      const formattedWithdrawals = withdrawals.map(w => ({
        id: w.id,
        withdrawalNo: w.withdrawalNo,
        userId: w.userId,
        userName: w.user?.realName || w.user?.nickname || '未知用户',
        phone: maskPhone(w.user?.phone || ''),
        amount: Number(w.amount).toFixed(2),
        fee: Number(w.fee).toFixed(2),
        actualAmount: Number(w.actualAmount).toFixed(2),
        method: w.method,
        account: this.maskAccount(w.account, w.method),
        accountName: w.accountName,
        bankName: w.bankName,
        status: w.status,
        createdAt: w.createdAt,
        reviewedAt: w.reviewedAt,
        completedAt: w.completedAt,
        reviewerId: w.reviewerId,
        rejectReason: w.rejectReason,
      }));

      ctx.success({
        withdrawals: formattedWithdrawals,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      });
    } catch (error: any) {
      logger.error('获取提现记录列表失败', error);
      ctx.error(500, error.message || '获取提现记录列表失败');
    }
  };

  /**
   * 获取提现详情（管理端）
   * GET /api/admin/withdrawals/:id
   */
  getWithdrawalDetail = async (ctx: any): Promise<void> => {
    try {
      const { id } = ctx.params;

      const withdrawal = await this.walletService.getWithdrawalDetail(id);

      ctx.success({
        id: withdrawal.id,
        withdrawalNo: withdrawal.withdrawalNo,
        userId: withdrawal.userId,
        userName: withdrawal.user?.realName || withdrawal.user?.nickname || '未知用户',
        phone: withdrawal.user?.phone,
        idCard: maskIdCard(withdrawal.user?.idCard || ''),
        amount: Number(withdrawal.amount).toFixed(2),
        fee: Number(withdrawal.fee).toFixed(2),
        actualAmount: Number(withdrawal.actualAmount).toFixed(2),
        method: withdrawal.method,
        account: withdrawal.account,
        accountName: withdrawal.accountName,
        bankName: withdrawal.bankName,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        reviewedAt: withdrawal.reviewedAt,
        completedAt: withdrawal.completedAt,
        reviewerId: withdrawal.reviewerId,
        rejectReason: withdrawal.rejectReason,
      });
    } catch (error: any) {
      logger.error('获取提现详情失败', error);
      if (error.message === '提现记录不存在') {
        ctx.error(404, error.message);
      } else {
        ctx.error(500, error.message || '获取提现详情失败');
      }
    }
  };

  /**
   * 审核提现申请（管理端）
   * POST /api/admin/withdrawals/:id/review
   */
  reviewWithdrawal = async (ctx: any): Promise<void> => {
    try {
      const { id } = ctx.params;
      const { approved, rejectReason } = ctx.request.body as any;
      const reviewerId = ctx.state.user.userId;

      // 验证输入
      if (typeof approved !== 'boolean') {
        ctx.error(400, '审核结果参数错误');
        return;
      }

      if (!approved && !rejectReason) {
        ctx.error(400, '拒绝提现时必须填写拒绝原因');
        return;
      }

      const dto: ProcessWithdrawalDTO = {
        withdrawalId: id,
        approved,
        rejectReason,
        reviewerId,
      };

      const withdrawal = await this.walletService.processWithdrawal(dto);

      ctx.success(
        {
          id: withdrawal.id,
          withdrawalNo: withdrawal.withdrawalNo,
          status: withdrawal.status,
          reviewedAt: withdrawal.reviewedAt,
        },
        approved ? '提现审核通过' : '提现已拒绝'
      );
    } catch (error: any) {
      logger.error('审核提现失败', error);
      if (error.message === '提现记录不存在' || error.message === '提现记录状态不正确') {
        ctx.error(400, error.message);
      } else {
        ctx.error(500, error.message || '审核提现失败');
      }
    }
  };

  /**
   * 手动调整余额（管理端）
   * POST /api/admin/wallet/adjust
   */
  adjustBalance = async (ctx: any): Promise<void> => {
    try {
      const { userId, amount, reason } = ctx.request.body as any;
      const operatorId = ctx.state.user.userId;

      // 验证输入
      if (!userId) {
        ctx.error(400, '用户ID不能为空');
        return;
      }

      if (!amount || isNaN(amount)) {
        ctx.error(400, '调整金额无效');
        return;
      }

      if (!reason) {
        ctx.error(400, '调整原因不能为空');
        return;
      }

      const { wallet, transaction } = await this.walletService.adjustBalance({
        userId,
        amount: parseFloat(amount),
        reason,
        operatorId,
      });

      ctx.success(
        {
          walletId: wallet.id,
          userId: wallet.userId,
          newBalance: Number(wallet.balance).toFixed(2),
          adjustAmount: Number(transaction.amount).toFixed(2),
          reason,
        },
        '余额调整成功'
      );
    } catch (error: any) {
      logger.error('调整余额失败', error);
      ctx.error(500, error.message || '调整余额失败');
    }
  };

  /**
   * 账号脱敏
   */
  private maskAccount(account: string, method: string): string {
    if (method === 'bank') {
      return maskBankCard(account);
    }
    // 微信/支付宝账号（手机号/邮箱）
    if (account.includes('@')) {
      const [user, domain] = account.split('@');
      return `${user.substring(0, 3)}****@${domain}`;
    }
    return maskPhone(account);
  }
}
