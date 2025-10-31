# 搭建开发环境

## Why

DaoDaoRV01 项目需要完整的开发环境来支持四个端(后端API、C端小程序、PC管理端、移动管理端)的开发工作。当前项目处于初始化阶段,需要:

1. **统一开发环境**: 确保团队成员使用一致的开发工具和配置
2. **数据库环境**: 搭建MySQL和Redis数据库环境,初始化数据库结构
3. **依赖管理**: 安装所有必需的npm依赖包
4. **开发工具配置**: 配置ESLint、Prettier、TypeScript等开发工具
5. **团队协作**: 建立规范的开发流程,提升团队协作效率

## What Changes

### 后端开发环境
- 初始化Node.js项目结构
- 配置TypeScript编译环境
- 配置Koa2框架和中间件
- 配置ESLint和Prettier代码规范
- 创建基础的Controller、Service、Model层结构

### 数据库环境
- **清除本地Docker中已存在的数据库容器** (如果存在)
- 使用Docker创建MySQL 8.0容器
- 使用Docker创建Redis 7.x容器
- 根据`docs/数据字典.md`初始化数据库表结构
- 配置数据库连接和ORM

### 前端开发环境
- 初始化C端小程序项目(Taro + Vue 3 + NutUI)
- 初始化PC管理端项目(Vue 3 + Vite + Element Plus)
- 初始化移动管理端项目(Taro + Vue 3 + NutUI)
- 配置各端的开发工具和依赖
- 配置代码规范和构建工具

### 开发工具和文档
- 配置VSCode推荐扩展
- 编写环境搭建文档
- 编写开发规范文档
- 配置Git hooks(可选)

## Impact

- Affected specs: development-environment (新增)
- Affected code: 
  - 所有项目目录(backend、miniprogram、admin-console、mobile-admin)
  - 配置文件(package.json、tsconfig.json、vite.config.ts等)
  - 数据库初始化脚本
  - 开发文档

**注意**: 这是项目初始化变更,不影响现有代码,因为当前还没有业务代码。

