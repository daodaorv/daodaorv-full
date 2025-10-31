# file-upload Specification

## Purpose
TBD - created by archiving change add-file-upload-api. Update Purpose after archive.
## Requirements
### Requirement: 图片上传

系统 SHALL 支持用户上传图片文件到阿里云 OSS，并返回可访问的 URL。

#### Scenario: 用户上传头像成功

- **WHEN** 用户选择一张 JPG 图片作为头像并上传
- **THEN** 系统验证图片格式和大小
- **AND** 系统生成唯一文件名
- **AND** 系统上传图片到 OSS 的 avatar/ 目录
- **AND** 系统自动生成 200x200 的缩略图
- **AND** 系统返回图片访问 URL
- **AND** 系统在数据库中记录上传信息

#### Scenario: 用户上传身份证照片

- **WHEN** 用户上传身份证正面照片
- **THEN** 系统验证图片为 JPG/PNG 格式
- **AND** 系统验证文件大小不超过 5MB
- **AND** 系统上传到 OSS 的 idcard/ 目录
- **AND** 系统标记 businessType 为 "idcard"
- **AND** 系统返回图片 URL

#### Scenario: 上传文件格式不支持

- **WHEN** 用户上传 BMP 格式图片
- **THEN** 系统拒绝上传
- **AND** 返回错误信息"不支持的文件格式，仅支持 JPG/PNG/WebP"

#### Scenario: 上传文件超过大小限制

- **WHEN** 用户上传一张 10MB 的图片
- **THEN** 系统拒绝上传
- **AND** 返回错误信息"文件大小超过限制，最大 5MB"

---

### Requirement: 文档上传

系统 SHALL 支持用户上传文档文件（PDF、Word、Excel）到阿里云 OSS。

#### Scenario: 用户上传 PDF 文档成功

- **WHEN** 用户上传一个 2MB 的 PDF 文档
- **THEN** 系统验证文件格式为 PDF
- **AND** 系统验证文件大小不超过 10MB
- **AND** 系统上传到 OSS 的 document/ 目录
- **AND** 系统返回文档访问 URL

#### Scenario: 上传文档格式不支持

- **WHEN** 用户上传 ZIP 压缩文件
- **THEN** 系统拒绝上传
- **AND** 返回错误信息"不支持的文档格式"

---

### Requirement: 文件验证

系统 SHALL 在文件上传前进行格式和大小验证，确保文件符合规范。

#### Scenario: 验证图片格式

- **WHEN** 系统接收到上传的文件
- **THEN** 系统检查文件 MIME 类型
- **AND** 系统仅允许 image/jpeg, image/png, image/webp, image/gif
- **AND** 拒绝其他格式

#### Scenario: 验证文件大小

- **WHEN** 系统接收到上传的图片
- **THEN** 系统检查文件大小
- **AND** 图片文件最大 5MB
- **AND** 文档文件最大 10MB
- **AND** 超过限制拒绝上传

---

### Requirement: OSS 文件存储

系统 SHALL 将文件上传到阿里云 OSS，使用结构化的路径命名规则。

#### Scenario: 生成唯一文件名

- **WHEN** 用户上传文件
- **THEN** 系统生成 UUID 作为文件名
- **AND** 保留原始文件扩展名
- **AND** 按业务类型和日期组织路径：{businessType}/{YYYYMM}/{UUID}.{ext}
- **AND** 示例：avatar/202510/550e8400-e29b-41d4-a716-446655440000.jpg

#### Scenario: 上传文件到 OSS

- **WHEN** 文件验证通过
- **THEN** 系统调用阿里云 OSS SDK 上传文件
- **AND** 设置文件访问权限为公开读
- **AND** 返回 OSS 文件 URL
- **AND** URL 格式：https://{bucket}.{endpoint}/{path}

#### Scenario: OSS 上传失败处理

- **WHEN** OSS 上传失败（网络错误或权限不足）
- **THEN** 系统捕获错误
- **AND** 返回友好的错误信息给用户
- **AND** 记录错误日志
- **AND** 不在数据库中创建记录

