# development-environment Specification

## Purpose
TBD - created by archiving change setup-development-environment. Update Purpose after archive.
## Requirements
### Requirement: 开发环境一致性
开发团队 MUST 使用统一的开发环境配置,确保代码在不同开发者机器上的一致性。

#### Scenario: 安装Node.js环境
- **WHEN** 开发者首次搭建开发环境
- **THEN** 系统 SHALL 要求安装Node.js 18.x LTS版本
- **AND** 验证Node.js版本符合要求 (`node -v` 输出 v18.x.x)
- **AND** 验证npm版本 >= 9.0.0 (`npm -v` 输出 >= 9.0.0)

#### Scenario: 安装Docker环境
- **WHEN** 开发者需要搭建数据库环境
- **THEN** 系统 SHALL 要求安装Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- **AND** 验证Docker安装成功 (`docker --version` 输出版本信息)
- **AND** 验证Docker服务运行中 (`docker ps` 命令可执行)

#### Scenario: 配置VSCode开发工具
- **WHEN** 开发者使用VSCode进行开发
- **THEN** 系统 SHALL 提供推荐扩展列表 (.vscode/extensions.json)
- **AND** 包含必需扩展: Vue Language Features, TypeScript Vue Plugin, ESLint, Prettier
- **AND** 提供统一的工作区设置 (.vscode/settings.json)

### Requirement: 后端开发环境
后端服务 MUST 使用Node.js + Koa2 + TypeScript技术栈,并配置完整的开发工具链。

#### Scenario: 初始化后端项目
- **WHEN** 开发者首次搭建后端环境
- **THEN** 系统 SHALL 创建backend目录及标准子目录结构
- **AND** 包含目录: src/controllers, src/services, src/models, src/middlewares, src/utils, src/config, src/routes, src/sockets, tests
- **AND** 创建package.json配置文件,包含所有必需依赖
- **AND** 创建tsconfig.json配置TypeScript编译选项

#### Scenario: 安装后端依赖
- **WHEN** 开发者在backend目录执行 `npm install`
- **THEN** 系统 SHALL 安装所有package.json中定义的依赖包
- **AND** 依赖安装成功,无错误信息
- **AND** 生成node_modules目录和package-lock.json文件

#### Scenario: 配置代码规范工具
- **WHEN** 后端项目需要统一代码风格
- **THEN** 系统 SHALL 配置ESLint进行代码检查
- **AND** 配置Prettier进行代码格式化
- **AND** 创建.eslintrc.json和.prettierrc.json配置文件
- **AND** 所有代码提交前 MUST 通过ESLint检查

#### Scenario: 启动后端开发服务
- **WHEN** 开发者执行 `npm run dev`
- **THEN** 系统 SHALL 使用nodemon和ts-node启动开发服务器
- **AND** 服务器监听3000端口
- **AND** 代码修改后自动重启服务
- **AND** 控制台输出启动成功信息

### Requirement: 数据库环境
数据库环境 MUST 使用Docker容器化部署,确保环境隔离和一致性。

#### Scenario: 清理旧数据库容器
- **WHEN** 本地Docker中存在旧的数据库容器
- **THEN** 开发者 MUST 先停止旧容器 (`docker stop <container-id>`)
- **AND** 删除旧容器 (`docker rm <container-id>`)
- **AND** 清理旧数据卷 (`docker volume prune`)
- **AND** 确认无相关容器运行 (`docker ps -a` 不显示相关容器)

#### Scenario: 创建MySQL容器
- **WHEN** 开发者需要MySQL数据库环境
- **THEN** 系统 SHALL 使用Docker创建MySQL 8.0容器
- **AND** 容器名称为 daodao-mysql
- **AND** 映射端口3306到主机3306
- **AND** 设置root密码为 daodao123456
- **AND** 创建默认数据库 daodao_rv
- **AND** 使用数据卷持久化数据 (daodao-mysql-data)

#### Scenario: 创建Redis容器
- **WHEN** 开发者需要Redis缓存环境
- **THEN** 系统 SHALL 使用Docker创建Redis 7.x容器
- **AND** 容器名称为 daodao-redis
- **AND** 映射端口6379到主机6379
- **AND** 使用数据卷持久化数据 (daodao-redis-data)
- **AND** 使用Redis Alpine镜像减小体积

#### Scenario: 验证数据库容器运行
- **WHEN** 数据库容器创建完成
- **THEN** 开发者 SHALL 执行 `docker ps` 验证容器运行
- **AND** 显示daodao-mysql容器状态为Up
- **AND** 显示daodao-redis容器状态为Up
- **AND** 端口映射正确显示

#### Scenario: 初始化数据库结构
- **WHEN** MySQL容器运行成功
- **THEN** 系统 SHALL 根据docs/数据字典.md创建初始化脚本
- **AND** 执行脚本创建所有必需的数据表
- **AND** 创建必要的索引和外键约束
- **AND** 插入初始化数据(如果需要)

