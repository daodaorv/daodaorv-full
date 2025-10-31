# MySQL 密码手动重置指南

## 当前状态
- ✅ MySQL 9.3 服务正在运行
- ❌ Root 密码未知
- ❌ 自动重置脚本失败

## 推荐解决方案

### 方案 A: 卸载并重新安装 MySQL (最可靠)

#### 1. 完全卸载 MySQL

```powershell
# 1. 停止服务
Stop-Service MySQL93

# 2. 删除服务
sc.exe delete MySQL93

# 3. 通过控制面板卸载
# 开始菜单 -> 设置 -> 应用 -> MySQL Server 9.3 -> 卸载

# 4. 删除残留文件
Remove-Item "C:\Program Files\MySQL" -Recurse -Force
Remove-Item "C:\ProgramData\MySQL" -Recurse -Force
```

#### 2. 重新安装 MySQL 8.0

1. 下载 MySQL 8.0 安装程序:
   https://dev.mysql.com/downloads/installer/

2. 运行安装程序,选择 "Custom" 安装

3. 选择组件:
   - MySQL Server 8.0
   - MySQL Workbench (可选,用于图形化管理)

4. 配置步骤:
   - **重要**: 设置 root 密码为 `123456`
   - 端口: 3306
   - 字符集: utf8mb4

5. 完成安装

#### 3. 创建数据库

```powershell
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
.\mysql.exe -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS daodao_rv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

#### 4. 验证

```powershell
cd D:\daodao\daodaorv01\backend
node test-mysql-password.js
```

---

### 方案 B: 使用 MySQL Workbench 重置密码

如果已安装 MySQL Workbench:

1. 打开 MySQL Workbench
2. 点击 "Server" -> "Users and Privileges"
3. 如果能登录,选择 root 用户
4. 点击 "Change Password"
5. 设置新密码为 `123456`

---

### 方案 C: 手动 skip-grant-tables 方法

#### 1. 停止 MySQL 服务
```powershell
Stop-Service MySQL93
```

#### 2. 创建配置文件
创建文件 `C:\my-skip.ini`:
```ini
[mysqld]
skip-grant-tables
skip-networking
```

#### 3. 以配置文件启动 MySQL
打开 **管理员权限** 的 PowerShell:
```powershell
cd "C:\Program Files\MySQL\MySQL Server 9.3\bin"
.\mysqld.exe --defaults-file=C:\my-skip.ini --console
```

#### 4. 打开新的 PowerShell 窗口
```powershell
cd "C:\Program Files\MySQL\MySQL Server 9.3\bin"
.\mysql.exe -u root
```

#### 5. 在 MySQL 命令行中执行
```sql
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
FLUSH PRIVILEGES;
EXIT;
```

#### 6. 关闭 skip-grant-tables 模式的 MySQL
在第一个 PowerShell 窗口按 Ctrl+C

#### 7. 删除配置文件并启动服务
```powershell
Remove-Item C:\my-skip.ini
Start-Service MySQL93
```

#### 8. 测试
```powershell
cd D:\daodao\daodaorv01\backend
node test-mysql-password.js
```

---

### 方案 D: 使用便携式 MySQL (无需安装)

#### 1. 下载 MySQL ZIP 版本
https://dev.mysql.com/downloads/mysql/
选择 "Windows (x86, 64-bit), ZIP Archive"

#### 2. 解压
```powershell
# 解压到 D:\mysql
Expand-Archive mysql-8.0.xx-winx64.zip -DestinationPath D:\mysql
cd D:\mysql\mysql-8.0.xx-winx64
```

#### 3. 创建配置文件
创建 `my.ini`:
```ini
[mysqld]
basedir=D:/mysql/mysql-8.0.xx-winx64
datadir=D:/mysql/data
port=3306
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
```

#### 4. 初始化数据目录
```powershell
.\bin\mysqld.exe --initialize-insecure --console
```

#### 5. 启动 MySQL
```powershell
.\bin\mysqld.exe --console
```

#### 6. 在新窗口设置密码
```powershell
cd D:\mysql\mysql-8.0.xx-winx64\bin
.\mysql.exe -u root --skip-password
```

在 MySQL 中:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
CREATE DATABASE daodao_rv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 7. 更新项目配置
编辑 `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=123456
DB_DATABASE=daodao_rv
```

---

## 验证步骤

完成任何一个方案后,执行以下验证:

### 1. 测试密码
```powershell
cd D:\daodao\daodaorv01\backend
node test-mysql-password.js
```

应该看到:
```
✅ 成功! 密码是: "123456"
```

### 2. 测试数据库连接
```powershell
npx ts-node test-db-connection.ts
```

应该看到:
```
✅ 数据库连接成功
✅ 所有检查通过!
```

### 3. 运行测试
```powershell
npm test
```

---

## 推荐方案

**最快**: 方案 C (手动 skip-grant-tables) - 约 5 分钟  
**最可靠**: 方案 A (重新安装) - 约 15 分钟  
**最灵活**: 方案 D (便携式) - 约 10 分钟

建议选择 **方案 A** 或 **方案 C**。

---

## 需要帮助?

如果以上方案都不成功,请提供以下信息:
1. MySQL 版本: `mysql --version`
2. 服务状态: `Get-Service MySQL*`
3. 错误日志: `C:\ProgramData\MySQL\MySQL Server 9.3\Data\*.err`