---

### Requirement: 图片处理

系统 SHALL 自动为上传的图片生成缩略图，并支持格式转换。

#### Scenario: 生成缩略图

- **WHEN** 用户上传一张图片
- **THEN** 系统生成 200x200、400x400、800x800 三种尺寸的缩略图
- **AND** 缩略图命名：{原文件名}\_200.jpg, {原文件名}\_400.jpg, {原文件名}\_800.jpg
- **AND** 缩略图存储在同一目录

#### Scenario: 转换为 WebP 格式

- **WHEN** 用户上传 JPG/PNG 图片
- **THEN** 系统生成 WebP 格式的图片
- **AND** WebP 文件大小约为原图的 30%
- **AND** 返回 WebP 版本的 URL

---

### Requirement: 文件查询

系统 SHALL 支持用户查询自己上传的文件列表。

#### Scenario: 用户查询自己的文件

- **WHEN** 用户请求查询自己的文件列表
- **THEN** 系统返回该用户上传的所有文件
- **AND** 支持分页（默认每页 20 条）
- **AND** 支持按业务类型筛选
- **AND** 支持按上传时间排序

#### Scenario: 管理员查询所有文件

- **WHEN** 管理员请求查询所有文件
- **THEN** 系统返回所有用户上传的文件
- **AND** 支持分页
- **AND** 支持按用户 ID、业务类型、日期范围筛选

---

### Requirement: 文件删除

系统 SHALL 支持用户删除自己上传的文件。

#### Scenario: 用户删除自己的文件

- **WHEN** 用户请求删除自己上传的某个文件
- **THEN** 系统验证文件所有权
- **AND** 系统从 OSS 删除文件
- **AND** 系统从数据库删除记录
- **AND** 返回删除成功

#### Scenario: 用户删除他人文件失败

- **WHEN** 用户尝试删除不属于自己的文件
- **THEN** 系统拒绝删除
- **AND** 返回权限错误

#### Scenario: 管理员删除任意文件

- **WHEN** 管理员请求删除某个文件
- **THEN** 系统验证管理员权限
- **AND** 系统从 OSS 删除文件
- **AND** 系统从数据库删除记录
- **AND** 返回删除成功

---

### Requirement: 批量上传

系统 SHALL 支持管理员批量上传多个文件。

#### Scenario: 批量上传车辆图片

- **WHEN** 管理员选择 10 张车辆图片批量上传
- **THEN** 系统逐个验证文件
- **AND** 系统上传所有文件到 OSS
- **AND** 系统记录所有文件信息到数据库
- **AND** 返回所有文件的 URL 列表

#### Scenario: 批量上传部分失败

- **WHEN** 管理员批量上传 5 个文件，其中 1 个格式不支持
- **THEN** 系统上传 4 个合法文件
- **AND** 系统跳过 1 个非法文件
- **AND** 返回成功文件列表和失败文件信息

---

### Requirement: 权限控制

系统 SHALL 对文件上传、访问、删除进行权限控制。

#### Scenario: 未登录用户上传文件

- **WHEN** 未登录用户尝试上传文件
- **THEN** 系统拒绝请求
- **AND** 返回"请先登录"错误

#### Scenario: 普通用户访问管理端 API

- **WHEN** 普通用户尝试访问批量上传 API
- **THEN** 系统拒绝请求
- **AND** 返回"权限不足"错误

---

### Requirement: 文件清理

系统 SHALL 定期清理未关联业务的文件，释放存储空间。

#### Scenario: 清理未使用的文件

- **WHEN** 系统执行文件清理任务
- **THEN** 系统查找 relatedId 为空的文件
- **AND** 系统筛选创建时间超过 7 天的文件
- **AND** 系统从 OSS 删除这些文件
- **AND** 系统从数据库删除记录
- **AND** 记录清理日志

#### Scenario: 用户注销后清理文件

- **WHEN** 用户注销账号 30 天后
- **THEN** 系统查找该用户上传的所有文件
- **AND** 系统从 OSS 删除文件
- **AND** 系统从数据库删除记录

---

