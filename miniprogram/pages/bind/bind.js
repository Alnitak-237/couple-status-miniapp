// pages/bind/bind.js
const cloud = require('../../utils/cloud');
const { validateBindCode } = require('../../utils/validator');
const { BIND_CODE_LENGTH } = require('../../utils/constants');
const app = getApp();

Page({
  data: {
    activeTab: 'input',

    // 输入邀请码
    codeDigits: new Array(BIND_CODE_LENGTH).fill(''),
    focusIndex: 0,
    inputError: '',
    submitting: false,

    // 我的邀请码
    myCode: '',
    codeExpireText: '',
  },

  onLoad() {
    // 如果已绑定，返回首页
    if (app.globalData.isBound) {
      wx.showToast({ title: '已绑定', icon: 'none' });
      setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1000);
      return;
    }

    // 预生成邀请码
    this.generateCode();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab, inputError: '' });

    if (tab === 'generate' && !this.data.myCode) {
      this.generateCode();
    }
  },

  // ========== 输入邀请码 ==========

  onCodeFocus(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ focusIndex: index });
  },

  onCodeInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!value) return;

    const digits = [...this.data.codeDigits];
    digits[index] = value;
    this.setData({ codeDigits: digits, inputError: '' });

    // 自动跳到下一个输入框
    if (index < BIND_CODE_LENGTH - 1) {
      this.setData({ focusIndex: index + 1 });
    } else {
      // 输入完成，自动提交
      this.setData({ focusIndex: -1 });
      setTimeout(() => this.submitCode(), 300);
    }
  },

  async onSubmitCode() {
    await this.submitCode();
  },

  async submitCode() {
    const code = this.data.codeDigits.join('');
    const valid = validateBindCode(code);
    if (!valid.valid) {
      this.setData({ inputError: valid.message });
      return;
    }

    this.setData({ submitting: true, inputError: '' });

    try {
      const result = await cloud.bindPartner(code);
      wx.showToast({ title: '绑定成功！', icon: 'success', duration: 2000 });

      // 更新全局状态
      app.globalData.isBound = true;

      // 跳转首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (err) {
      const msg = err.message || '绑定失败，请检查邀请码';
      this.setData({ inputError: msg });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // ========== 生成邀请码 ==========

  async generateCode() {
    try {
      const result = await cloud.generateBindCode();
      this.setData({
        myCode: result.bindCode,
        codeExpireText: `有效期至 ${this.formatExpire(result.expireAt)}`,
      });
    } catch (err) {
      console.error('[bind] 生成邀请码失败', err);
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    }
  },

  formatExpire(timestamp) {
    const d = new Date(timestamp);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  onCopyCode() {
    if (!this.data.myCode) return;
    wx.setClipboardData({
      data: this.data.myCode,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  // 分享给微信好友
  onShareAppMessage() {
    return {
      title: `我的邀请码：${this.data.myCode}`,
      path: `/pages/bind/bind?code=${this.data.myCode}`,
    };
  },
});
