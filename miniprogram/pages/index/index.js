// pages/index/index.js
const cloud = require('../../utils/cloud');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    isBound: false,
    loading: true,

    // 我的信息
    myProfile: { nickName: '我', avatarUrl: '' },
    myStatus: { emoji: '🌟', status: '在线', moodEmoji: '', moodLabel: '', updatedAt: 0 },

    // 对方信息
    partner: { nickName: 'TA', avatarUrl: '' },
    partnerStatus: { emoji: '🌟', status: '在线', moodEmoji: '', moodLabel: '', updatedAt: 0 },

    // 纪念日
    anniversary: '',
    daysTogether: 0,
    nextMeetDays: 0,

    // 状态选择器
    showPicker: false,

    // 实时监听
    _watcher: null,
  },

  async onLoad() {
    await this.initPage();
  },

  onShow() {
    // 每次回到首页刷新状态
    if (this.data.isBound) {
      this.refreshStatus();
    }
  },

  onUnload() {
    // 关闭实时监听
    if (this.data._watcher) {
      this.data._watcher.close();
    }
  },

  async onPullDownRefresh() {
    await this.refreshStatus();
    wx.stopPullDownRefresh();
  },

  // ========== 初始化 ==========

  async initPage() {
    try {
      // 等待 app 初始化完成
      if (!app.globalData.initialized) {
        await new Promise(resolve => {
          const check = () => {
            if (app.globalData.initialized) resolve();
            else setTimeout(check, 100);
          };
          check();
        });
      }

      // 检查全局绑定状态
      const isBound = app.globalData.isBound;

      if (!isBound) {
        this.setData({ isBound: false, loading: false });
        return;
      }

      this.setData({ isBound: true });

      // 并行加载数据
      await Promise.all([
        this.loadMyData(),
        this.loadPartnerData(),
        this.loadSettings(),
      ]);

      // 开启对方状态实时监听
      this.startWatch();

      this.setData({ loading: false });
    } catch (err) {
      console.error('[index] 初始化失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，下拉重试', icon: 'none' });
    }
  },

  async refreshStatus() {
    try {
      await Promise.all([
        this.loadMyData(),
        this.loadPartnerData(),
      ]);
    } catch (err) {
      console.error('[index] 刷新状态失败', err);
    }
  },

  // ========== 数据加载 ==========

  async loadMyData() {
    const profile = await cloud.getMyProfile();
    const status = await cloud.getMyStatus();

    if (profile) {
      this.setData({
        myProfile: {
          nickName: profile.nickName || '我',
          avatarUrl: profile.avatarUrl || '',
        },
      });
    }

    if (status) {
      // 查找心情信息
      const moodInfo = app.globalData.moods.find(m => m.id === status.mood);
      this.setData({
        myStatus: {
          emoji: status.emoji || '🌟',
          status: status.status || '在线',
          moodEmoji: moodInfo ? moodInfo.emoji : '',
          moodLabel: moodInfo ? moodInfo.label : '',
          updatedAt: status.updatedAt ? new Date(status.updatedAt).getTime() : 0,
        },
      });
    }
  },

  async loadPartnerData() {
    const partnerId = app.globalData.partnerId;
    if (!partnerId) return;

    const [profile, status] = await Promise.all([
      cloud.getPartnerProfile(partnerId),
      cloud.getPartnerStatus(partnerId),
    ]);

    if (profile) {
      this.setData({
        partner: {
          nickName: profile.nickName || 'TA',
          avatarUrl: profile.avatarUrl || '',
          online: !!status, // 有状态记录即视为在线
        },
      });
    }

    if (status) {
      const moodInfo = app.globalData.moods.find(m => m.id === status.mood);
      this.setData({
        partnerStatus: {
          emoji: status.emoji || '🌟',
          status: status.status || '在线',
          moodEmoji: moodInfo ? moodInfo.emoji : '',
          moodLabel: moodInfo ? moodInfo.label : '',
          updatedAt: status.updatedAt ? new Date(status.updatedAt).getTime() : 0,
        },
      });
    }
  },

  async loadSettings() {
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('settings')
        .where({ _openid: '{openid}' })
        .get();

      if (data.length > 0 && data[0].anniversary) {
        const days = util.daysBetween(data[0].anniversary);
        let nextMeetDays = 0;
        if (data[0].nextMeet) {
          nextMeetDays = util.daysBetween(new Date(), data[0].nextMeet);
        }

        this.setData({
          anniversary: data[0].anniversary,
          daysTogether: days,
          nextMeetDays: nextMeetDays > 0 ? nextMeetDays : 0,
        });
      }
    } catch (err) {
      // settings 表可能还不存在，忽略
    }
  },

  // ========== 实时监听 ==========

  startWatch() {
    const partnerId = app.globalData.partnerId;
    if (!partnerId) return;

    // 先关闭旧的监听
    if (this.data._watcher) {
      this.data._watcher.close();
    }

    const watcher = cloud.watchPartnerStatus(partnerId, (doc) => {
      const moodInfo = app.globalData.moods.find(m => m.id === doc.mood);
      this.setData({
        partnerStatus: {
          emoji: doc.emoji || '🌟',
          status: doc.status || '在线',
          moodEmoji: moodInfo ? moodInfo.emoji : '',
          moodLabel: moodInfo ? moodInfo.label : '',
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0,
        },
      });
    });

    this.setData({ _watcher: watcher });
  },

  // ========== 交互事件 ==========

  /** 跳转绑定页 */
  goBind() {
    wx.navigateTo({ url: '/pages/bind/bind' });
  },

  /** 点击我的状态卡片 → 弹出选择器 */
  onMyCardTap() {
    this.setData({ showPicker: true });
  },

  /** 关闭状态选择器 */
  onPickerClose() {
    this.setData({ showPicker: false });
  },

  /** 确认切换状态 */
  async onStatusConfirm(e) {
    const { status, emoji, mood, isCustom, statusId } = e.detail;
    this.setData({ showPicker: false });

    try {
      wx.showLoading({ title: '更新中...' });
      await cloud.updateStatus({ status, emoji, mood, isCustom, statusId });
      wx.hideLoading();
      wx.showToast({ title: '状态已更新', icon: 'success', duration: 1500 });

      // 刷新本地状态
      await this.loadMyData();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '更新失败', icon: 'error' });
    }
  },

  /** 给对方发小纸条 */
  onSendNoteToPartner() {
    wx.navigateTo({ url: '/pages/notes/notes' });
  },
});
