/**
 * 数据脱敏工具
 */

/**
 * 手机号脱敏
 * 138****8888
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) {
    return phone;
  }
  return phone.substring(0, 3) + '****' + phone.substring(7);
}

/**
 * 身份证号脱敏
 * 110101********1234
 */
export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length !== 18) {
    return idCard;
  }
  return idCard.substring(0, 6) + '********' + idCard.substring(14);
}

/**
 * 姓名脱敏
 * 张三 -> 张*
 * 欧阳锋 -> 欧**
 */
export function maskName(name: string): string {
  if (!name || name.length === 0) {
    return name;
  }
  if (name.length === 1) {
    return name;
  }
  if (name.length === 2) {
    return name.charAt(0) + '*';
  }
  return name.charAt(0) + '*'.repeat(name.length - 1);
}

/**
 * 邮箱脱敏
 * example@gmail.com -> ex***@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return username.charAt(0) + '***@' + domain;
  }
  return username.substring(0, 2) + '***@' + domain;
}

/**
 * 银行卡号脱敏
 * 6222021234567890123 -> 6222 **** **** 0123
 */
export function maskBankCard(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 8) {
    return cardNumber;
  }
  const first = cardNumber.substring(0, 4);
  const last = cardNumber.substring(cardNumber.length - 4);
  return `${first} **** **** ${last}`;
}