#### Scenario: 配置数据库连接
- **WHEN** 后端服务需要连接数据库
- **THEN** 系统 SHALL 配置TypeORM连接参数
- **AND** 连接参数包含: host, port, username, password, database
- **AND** 启用连接池管理
- **AND** 配置日志记录SQL查询(开发环境)

### Requirement: 前端开发环境
前端项目 MUST 使用统一的技术栈和构建工具,确保开发体验一致。

#### Scenario: 初始化C端小程序项目
- **WHEN** 开发者搭建C端小程序环境
- **THEN** 系统 SHALL 创建miniprogram目录及标准结构
- **AND** 使用Taro 3.6+ + Vue 3 + NutUI技术栈
- **AND** 配置支持微信、支付宝、抖音小程序和H5编译
- **AND** 创建package.json、tsconfig.json、project.config.json配置文件

#### Scenario: 初始化PC管理端项目
- **WHEN** 开发者搭建PC管理端环境
- **THEN** 系统 SHALL 创建admin-console目录及标准结构
- **AND** 使用Vue 3 + Vite + Element Plus技术栈
- **AND** 配置Vite构建工具和开发服务器
- **AND** 创建package.json、vite.config.ts、tsconfig.json配置文件

#### Scenario: 初始化移动管理端项目
- **WHEN** 开发者搭建移动管理端环境
- **THEN** 系统 SHALL 创建mobile-admin目录及标准结构
- **AND** 使用Taro 3.6+ + Vue 3 + NutUI技术栈
- **AND** 配置支持微信小程序编译
- **AND** 创建package.json、tsconfig.json、project.config.json配置文件

#### Scenario: 安装前端依赖
- **WHEN** 开发者在各前端项目目录执行 `npm install`
- **THEN** 系统 SHALL 安装所有package.json中定义的依赖包
- **AND** 依赖安装成功,无错误信息
- **AND** 生成node_modules目录和package-lock.json文件

#### Scenario: 启动前端开发服务
- **WHEN** 开发者启动前端开发服务
- **THEN** C端小程序 SHALL 执行 `npm run dev:weapp` 启动微信小程序编译
- **AND** PC管理端 SHALL 执行 `npm run dev` 启动Vite开发服务器(端口3001)
- **AND** 移动管理端 SHALL 执行 `npm run dev:weapp` 启动微信小程序编译
- **AND** 代码修改后自动热更新

### Requirement: 开发工具配置
开发工具 MUST 统一配置,提升开发效率和代码质量。

#### Scenario: 配置VSCode推荐扩展
- **WHEN** 开发者使用VSCode打开项目
- **THEN** 系统 SHALL 提示安装推荐扩展
- **AND** 推荐扩展包含: Vue Language Features (Volar), TypeScript Vue Plugin, ESLint, Prettier, GitLens
- **AND** 扩展配置保存在.vscode/extensions.json

#### Scenario: 配置VSCode工作区设置
- **WHEN** 开发者使用VSCode进行开发
- **THEN** 系统 SHALL 提供统一的工作区设置
- **AND** 配置自动格式化(保存时)
- **AND** 配置ESLint自动修复
- **AND** 配置TypeScript类型检查
- **AND** 设置保存在.vscode/settings.json

#### Scenario: 配置Git忽略文件
- **WHEN** 项目使用Git版本控制
- **THEN** 系统 SHALL 创建.gitignore文件
- **AND** 忽略node_modules目录
- **AND** 忽略dist构建目录
- **AND** 忽略.env环境变量文件
- **AND** 忽略IDE配置文件(除.vscode外)

### Requirement: 环境验证
开发环境搭建完成后 MUST 进行完整验证,确保所有组件正常工作。

#### Scenario: 验证后端服务
- **WHEN** 后端环境搭建完成
- **THEN** 开发者 SHALL 执行 `npm run dev` 启动服务
- **AND** 服务成功启动,监听3000端口
- **AND** 访问健康检查接口返回正常
- **AND** 数据库连接测试成功

#### Scenario: 验证数据库连接
- **WHEN** 数据库环境搭建完成
- **THEN** 开发者 SHALL 使用数据库客户端连接MySQL
- **AND** 连接成功,可查看数据库和表结构
- **AND** 执行简单查询语句成功
- **AND** Redis连接测试成功

#### Scenario: 验证前端项目编译
- **WHEN** 前端环境搭建完成
- **THEN** C端小程序 SHALL 编译成功,无错误
- **AND** PC管理端 SHALL 启动成功,可在浏览器访问
- **AND** 移动管理端 SHALL 编译成功,无错误
- **AND** 所有项目ESLint检查通过

#### Scenario: 验证完整开发流程
- **WHEN** 所有环境搭建完成
- **THEN** 开发者 SHALL 能够同时运行后端服务和前端项目
- **AND** 前端可成功调用后端API
- **AND** 数据库操作正常
- **AND** 代码修改后自动热更新
- **AND** 代码提交前自动进行格式化和检查

