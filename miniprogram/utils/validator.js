// utils/validator.js — 输入校验

/**
 * 校验邀请码格式
 * @param {string} code
 * @returns {{ valid: boolean, message: string }}
 */
function validateBindCode(code) {
  if (!code || code.trim().length === 0) {
    return { valid: false, message: '请输入邀请码' };
  }
  if (code.trim().length !== 6) {
    return { valid: false, message: '邀请码为 6 位字符' };
  }
  if (!/^[A-Za-z0-9]{6}$/.test(code.trim())) {
    return { valid: false, message: '邀请码只包含字母和数字' };
  }
  return { valid: true, message: '' };
}

/**
 * 校验自定义状态文案
 * @param {string} text
 * @returns {{ valid: boolean, message: string }}
 */
function validateCustomStatus(text) {
  if (!text || text.trim().length === 0) {
    return { valid: false, message: '状态不能为空' };
  }
  if (text.trim().length > 10) {
    return { valid: false, message: '状态文案不超过 10 个字' };
  }
  return { valid: true, message: '' };
}

/**
 * 校验小纸条内容
 * @param {string} content
 * @returns {{ valid: boolean, message: string }}
 */
function validateNoteContent(content) {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: '内容不能为空' };
  }
  if (content.trim().length > 200) {
    return { valid: false, message: '内容不超过 200 字' };
  }
  return { valid: true, message: '' };
}

module.exports = {
  validateBindCode,
  validateCustomStatus,
  validateNoteContent,
};
