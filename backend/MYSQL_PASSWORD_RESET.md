# MySQL 密码重置指南

## 问题描述

测试环境无法连接到 MySQL 数据库,原因是 root 用户密码不正确。

## 解决方案

### 方案 1: 重置 MySQL root 密码

1. **停止 MySQL 服务**
   ```powershell
   Stop-Service MySQL93
   ```

2. **以安全模式启动 MySQL**(跳过权限验证)
   ```powershell
   # 找到 MySQL 安装目录,通常在:
   # C:\Program Files\MySQL\MySQL Server 9.3\bin\
   
   cd "C:\Program Files\MySQL\MySQL Server 9.3\bin"
   .\mysqld.exe --skip-grant-tables --console
   ```

3. **打开新的 PowerShell 窗口,连接 MySQL**
   ```powershell
   cd "C:\Program Files\MySQL\MySQL Server 9.3\bin"
   .\mysql.exe -u root
   ```

4. **重置密码**
   ```sql
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **重启 MySQL 服务**
   ```powershell
   # 关闭安全模式的 MySQL (Ctrl+C)
   Start-Service MySQL93
   ```

### 方案 2: 创建新的测试用户

如果不想修改 root 密码,可以创建一个专门用于测试的用户:

1. **使用当前的 root 密码登录 MySQL**
   ```powershell
   # 需要知道当前的 root 密码
   mysql -u root -p
   ```

2. **创建测试用户**
   ```sql
   CREATE USER 'daodao_test'@'localhost' IDENTIFIED BY 'test123456';
   GRANT ALL PRIVILEGES ON daodao_rv.* TO 'daodao_test'@'localhost';
   GRANT ALL PRIVILEGES ON daodao_rv_test.* TO 'daodao_test'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **更新 .env 文件**
   ```env
   DB_USERNAME=daodao_test
   DB_PASSWORD=test123456
   ```

### 方案 3: 使用 Docker MySQL (推荐)

使用 Docker 容器运行 MySQL,密码可控:

1. **启动 Docker MySQL 容器**
   ```powershell
   docker run -d `
     --name daodao-mysql `
     -p 3307:3306 `
     -e MYSQL_ROOT_PASSWORD=123456 `
     -e MYSQL_DATABASE=daodao_rv `
     mysql:8.0
   ```

2. **更新 .env 文件**
   ```env
   DB_PORT=3307
   DB_PASSWORD=123456
   ```

## 验证连接

运行测试脚本验证连接:

```bash
node test-mysql-password.js
```

或者:

```bash
npx ts-node test-db-connection.ts
```

## 当前状态

- ✅ TypeORM 实体配置正确
- ✅ Jest 测试配置已修复
- ❌ MySQL 连接失败 - 需要重置密码或创建测试用户

## 下一步

1. 选择上述方案之一解决 MySQL 密码问题
2. 验证数据库连接成功
3. 运行测试: `npm test`
4. 确保所有测试通过

