// 简单的测试脚本
console.log('Starting test server...');

const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000, () => {
  console.log('Test server running on http://localhost:3000');
});

