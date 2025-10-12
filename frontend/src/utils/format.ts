/**
 * 格式化工具模块
 * 
 * 提供日期、金额等格式化函数
 */

/**
 * 格式化金额
 * 
 * @param amount - 金额
 * @returns 格式化后的金额字符串
 * 
 * @example
 * formatAmount(100.5) // '100.50'
 * formatAmount(-50) // '-50.00'
 */
export function formatAmount(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(2);
}

/**
 * 格式化余额显示（带符号）
 * 
 * @param balance - 余额
 * @returns 格式化后的余额字符串
 * 
 * @example
 * formatBalance(100.5) // '+100.50'
 * formatBalance(-50) // '-50.00'
 * formatBalance(0) // '0.00'
 */
export function formatBalance(balance: number | string): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  const formatted = Math.abs(num).toFixed(2);
  
  if (num > 0) {
    return `+${formatted}`;
  } else if (num < 0) {
    return `-${formatted}`;
  } else {
    return '0.00';
  }
}

/**
 * 格式化日期时间
 * 
 * @param date - 日期字符串或 Date 对象
 * @param format - 格式（'date' | 'time' | 'datetime'）
 * @returns 格式化后的日期时间字符串
 * 
 * @example
 * formatDate('2024-01-01T10:30:00', 'date') // '2024-01-01'
 * formatDate('2024-01-01T10:30:00', 'time') // '10:30'
 * formatDate('2024-01-01T10:30:00', 'datetime') // '2024-01-01 10:30'
 */
export function formatDate(date: string | Date, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`;
    case 'time':
      return `${hours}:${minutes}`;
    case 'datetime':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

/**
 * 获取余额的样式类名
 * 
 * @param balance - 余额
 * @returns CSS 类名
 * 
 * @example
 * getBalanceClass(100) // 'balance-positive'
 * getBalanceClass(-50) // 'balance-negative'
 * getBalanceClass(0) // 'balance-zero'
 */
export function getBalanceClass(balance: number | string): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (num > 0) {
    return 'balance-positive';
  } else if (num < 0) {
    return 'balance-negative';
  } else {
    return 'balance-zero';
  }
}
