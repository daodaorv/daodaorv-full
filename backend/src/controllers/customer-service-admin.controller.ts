import { CustomerServiceSessionService } from '../services/customer-service-session.service';
import { CustomerServiceTicketService } from '../services/customer-service-ticket.service';
import { QuickReplyService } from '../services/quick-reply.service';
import { SessionStatus } from '../entities/CustomerServiceSession';
import { TicketStatus } from '../entities/CustomerServiceTicket';

export class CustomerServiceAdminController {
  private sessionService: CustomerServiceSessionService;
  private ticketService: CustomerServiceTicketService;
  private quickReplyService: QuickReplyService;

  constructor() {
    this.sessionService = new CustomerServiceSessionService();
    this.ticketService = new CustomerServiceTicketService();
    this.quickReplyService = new QuickReplyService();
  }

  async getAllSessions(ctx: any) {
    const { page, pageSize, status, storeId } = ctx.query;
    const result = await this.sessionService.getSessionList({ page: page ? parseInt(page as string) : undefined, pageSize: pageSize ? parseInt(pageSize as string) : undefined, status: status as SessionStatus, storeId: storeId as string });
    ctx.success(result, '获取会话列表成功');
  }

  async getAllTickets(ctx: any) {
    const { page, pageSize, status, category } = ctx.query;
    const result = await this.ticketService.getTicketList({ page: page ? parseInt(page as string) : undefined, pageSize: pageSize ? parseInt(pageSize as string) : undefined, status: status as TicketStatus, category: category as any });
    ctx.success(result, '获取工单列表成功');
  }

  async assignTicket(ctx: any) {
    const { id } = ctx.params;
    const { staffId } = ctx.request.body as { staffId: string };
    if (!staffId) {
      ctx.error(400, '客服人员ID不能为空');
      return;
    }
    const ticket = await this.ticketService.assignTicket(id, staffId);
    ctx.success(ticket, '工单已分配');
  }

  async createQuickReply(ctx: any) {
    const { category, title, content, keywords } = ctx.request.body as { category: string; title: string; content: string; keywords?: string[] };
    if (!category || !title || !content) {
      ctx.error(400, '分类、标题和内容不能为空');
      return;
    }
    const quickReply = await this.quickReplyService.createQuickReply({ category, title, content, keywords });
    ctx.success(quickReply, '快捷回复创建成功');
  }

  async updateQuickReply(ctx: any) {
    const { id } = ctx.params;
    const { category, title, content, keywords, isActive } = ctx.request.body as { category?: string; title?: string; content?: string; keywords?: string[]; isActive?: boolean };
    const quickReply = await this.quickReplyService.updateQuickReply(id, { category, title, content, keywords, isActive });
    ctx.success(quickReply, '快捷回复已更新');
  }

  async deleteQuickReply(ctx: any) {
    const { id } = ctx.params;
    await this.quickReplyService.deleteQuickReply(id);
    ctx.success(null, '快捷回复已删除');
  }

  async getQuickReplies(ctx: any) {
    const { page, pageSize, category, keyword } = ctx.query;
    const result = await this.quickReplyService.getQuickReplyList({ page: page ? parseInt(page as string) : undefined, pageSize: pageSize ? parseInt(pageSize as string) : undefined, category: category as string, keyword: keyword as string });
    ctx.success(result, '获取快捷回复列表成功');
  }

  async getStatistics(ctx: any) {
    const statistics = { totalSessions: 0, waitingSessions: 0, servingSessions: 0, closedSessions: 0, averageResponseTime: 0, averageSatisfaction: 0, totalTickets: 0, pendingTickets: 0 };
    ctx.success(statistics, '获取统计数据成功');
  }
}
