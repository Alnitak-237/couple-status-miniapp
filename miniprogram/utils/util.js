// utils/util.js — 通用工具函数

/**
 * 格式化时间为相对时间描述
 * @param {Date|string|number} time 时间
 * @returns {string} 如 "刚刚"、"3分钟前"、"2小时前"
 */
function formatRelativeTime(time) {
  const now = Date.now();
  const target = new Date(time).getTime();
  const diff = now - target;

  if (diff < 0) return '刚刚';

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '刚刚';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;

  return formatDate(time);
}

/**
 * 格式化日期为 yyyy-MM-dd HH:mm
 */
function formatDate(time) {
  const d = new Date(time);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 格式化日期为 yyyy-MM-dd
 */
function formatDateOnly(time) {
  const d = new Date(time);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 计算两个日期之间的天数
 */
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = date2 ? new Date(date2) : new Date();
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * 生成随机邀请码
 * @param {number} length 长度
 * @returns {string}
 */
function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符 I/O/0/1
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * 防抖
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流
 */
function throttle(fn, delay = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

module.exports = {
  formatRelativeTime,
  formatDate,
  formatDateOnly,
  daysBetween,
  generateCode,
  debounce,
  throttle,
};
