import { CustomerServiceSessionService } from '../services/customer-service-session.service';
import { CustomerServiceMessageService } from '../services/customer-service-message.service';
import { CustomerServiceTicketService } from '../services/customer-service-ticket.service';
import { QuickReplyService } from '../services/quick-reply.service';
import { SessionSource, SessionStatus } from '../entities/CustomerServiceSession';
import { SenderType, MessageType } from '../entities/CustomerServiceMessage';
import { TicketCategory, TicketStatus } from '../entities/CustomerServiceTicket';

export class CustomerServiceController {
  private sessionService: CustomerServiceSessionService;
  private messageService: CustomerServiceMessageService;
  private ticketService: CustomerServiceTicketService;

  constructor() {
    this.sessionService = new CustomerServiceSessionService();
    this.messageService = new CustomerServiceMessageService();
    this.ticketService = new CustomerServiceTicketService();
  }

  async createSession(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { source, relatedOrderId, relatedOrderType } = ctx.request.body as {
      source: SessionSource;
      relatedOrderId?: string;
      relatedOrderType?: string;
    };
    if (!source) {
      ctx.error(400, '来源渠道不能为空');
      return;
    }
    const session = await this.sessionService.createSession({ userId, source, relatedOrderId, relatedOrderType });
    ctx.success(session, '会话创建成功');
  }

  async getMySessions(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { page, pageSize, status } = ctx.query;
    const result = await this.sessionService.getSessionList({
      userId,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as SessionStatus,
    });
    ctx.success(result, '获取会话列表成功');
  }

  async getSessionDetail(ctx: any) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.userId;
    const session = await this.sessionService.getSessionById(id);
    if (session.userId !== userId) {
      ctx.error(403, '无权访问此会话');
      return;
    }
    ctx.success(session, '获取会话详情成功');
  }

  async sendMessage(ctx: any) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.userId;
    const { messageType, content, mediaUrl } = ctx.request.body as { messageType: MessageType; content: string; mediaUrl?: string };
    const session = await this.sessionService.getSessionById(id);
    if (session.userId !== userId) {
      ctx.error(403, '无权访问此会话');
      return;
    }
    if (!messageType || !content) {
      ctx.error(400, '消息类型和内容不能为空');
      return;
    }
    const message = await this.messageService.sendMessage({ sessionId: id, senderType: SenderType.USER, senderId: userId, messageType, content, mediaUrl });
    ctx.success(message, '消息发送成功');
  }

  async getMessages(ctx: any) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.userId;
    const { page, pageSize } = ctx.query;
    const session = await this.sessionService.getSessionById(id);
    if (session.userId !== userId) {
      ctx.error(403, '无权访问此会话');
      return;
    }
    const result = await this.messageService.getMessageList({ sessionId: id, page: page ? parseInt(page as string) : undefined, pageSize: pageSize ? parseInt(pageSize as string) : undefined });
    await this.messageService.markSessionMessagesAsRead(id, userId);
    ctx.success(result, '获取消息列表成功');
  }

  async closeSession(ctx: any) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.userId;
    const session = await this.sessionService.getSessionById(id);
    if (session.userId !== userId) {
      ctx.error(403, '无权访问此会话');
      return;
    }
    const updatedSession = await this.sessionService.closeSession(id);
    ctx.success(updatedSession, '会话已关闭');
  }

  async rateSession(ctx: any) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.userId;
    const { satisfaction, comment } = ctx.request.body as { satisfaction: number; comment?: string };
    const session = await this.sessionService.getSessionById(id);
    if (session.userId !== userId) {
      ctx.error(403, '无权访问此会话');
      return;
    }
    if (!satisfaction) {
      ctx.error(400, '满意度评分不能为空');
      return;
    }
    const updatedSession = await this.sessionService.rateSession(id, { satisfaction, comment });
    ctx.success(updatedSession, '评价成功');
  }

  async createTicket(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { category, title, description, attachments } = ctx.request.body as { category: TicketCategory; title: string; description: string; attachments?: string[] };
    if (!category || !title || !description) {
      ctx.error(400, '工单类别、标题和描述不能为空');
      return;
    }
    const ticket = await this.ticketService.createTicket({ userId, category, title, description, attachments });
    ctx.success(ticket, '工单创建成功');
  }

  async getMyTickets(ctx: any) {
    const userId = ctx.state.user?.userId;
    const { page, pageSize, status } = ctx.query;
    const result = await this.ticketService.getTicketList({ userId, page: page ? parseInt(page as string) : undefined, pageSize: pageSize ? parseInt(pageSize as string) : undefined, status: status as TicketStatus });
    ctx.success(result, '获取工单列表成功');
  }

  async getTicketDetail(ctx: any) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.userId;
    const ticket = await this.ticketService.getTicketById(id);
    if (ticket.userId !== userId) {
      ctx.error(403, '无权访问此工单');
      return;
    }
    ctx.success(ticket, '获取工单详情成功');
  }
}

export class StaffCustomerServiceController {
  private sessionService: CustomerServiceSessionService;
  private quickReplyService: QuickReplyService;

  constructor() {
    this.sessionService = new CustomerServiceSessionService();
    this.quickReplyService = new QuickReplyService();
  }

  async getSessionList(ctx: any) {
    const staffId = ctx.state.user?.userId;
    const { page, pageSize, status } = ctx.query;
    const result = await this.sessionService.getSessionList({ staffId, page: page ? parseInt(page as string) : undefined, pageSize: pageSize ? parseInt(pageSize as string) : undefined, status: status as SessionStatus });
    ctx.success(result, '获取会话列表成功');
  }

  async acceptSession(ctx: any) {
    const { id } = ctx.params;
    const staffId = ctx.state.user?.userId;
    const session = await this.sessionService.acceptSession(id, staffId);
    ctx.success(session, '会话已接受');
  }

  async transferSession(ctx: any) {
    const { id } = ctx.params;
    const { targetStaffId, reason } = ctx.request.body as { targetStaffId: string; reason: string };
    if (!targetStaffId || !reason) {
      ctx.error(400, '目标客服和转接原因不能为空');
      return;
    }
    const session = await this.sessionService.transferSession(id, { targetStaffId, reason });
    ctx.success(session, '会话已转接');
  }

  async getQuickReplies(ctx: any) {
    const { category, keyword } = ctx.query;
    const result = await this.quickReplyService.getQuickReplyList({ category: category as string, keyword: keyword as string, isActive: true });
    ctx.success(result, '获取快捷回复列表成功');
  }
}
