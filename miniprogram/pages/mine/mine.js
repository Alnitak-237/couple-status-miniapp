// pages/mine/mine.js
const cloud = require('../../utils/cloud');
const { validateCustomStatus } = require('../../utils/validator');
const { MAX_CUSTOM_STATUS } = require('../../utils/constants');
const app = getApp();

Page({
  data: {
    avatarUrl: '',
    nickName: '',
    currentStatus: { emoji: '🌟', status: '在线' },
    customStatuses: [],
    maxCustom: MAX_CUSTOM_STATUS,
    partnerName: '',

    // 添加弹窗
    showAddCustom: false,
    newCustomEmoji: '',
    newCustomText: '',
    addError: '',
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      const profile = await cloud.getMyProfile();
      if (profile) {
        this.setData({
          avatarUrl: profile.avatarUrl || '',
          nickName: profile.nickName || '',
        });

        // 加载自定义状态（从本地存储读取）
        const customStatuses = wx.getStorageSync('customStatuses') || [];
        this.setData({ customStatuses });

        // 加载对方昵称
        if (profile.partnerId) {
          const partner = await cloud.getPartnerProfile(profile.partnerId);
          if (partner) {
            this.setData({ partnerName: partner.nickName || 'TA' });
          }
        }
      }

      // 加载当前状态
      const status = await cloud.getMyStatus();
      if (status) {
        this.setData({
          currentStatus: {
            emoji: status.emoji || '🌟',
            status: status.status || '在线',
          },
        });
      }
    } catch (err) {
      console.error('[mine] 加载数据失败', err);
    }
  },

  // ========== 头像 ==========

  onChangeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });

        try {
          // 上传到云存储
          const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempPath,
          });

          // 更新用户头像字段
          const db = wx.cloud.database();
          await db.collection('users').where({ _openid: '{openid}' }).update({
            data: { avatarUrl: uploadRes.fileID },
          });

          this.setData({ avatarUrl: uploadRes.fileID });
          wx.hideLoading();
          wx.showToast({ title: '头像已更新', icon: 'success' });
        } catch (err) {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'error' });
        }
      },
    });
  },

  // ========== 昵称 ==========

  onNicknameBlur(e) {
    const nickName = e.detail.value.trim();
    if (!nickName || nickName === this.data.nickName) return;

    wx.showLoading({ title: '保存中...' });
    const db = wx.cloud.database();
    db.collection('users').where({ _openid: '{openid}' }).update({
      data: { nickName },
    }).then(() => {
      wx.hideLoading();
      this.setData({ nickName });
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'error' });
    });
  },

  // ========== 状态 ==========

  onChangeStatus() {
    // 跳转到首页并触发状态选择
    wx.switchTab({ url: '/pages/index/index' });
  },

  // ========== 自定义状态 ==========

  onAddCustom() {
    this.setData({
      showAddCustom: true,
      newCustomEmoji: '',
      newCustomText: '',
      addError: '',
    });
  },

  onCancelAddCustom() {
    this.setData({ showAddCustom: false });
  },

  onNewCustomEmoji(e) {
    this.setData({ newCustomEmoji: e.detail.value, addError: '' });
  },

  onNewCustomText(e) {
    this.setData({ newCustomText: e.detail.value, addError: '' });
  },

  onConfirmAddCustom() {
    const emoji = this.data.newCustomEmoji || '💬';
    const text = this.data.newCustomText.trim();
    const valid = validateCustomStatus(text);
    if (!valid.valid) {
      this.setData({ addError: valid.message });
      return;
    }

    const customStatuses = [...this.data.customStatuses, { emoji, text }];
    wx.setStorageSync('customStatuses', customStatuses);

    this.setData({
      customStatuses,
      showAddCustom: false,
    });

    wx.showToast({ title: '已添加', icon: 'success' });
  },

  onDeleteCustom(e) {
    const index = e.currentTarget.dataset.index;
    const customStatuses = [...this.data.customStatuses];
    customStatuses.splice(index, 1);
    wx.setStorageSync('customStatuses', customStatuses);
    this.setData({ customStatuses });
  },

  // ========== 解绑 ==========

  onUnbind() {
    wx.showModal({
      title: '确认解除绑定？',
      content: '解除后双方将无法看到对方状态，且不可恢复',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            const db = wx.cloud.database();
            await db.collection('users').where({ _openid: '{openid}' }).update({
              data: { partnerId: null },
            });
            app.globalData.isBound = false;
            app.globalData.partnerId = null;
            wx.showToast({ title: '已解除绑定', icon: 'success' });
            setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1000);
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'error' });
          }
        }
      },
    });
  },

  noop() {},
});
