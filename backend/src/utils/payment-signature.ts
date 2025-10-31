import crypto from 'crypto';

/**
 * 生成签名（MD5）
 * @param params 参数对象
 * @param secret 密钥
 * @returns 签名字符串
 */
export function generateSignature(params: Record<string, any>, secret: string): string {
  // 1. 按参数名ASCII码从小到大排序
  const sortedKeys = Object.keys(params).sort();

  // 2. 拼接参数：key1=value1&key2=value2&key=secret
  const stringA = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
  const stringSignTemp = `${stringA}&key=${secret}`;

  // 3. MD5加密并转大写
  const sign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();

  return sign;
}

/**
 * 验证签名
 * @param params 参数对象（包含sign字段）
 * @param secret 密钥
 * @returns 是否验证通过
 */
export function verifySignature(params: Record<string, any>, secret: string): boolean {
  const receivedSign = params.sign;
  if (!receivedSign) {
    return false;
  }

  // 移除sign字段后重新生成签名
  const paramsWithoutSign = { ...params };
  delete paramsWithoutSign.sign;

  const calculatedSign = generateSignature(paramsWithoutSign, secret);

  return receivedSign === calculatedSign;
}

/**
 * 生成随机字符串（用于nonce_str）
 * @param length 长度，默认32
 * @returns 随机字符串
 */
export function generateNonceStr(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

