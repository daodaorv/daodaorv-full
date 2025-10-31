import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  /**
   * 用户注册
   * POST /api/auth/register
   */
  async register(ctx: any) {
    try {
      const { phone, password, nickname } = ctx.request.body as any;

      // 参数验证
      if (!phone || !password) {
        ctx.error(400, '手机号和密码不能为空');
        return;
      }

      if (!/^1[3-9]\d{9}$/.test(phone)) {
        ctx.error(400, '手机号格式不正确');
        return;
      }

      if (password.length < 6) {
        ctx.error(400, '密码长度不能少于6位');
        return;
      }

      const user = await authService.register({ phone, password, nickname });
      ctx.success(user, '注册成功');
    } catch (error: any) {
      // 手机号已注册返回500
      if (error.message && error.message.includes('已注册')) {
        ctx.error(500, error.message);
      } else {
        ctx.error(400, error.message || '注册失败');
      }
    }
  }

  /**
   * 用户登录
   * POST /api/auth/login
   */
  async login(ctx: any) {
    try {
      const { phone, password } = ctx.request.body as any;

      // 参数验证
      if (!phone || !password) {
        ctx.error(400, '手机号和密码不能为空');
        return;
      }

      const result = await authService.login({ phone, password });
      ctx.success(result, '登录成功');
    } catch (error: any) {
      // 根据错误类型返回不同状态码
      if (error.message && error.message.includes('不存在')) {
        ctx.error(404, error.message);
      } else if (error.message && error.message.includes('密码错误')) {
        ctx.error(401, error.message);
      } else {
        ctx.error(400, error.message || '登录失败');
      }
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/profile
   */
  async getProfile(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      if (!userId) {
        ctx.error(401, '未登录');
        return;
      }

      const user = await authService.getUserInfo(userId);
      ctx.success(user);
    } catch (error: any) {
      ctx.error(400, error.message || '获取用户信息失败');
    }
  }

  /**
   * 用户登出
   * POST /api/auth/logout
   */
  async logout(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      const token = ctx.state.token; // 从中间件获取token

      if (!userId || !token) {
        ctx.error(401, '未登录');
        return;
      }

      await authService.logout(userId, token);
      ctx.success(null, '退出登录成功');
    } catch (error: any) {
      ctx.error(400, error.message || '退出登录失败');
    }
  }

  /**
   * 提交实名资料
   * POST /api/auth/real-name
   */
  async submitRealName(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      if (!userId) {
        ctx.error(401, '未登录');
        return;
      }

      const { realName, idCard, idCardFrontImage, idCardBackImage } = ctx.request.body as any;

      // 参数验证
      if (!realName || !idCard || !idCardFrontImage || !idCardBackImage) {
        ctx.error(400, '请填写完整的实名资料');
        return;
      }

      // 验证身份证号格式
      if (
        !/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(
          idCard
        )
      ) {
        ctx.error(400, '身份证号格式错误');
        return;
      }

      const result = await authService.submitRealName(userId, {
        realName,
        idCard,
        idCardFrontImage,
        idCardBackImage,
      });

      ctx.success(result, '实名资料提交成功');
    } catch (error: any) {
      ctx.error(400, error.message || '提交实名资料失败');
    }
  }

  /**
   * 提交驾照资料
   * POST /api/auth/driving-license
   */
  async submitDrivingLicense(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      if (!userId) {
        ctx.error(401, '未登录');
        return;
      }

      const { drivingLicense, drivingLicenseFrontImage, drivingLicenseBackImage } = ctx.request
        .body as any;

      // 参数验证
      if (!drivingLicense || !drivingLicenseFrontImage || !drivingLicenseBackImage) {
        ctx.error(400, '请填写完整的驾照资料');
        return;
      }

      // 验证驾驶证号格式（12位或18位）
      if (!/^\d{12}(\d{6})?$/.test(drivingLicense)) {
        ctx.error(400, '驾驶证号格式错误');
        return;
      }

      const result = await authService.submitDrivingLicense(userId, {
        drivingLicense,
        drivingLicenseFrontImage,
        drivingLicenseBackImage,
      });

      ctx.success(result, '驾照资料提交成功');
    } catch (error: any) {
      ctx.error(400, error.message || '提交驾照资料失败');
    }
  }

  /**
   * 修改密码
   * POST /api/auth/change-password
   */
  async changePassword(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      if (!userId) {
        ctx.error(401, '未登录');
        return;
      }

      const { oldPassword, newPassword } = ctx.request.body as any;

      // 参数验证
      if (!oldPassword || !newPassword) {
        ctx.error(400, '旧密码和新密码不能为空');
        return;
      }

      if (newPassword.length < 6 || newPassword.length > 20) {
        ctx.error(400, '新密码长度必须在6-20位之间');
        return;
      }

      // 验证密码强度（包含字母和数字，可包含特殊字符）
      if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&*!]{6,20}$/.test(newPassword)) {
        ctx.error(400, '密码必须包含字母和数字，长度6-20位');
        return;
      }

      const result = await authService.changePassword(userId, {
        oldPassword,
        newPassword,
      });

      ctx.success(result, '密码修改成功');
    } catch (error: any) {
      // 旧密码错误返回401
      if (error.message && error.message.includes('密码错误')) {
        ctx.error(401, error.message);
      } else {
        ctx.error(400, error.message || '修改密码失败');
      }
    }
  }

  /**
   * 忘记密码重置
   * POST /api/auth/reset-password
   */
  async resetPassword(ctx: any) {
    try {
      const { phone, verifyCode, newPassword } = ctx.request.body as any;

      // 参数验证
      if (!phone || !verifyCode || !newPassword) {
        ctx.error(400, '请填写完整信息');
        return;
      }

      if (!/^1[3-9]\d{9}$/.test(phone)) {
        ctx.error(400, '手机号格式不正确');
        return;
      }

      if (newPassword.length < 6 || newPassword.length > 20) {
        ctx.error(400, '新密码长度必须在6-20位之间');
        return;
      }

      // 验证密码强度
      if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/.test(newPassword)) {
        ctx.error(400, '密码必须包含字母和数字');
        return;
      }

      const result = await authService.resetPassword({
        phone,
        verifyCode,
        newPassword,
      });

      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '密码重置失败');
    }
  }

  /**
   * 更换手机号
   * POST /api/auth/change-phone
   */
  async changePhone(ctx: any) {
    try {
      const userId = ctx.state.user?.userId;
      if (!userId) {
        ctx.error(401, '未登录');
        return;
      }

      const { oldPhone, newPhone, verifyCode } = ctx.request.body as any;

      // 参数验证
      if (!oldPhone || !newPhone || !verifyCode) {
        ctx.error(400, '请填写完整信息');
        return;
      }

      if (!/^1[3-9]\d{9}$/.test(newPhone)) {
        ctx.error(400, '新手机号格式不正确');
        return;
      }

      const result = await authService.changePhone(userId, {
        oldPhone,
        newPhone,
        verifyCode,
      });

      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '更换手机号失败');
    }
  }

  /**
   * 微信一键登录
   * POST /api/auth/wechat-login
   */
  async wechatLogin(ctx: any) {
    try {
      const { code, nickname, avatar } = ctx.request.body as any;

      // 参数验证
      if (!code) {
        ctx.error(400, '缺少登录凭证');
        return;
      }

      const result = await authService.wechatLogin({ code, nickname, avatar });
      ctx.success(result, '登录成功');
    } catch (error: any) {
      ctx.error(400, error.message || '微信登录失败');
    }
  }

  /**
   * 支付宝一键登录
   * POST /api/auth/alipay-login
   */
  async alipayLogin(ctx: any) {
    try {
      const { authCode } = ctx.request.body as any;

      // 参数验证
      if (!authCode) {
        ctx.error(400, '缺少授权码');
        return;
      }

      const result = await authService.alipayLogin({ authCode });
      ctx.success(result, '登录成功');
    } catch (error: any) {
      ctx.error(400, error.message || '支付宝登录失败');
    }
  }

  /**
   * 抖音一键登录
   * POST /api/auth/douyin-login
   */
  async douyinLogin(ctx: any) {
    try {
      const { code, nickname, avatar } = ctx.request.body as any;

      // 参数验证
      if (!code) {
        ctx.error(400, '缺少登录凭证');
        return;
      }

      const result = await authService.douyinLogin({ code, nickname, avatar });
      ctx.success(result, '登录成功');
    } catch (error: any) {
      ctx.error(400, error.message || '抖音登录失败');
    }
  }

  /**
   * 手机号验证码登录
   * POST /api/auth/sms-login
   */
  async smsLogin(ctx: any) {
    try {
      const { phone, code } = ctx.request.body as any;

      // 参数验证
      if (!phone || !code) {
        ctx.error(400, '手机号和验证码不能为空');
        return;
      }

      if (!/^1[3-9]\d{9}$/.test(phone)) {
        ctx.error(400, '手机号格式不正确');
        return;
      }

      const result = await authService.smsLogin({ phone, code });
      ctx.success(result, '登录成功');
    } catch (error: any) {
      ctx.error(400, error.message || '登录失败');
    }
  }

  /**
   * 发送验证码
   * POST /api/auth/send-code
   */
  async sendCode(ctx: any) {
    try {
      const { phone } = ctx.request.body as any;

      // 参数验证
      if (!phone) {
        ctx.error(400, '手机号不能为空');
        return;
      }

      if (!/^1[3-9]\d{9}$/.test(phone)) {
        ctx.error(400, '手机号格式不正确');
        return;
      }

      const result = await authService.sendCode(phone);
      ctx.success(result);
    } catch (error: any) {
      ctx.error(400, error.message || '发送验证码失败');
    }
  }
}
