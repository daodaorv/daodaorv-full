# 用户认证系统规范

## ADDED Requirements

### Requirement: 用户注册

系统 MUST 提供用户注册功能，允许新用户通过手机号和密码创建账户。

#### Scenario: 成功注册

- **WHEN** 用户提供有效的手机号（11 位）和密码（6-20 位，包含字母和数字）
- **THEN** 系统创建用户账户，返回用户信息（不含密码）和 JWT 令牌

#### Scenario: 手机号已注册

- **WHEN** 用户使用已存在的手机号注册
- **THEN** 系统返回错误"手机号已注册"，状态码 400

#### Scenario: 密码强度不足

- **WHEN** 用户提供的密码长度少于 6 位或不包含字母和数字
- **THEN** 系统返回错误"密码强度不足，需包含字母和数字"，状态码 400

---

### Requirement: 用户登录

系统 MUST 提供用户登录功能，支持手机号+密码登录方式。

#### Scenario: 登录成功

- **WHEN** 用户提供正确的手机号和密码
- **THEN** 系统返回用户信息和 JWT 令牌，令牌有效期 7 天

#### Scenario: 手机号不存在

- **WHEN** 用户提供不存在的手机号
- **THEN** 系统返回错误"用户不存在"，状态码 404

#### Scenario: 密码错误

- **WHEN** 用户提供错误的密码
- **THEN** 系统返回错误"密码错误"，状态码 401

#### Scenario: 账户已冻结

- **WHEN** 用户账户状态为 frozen 或 banned
- **THEN** 系统返回错误"账户已被冻结或封禁"，状态码 403

---

### Requirement: JWT 身份认证

系统 MUST 实现 JWT 令牌机制，用于保护需要认证的 API 接口。

#### Scenario: 令牌验证成功

- **WHEN** 请求头包含有效的 JWT 令牌（Authorization: Bearer <token>）
- **THEN** 认证中间件验证通过，允许访问受保护的资源

#### Scenario: 令牌缺失

- **WHEN** 请求头不包含 JWT 令牌
- **THEN** 认证中间件返回错误"未登录"，状态码 401

#### Scenario: 令牌已过期

- **WHEN** JWT 令牌已超过 7 天有效期
- **THEN** 认证中间件返回错误"令牌已过期，请重新登录"，状态码 401

#### Scenario: 令牌无效

- **WHEN** JWT 令牌被篡改或格式错误
- **THEN** 认证中间件返回错误"令牌无效"，状态码 401

---

### Requirement: 获取用户信息

系统 MUST 提供获取当前登录用户信息的功能。

#### Scenario: 获取成功

- **WHEN** 已认证用户请求获取个人信息
- **THEN** 系统返回用户详细信息（不含密码），包括昵称、头像、手机号、实名状态、驾照状态等

---

### Requirement: 退出登录

系统 MUST 提供退出登录功能，撤销当前 JWT 令牌。

#### Scenario: 退出成功

- **WHEN** 已认证用户请求退出登录
- **THEN** 系统将令牌加入黑名单（存储在 Redis 中），返回成功消息

---

### Requirement: 实名认证提交

系统 MUST 允许用户提交实名资料进行认证。

#### Scenario: 提交实名资料成功

- **WHEN** 用户提供真实姓名、身份证号、身份证正反面照片
- **THEN** 系统保存实名资料，设置 realNameStatus 为"pending"，返回成功消息

#### Scenario: 身份证号格式错误

- **WHEN** 用户提供的身份证号不是 18 位或格式错误
- **THEN** 系统返回错误"身份证号格式错误"，状态码 400

#### Scenario: 重复提交

- **WHEN** 用户已提交过实名资料且状态为"pending"或"approved"
- **THEN** 系统返回错误"已提交过实名资料，无需重复提交"，状态码 400

---

### Requirement: 驾照认证提交

系统 MUST 允许用户提交驾照资料进行认证。

#### Scenario: 提交驾照资料成功

- **WHEN** 用户提供驾驶证号、驾驶证正副页照片
- **THEN** 系统保存驾照资料，设置 drivingLicenseStatus 为"pending"，返回成功消息

#### Scenario: 驾驶证号格式错误

- **WHEN** 用户提供的驾驶证号不是 18 位或格式错误
- **THEN** 系统返回错误"驾驶证号格式错误"，状态码 400

#### Scenario: 未实名认证

- **WHEN** 用户未完成实名认证就提交驾照资料
- **THEN** 系统返回错误"请先完成实名认证"，状态码 400

---

### Requirement: 手机号更换

系统 MUST 允许用户更换绑定的手机号。

#### Scenario: 更换成功

- **WHEN** 用户验证旧手机号，并提供新手机号（未被使用）
- **THEN** 系统更新用户手机号，返回成功消息

#### Scenario: 新手机号已被使用

- **WHEN** 新手机号已被其他用户注册
- **THEN** 系统返回错误"新手机号已被使用"，状态码 400

---

### Requirement: 密码修改

系统 MUST 允许用户修改登录密码。

#### Scenario: 修改成功

- **WHEN** 用户提供正确的旧密码和符合要求的新密码
- **THEN** 系统更新密码（bcrypt 加密），返回成功消息

#### Scenario: 旧密码错误

- **WHEN** 用户提供的旧密码不正确
- **THEN** 系统返回错误"旧密码错误"，状态码 401

---

### Requirement: 忘记密码重置

系统 MUST 提供忘记密码重置功能，通过手机验证码重置密码。

#### Scenario: 重置成功

- **WHEN** 用户通过手机验证码验证身份，并提供新密码
- **THEN** 系统更新密码，返回成功消息

#### Scenario: 验证码错误

- **WHEN** 用户提供的验证码不正确或已过期
- **THEN** 系统返回错误"验证码错误或已过期"，状态码 400

---

### Requirement: 密码安全存储

系统 MUST 使用 bcrypt 算法加密存储用户密码，NEVER 以明文存储。

#### Scenario: 注册时密码加密

- **WHEN** 用户注册时提供密码
- **THEN** 系统使用 bcrypt.hash()加密后存储到数据库

#### Scenario: 登录时密码验证

- **WHEN** 用户登录时提供密码
- **THEN** 系统使用 bcrypt.compare()比对密码哈希值

---

### Requirement: 认证数据持久化

系统 MUST 将 JWT 令牌存储在 Redis 中，支持令牌撤销和刷新。

#### Scenario: 登录时存储令牌

- **WHEN** 用户登录成功
- **THEN** 系统将 JWT 令牌存储到 Redis，key 为"jwt:<userId>:<token>"，有效期 7 天

#### Scenario: 退出登录时撤销令牌

- **WHEN** 用户退出登录
- **THEN** 系统从 Redis 中删除对应的 JWT 令牌

#### Scenario: 令牌验证时查询 Redis

- **WHEN** 认证中间件验证 JWT 令牌
- **THEN** 系统检查令牌是否在 Redis 黑名单中（已撤销的令牌）
