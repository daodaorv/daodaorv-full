import { Router } from 'koa-router';
import { DebugController } from '../controllers/debug.controller';

const router = new Router();

// 获取数据库信息和所有表
router.get('/database-info', DebugController.getDatabaseInfo);

// 获取特定表的数据
router.get('/table/:tableName', DebugController.getTableData);

export default router;