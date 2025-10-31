# 重置 MySQL Root 密码指南

## 方法 1: 使用 MySQL 安全模式 (推荐)

### 步骤 1: 停止 MySQL 服务
```powershell
Stop-Service MySQL93
```

### 步骤 2: 创建初始化文件
创建文件 `C:\mysql-init.txt`,内容如下:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
FLUSH PRIVILEGES;
```

### 步骤 3: 以初始化文件启动 MySQL
找到 MySQL 安装目录(通常是 `C:\Program Files\MySQL\MySQL Server 9.3\bin\`),然后执行:

```powershell
cd "C:\Program Files\MySQL\MySQL Server 9.3\bin"
.\mysqld.exe --init-file=C:\mysql-init.txt --console
```

等待看到 "ready for connections" 消息后,按 Ctrl+C 停止。

### 步骤 4: 删除初始化文件并重启服务
```powershell
Remove-Item C:\mysql-init.txt
Start-Service MySQL93
```

### 步骤 5: 测试连接
```powershell
cd D:\daodao\daodaorv01\backend
node test-mysql-password.js
```

---

## 方法 2: 使用 mysqladmin (如果知道当前密码)

如果您知道当前的 root 密码,可以直接使用 mysqladmin 修改:

```powershell
# 找到 MySQL bin 目录
cd "C:\Program Files\MySQL\MySQL Server 9.3\bin"

# 修改密码 (将 OLD_PASSWORD 替换为当前密码)
.\mysqladmin.exe -u root -p OLD_PASSWORD password 123456
```

---

## 方法 3: 卸载并重新安装 MySQL

### 步骤 1: 卸载 MySQL
```powershell
# 停止服务
Stop-Service MySQL93

# 删除服务
sc.exe delete MySQL93

# 卸载 MySQL (通过控制面板或命令)
# 控制面板 -> 程序和功能 -> MySQL Server 9.3 -> 卸载
```

### 步骤 2: 清理残留文件
删除以下目录(如果存在):
- `C:\Program Files\MySQL\`
- `C:\ProgramData\MySQL\`
- `C:\Users\[YourUsername]\AppData\Roaming\MySQL\`

### 步骤 3: 重新安装 MySQL

1. 下载 MySQL 8.0 安装程序: https://dev.mysql.com/downloads/mysql/
2. 运行安装程序
3. 选择 "Developer Default" 或 "Server only"
4. 在配置步骤中,设置 root 密码为 `123456`
5. 完成安装

### 步骤 4: 创建数据库
```powershell
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
.\mysql.exe -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS daodao_rv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## 方法 4: 使用便携式 MySQL (最简单)

如果以上方法都不行,可以使用便携式 MySQL:

### 步骤 1: 下载 MySQL ZIP 版本
从 https://dev.mysql.com/downloads/mysql/ 下载 Windows ZIP Archive

### 步骤 2: 解压到项目目录
```powershell
# 解压到 D:\daodao\mysql
Expand-Archive mysql-8.0.xx-winx64.zip -DestinationPath D:\daodao\mysql
```

### 步骤 3: 初始化 MySQL
```powershell
cd D:\daodao\mysql\bin
.\mysqld.exe --initialize-insecure --console
```

### 步骤 4: 启动 MySQL
```powershell
.\mysqld.exe --console
```

### 步骤 5: 在新窗口设置密码
```powershell
cd D:\daodao\mysql\bin
.\mysql.exe -u root --skip-password
```

在 MySQL 命令行中:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';
CREATE DATABASE daodao_rv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

## 验证

无论使用哪种方法,最后都要验证连接:

```powershell
cd D:\daodao\daodaorv01\backend
node test-mysql-password.js
```

应该看到:
```
✅ 成功! 密码是: "123456"
```

然后运行:
```powershell
npx ts-node test-db-connection.ts
```

应该看到:
```
✅ 数据库连接成功
✅ 所有检查通过!
```

---

## 推荐方案

**最快速**: 方法 1 (使用安全模式重置密码)  
**最干净**: 方法 3 (重新安装)  
**最简单**: 方法 4 (便携式 MySQL)

选择适合您的方法执行即可。

