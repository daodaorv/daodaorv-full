import { AppDataSource } from '../config/database';
import { User, UserStatus, AuthStatus, Platform } from '../entities/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import * as redisUtil from '../utils/redis';
import { logger } from '../utils/logger';
import { WechatLogin } from '../utils/wechat-login';
import { AlipayLogin } from '../utils/alipay-login';
import { DouyinLogin } from '../utils/douyin-login';

export interface RegisterDto {
  phone: string;
  password: string;
  nickname?: string;
}

export interface LoginDto {
  phone: string;
  password: string;
}

export interface RealNameDto {
  realName: string;
  idCard: string;
  idCardFrontImage: string;
  idCardBackImage: string;
}

export interface DrivingLicenseDto {
  drivingLicense: string;
  drivingLicenseFrontImage: string;
  drivingLicenseBackImage: string;
}

export interface ChangePhoneDto {
  oldPhone: string;
  newPhone: string;
  verifyCode: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  phone: string;
  verifyCode: string;
  newPassword: string;
}

export interface WechatLoginDto {
  code: string;
  nickname?: string;
  avatar?: string;
}

export interface AlipayLoginDto {
  authCode: string;
}

export interface DouyinLoginDto {
  code: string;
  nickname?: string;
  avatar?: string;
}

export interface SmsLoginDto {
  phone: string;
  code: string;
}

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * 用户注册
   */
  async register(dto: RegisterDto) {
    try {
      logger.info(`用户注册请求: ${dto.phone}`);

      // 检查手机号是否已注册
      const existingUser = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });

      if (existingUser) {
        logger.warn(`注册失败: 手机号已存在 - ${dto.phone}`);
        throw new Error('手机号已注册');
      }

      // 加密密码
      const hashedPassword = await hashPassword(dto.password);

      // 创建用户
      const user = this.userRepository.create({
        phone: dto.phone,
        password: hashedPassword,
        nickname: dto.nickname || `用户${dto.phone.slice(-4)}`,
      });

      await this.userRepository.save(user);
      logger.info(`用户注册成功: ${user.id} - ${dto.phone}`);

      // 生成JWT token
      const token = generateToken({
        userId: user.id,
        phone: user.phone,
      });

      // 存储token到Redis
      await redisUtil.saveToken(user.id, token);

      // 返回token和用户信息 (不含密码)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userInfo } = user;
      return {
        token,
        user: userInfo,
      };
    } catch (error) {
      logger.error(`用户注册失败: ${dto.phone}`, error);
      throw error;
    }
  }

  /**
   * 用户登录
   */
  async login(dto: LoginDto) {
    try {
      logger.info(`用户登录请求: ${dto.phone}`);

      // 查找用户
      const user = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });

      if (!user) {
        logger.warn(`登录失败: 用户不存在 - ${dto.phone}`);
        throw new Error('用户不存在');
      }

      // 检查账户状态
      if (user.status === UserStatus.FROZEN || user.status === UserStatus.BANNED) {
        logger.warn(`登录失败: 账户状态异常 - ${dto.phone}, 状态: ${user.status}`);
        throw new Error('账户已被冻结或封禁');
      }

      // 验证密码
      const isPasswordValid = await comparePassword(dto.password, user.password);
      if (!isPasswordValid) {
        logger.warn(`登录失败: 密码错误 - ${dto.phone}`);
        throw new Error('密码错误');
      }

      // 生成 token
      const token = generateToken({
        userId: user.id,
        phone: user.phone,
      });

      // 保存token到Redis（有效期7天）
      await redisUtil.saveToken(user.id, token, 7 * 24 * 60 * 60);
      logger.info(`用户登录成功: ${user.id} - ${dto.phone}`);

      // 返回用户信息和 token
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userInfo } = user;
      return {
        token,
        user: userInfo,
      };
    } catch (error) {
      logger.error(`用户登录失败: ${dto.phone}`, error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userInfo } = user;
    return userInfo;
  }

  /**
   * 退出登录
   */
  async logout(userId: string, token: string) {
    await redisUtil.revokeToken(userId, token);
    return { message: '退出登录成功' };
  }

  /**
   * 提交实名资料
   */
  async submitRealName(userId: string, dto: RealNameDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查是否已提交过
    if (user.realNameStatus === AuthStatus.PENDING || user.realNameStatus === AuthStatus.APPROVED) {
      throw new Error('已提交过实名资料，无需重复提交');
    }

    // 更新实名资料
    user.realName = dto.realName;
    user.idCard = dto.idCard;
    user.idCardFrontImage = dto.idCardFrontImage;
    user.idCardBackImage = dto.idCardBackImage;
    user.realNameStatus = AuthStatus.PENDING;

    await this.userRepository.save(user);

    return { message: '实名资料提交成功，等待审核' };
  }

  /**
   * 提交驾照资料
   */
  async submitDrivingLicense(userId: string, dto: DrivingLicenseDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查是否已完成实名认证（允许待审核状态提交驾照）
    if (user.realNameStatus !== AuthStatus.APPROVED && user.realNameStatus !== AuthStatus.PENDING) {
      throw new Error('请先完成实名认证');
    }

    // 检查是否已提交过
    if (
      user.drivingLicenseStatus === AuthStatus.PENDING ||
      user.drivingLicenseStatus === AuthStatus.APPROVED
    ) {
      throw new Error('已提交过驾照资料，无需重复提交');
    }

    // 更新驾照资料
    user.drivingLicense = dto.drivingLicense;
    user.drivingLicenseFrontImage = dto.drivingLicenseFrontImage;
    user.drivingLicenseBackImage = dto.drivingLicenseBackImage;
    user.drivingLicenseStatus = AuthStatus.PENDING;

    await this.userRepository.save(user);

    return { message: '驾照资料提交成功，等待审核' };
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      logger.info(`修改密码请求: 用户ID ${userId}`);

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        logger.warn(`修改密码失败: 用户不存在 - ${userId}`);
        throw new Error('用户不存在');
      }

      // 验证旧密码
      const isOldPasswordValid = await comparePassword(dto.oldPassword, user.password);
      if (!isOldPasswordValid) {
        logger.warn(`修改密码失败: 旧密码错误 - ${userId}`);
        throw new Error('旧密码错误');
      }

      // 加密新密码
      const hashedPassword = await hashPassword(dto.newPassword);
      user.password = hashedPassword;

      await this.userRepository.save(user);

      // 撤销所有令牌，要求用户重新登录
      await redisUtil.revokeAllTokens(userId);
      logger.info(`密码修改成功: ${userId} - ${user.phone}`);

      return { message: '密码修改成功，请重新登录' };
    } catch (error) {
      logger.error(`修改密码失败: 用户ID ${userId}`, error);
      throw error;
    }
  }

  /**
   * 忘记密码重置（需要验证码验证）
   */
  async resetPassword(dto: ResetPasswordDto) {
    // TODO: 验证验证码（需要短信服务）
    // 这里暂时跳过验证码验证

    const user = await this.userRepository.findOne({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 加密新密码
    const hashedPassword = await hashPassword(dto.newPassword);
    user.password = hashedPassword;

    await this.userRepository.save(user);

    // 撤销所有令牌
    await redisUtil.revokeAllTokens(user.id);

    return { message: '密码重置成功，请重新登录' };
  }

  /**
   * 更换手机号（需要验证码验证）
   */
  async changePhone(userId: string, dto: ChangePhoneDto) {
    // TODO: 验证验证码（需要短信服务）
    // 这里暂时跳过验证码验证

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查新手机号是否已被使用
    const existingUser = await this.userRepository.findOne({
      where: { phone: dto.newPhone },
    });

    if (existingUser) {
      throw new Error('新手机号已被使用');
    }

    // 更新手机号
    user.phone = dto.newPhone;
    await this.userRepository.save(user);

    return { message: '手机号更换成功' };
  }

  /**
   * 微信一键登录
   */
  async wechatLogin(dto: WechatLoginDto) {
    try {
      logger.info(`微信一键登录请求: code=${dto.code.substring(0, 10)}...`);

      // 1. 通过 code 换取 openid
      const wechatLogin = new WechatLogin({
        appId: process.env.WECHAT_APP_ID || '',
        appSecret: process.env.WECHAT_APP_SECRET || '',
      });

      const wechatResult = await wechatLogin.code2Session(dto.code);

      // 2. 查找或创建用户
      let user = await this.userRepository.findOne({
        where: { wechatOpenid: wechatResult.openid },
      });

      if (!user) {
        // 创建新用户
        user = this.userRepository.create({
          wechatOpenid: wechatResult.openid,
          nickname: dto.nickname || `微信用户${wechatResult.openid.substring(0, 8)}`,
          avatar: dto.avatar,
          platform: Platform.WECHAT,
        });

        await this.userRepository.save(user);
        logger.info(`微信新用户注册成功: ${user.id} - ${wechatResult.openid}`);
      } else {
        // 更新用户信息
        if (dto.nickname) user.nickname = dto.nickname;
        if (dto.avatar) user.avatar = dto.avatar;
        await this.userRepository.save(user);
        logger.info(`微信用户登录成功: ${user.id} - ${wechatResult.openid}`);
      }

      // 3. 生成 token
      const token = generateToken({
        userId: user.id,
        phone: user.phone || '',
      });

      // 4. 保存 token 到 Redis
      await redisUtil.saveToken(user.id, token, 7 * 24 * 60 * 60);

      // 5. 返回用户信息和 token
      const { password: _password, ...userInfo } = user;
      return {
        token,
        user: userInfo,
      };
    } catch (error) {
      logger.error('微信一键登录失败', error);
      throw error;
    }
  }

  /**
   * 支付宝一键登录
   */
  async alipayLogin(dto: AlipayLoginDto) {
    try {
      logger.info(`支付宝一键登录请求: authCode=${dto.authCode.substring(0, 10)}...`);

      // 1. 通过 authCode 换取 userId
      const alipayLogin = new AlipayLogin({
        appId: process.env.ALIPAY_APP_ID || '',
        privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
        alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      });

      const alipayResult = await alipayLogin.getAccessToken(dto.authCode);

      // 2. 查找或创建用户
      let user = await this.userRepository.findOne({
        where: { alipayUserId: alipayResult.user_id },
      });

      if (!user) {
        // 创建新用户
        user = this.userRepository.create({
          alipayUserId: alipayResult.user_id,
          nickname: `支付宝用户${alipayResult.user_id.substring(0, 8)}`,
          platform: Platform.ALIPAY,
        });

        await this.userRepository.save(user);
        logger.info(`支付宝新用户注册成功: ${user.id} - ${alipayResult.user_id}`);
      } else {
        logger.info(`支付宝用户登录成功: ${user.id} - ${alipayResult.user_id}`);
      }

      // 3. 生成 token
      const token = generateToken({
        userId: user.id,
        phone: user.phone || '',
      });

      // 4. 保存 token 到 Redis
      await redisUtil.saveToken(user.id, token, 7 * 24 * 60 * 60);

      // 5. 返回用户信息和 token
      const { password: _password, ...userInfo } = user;
      return {
        token,
        user: userInfo,
      };
    } catch (error) {
      logger.error('支付宝一键登录失败', error);
      throw error;
    }
  }

  /**
   * 抖音一键登录
   */
  async douyinLogin(dto: DouyinLoginDto) {
    try {
      logger.info(`抖音一键登录请求: code=${dto.code.substring(0, 10)}...`);

      // 1. 通过 code 换取 openid
      const douyinLogin = new DouyinLogin({
        appId: process.env.DOUYIN_APP_ID || '',
        appSecret: process.env.DOUYIN_APP_SECRET || '',
      });

      const douyinResult = await douyinLogin.code2Session(dto.code);

      // 2. 查找或创建用户
      let user = await this.userRepository.findOne({
        where: { douyinOpenid: douyinResult.openid },
      });

      if (!user) {
        // 创建新用户
        user = this.userRepository.create({
          douyinOpenid: douyinResult.openid,
          nickname: dto.nickname || `抖音用户${douyinResult.openid.substring(0, 8)}`,
          avatar: dto.avatar,
          platform: Platform.DOUYIN,
        });

        await this.userRepository.save(user);
        logger.info(`抖音新用户注册成功: ${user.id} - ${douyinResult.openid}`);
      } else {
        // 更新用户信息
        if (dto.nickname) user.nickname = dto.nickname;
        if (dto.avatar) user.avatar = dto.avatar;
        await this.userRepository.save(user);
        logger.info(`抖音用户登录成功: ${user.id} - ${douyinResult.openid}`);
      }

      // 3. 生成 token
      const token = generateToken({
        userId: user.id,
        phone: user.phone || '',
      });

      // 4. 保存 token 到 Redis
      await redisUtil.saveToken(user.id, token, 7 * 24 * 60 * 60);

      // 5. 返回用户信息和 token
      const { password: _password, ...userInfo } = user;
      return {
        token,
        user: userInfo,
      };
    } catch (error) {
      logger.error('抖音一键登录失败', error);
      throw error;
    }
  }

  /**
   * 手机号验证码登录
   */
  async smsLogin(dto: SmsLoginDto) {
    try {
      logger.info(`手机号验证码登录请求: ${dto.phone}`);

      // TODO: 验证验证码（需要短信服务）
      // 这里暂时跳过验证码验证

      // 查找或创建用户
      let user = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });

      if (!user) {
        // 创建新用户
        user = this.userRepository.create({
          phone: dto.phone,
          nickname: `用户${dto.phone.slice(-4)}`,
          platform: Platform.PHONE,
        });

        await this.userRepository.save(user);
        logger.info(`手机号新用户注册成功: ${user.id} - ${dto.phone}`);
      } else {
        logger.info(`手机号用户登录成功: ${user.id} - ${dto.phone}`);
      }

      // 生成 token
      const token = generateToken({
        userId: user.id,
        phone: user.phone || '',
      });

      // 保存 token 到 Redis
      await redisUtil.saveToken(user.id, token, 7 * 24 * 60 * 60);

      // 返回用户信息和 token
      const { password: _password, ...userInfo } = user;
      return {
        token,
        user: userInfo,
      };
    } catch (error) {
      logger.error(`手机号验证码登录失败: ${dto.phone}`, error);
      throw error;
    }
  }

  /**
   * 发送验证码
   */
  async sendCode(phone: string) {
    try {
      logger.info(`发送验证码请求: ${phone}`);

      // TODO: 实现短信验证码发送
      // 这里暂时返回成功

      logger.info(`验证码发送成功: ${phone}`);
      return { message: '验证码发送成功' };
    } catch (error) {
      logger.error(`发送验证码失败: ${phone}`, error);
      throw error;
    }
  }
}
