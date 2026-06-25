// pages/settings/settings.js
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    anniversary: '',
    nextMeet: '',
    daysTogether: 0,
    nextMeetDays: 0,
    notifyStatus: true,
    notifyNote: true,
  },

  onShow() {
    this.loadSettings();
  },

  async loadSettings() {
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('settings')
        .where({ _openid: '{openid}' })
        .get();

      if (data.length > 0) {
        const s = data[0];
        const daysTogether = s.anniversary ? util.daysBetween(s.anniversary) : 0;
        const nextMeetDays = s.nextMeet ? util.daysBetween(new Date(), s.nextMeet) : 0;

        this.setData({
          anniversary: s.anniversary || '',
          nextMeet: s.nextMeet || '',
          daysTogether,
          nextMeetDays: nextMeetDays > 0 ? nextMeetDays : 0,
          notifyStatus: s.notifyStatus !== false,
          notifyNote: s.notifyNote !== false,
          _settingsId: s._id,
        });
      }
    } catch (err) {
      console.error('[settings] 加载失败', err);
    }
  },

  async saveSettings(updates) {
    const db = wx.cloud.database();
    if (this.data._settingsId) {
      await db.collection('settings').doc(this.data._settingsId).update({ data: updates });
    } else {
      const res = await db.collection('settings').add({ data: updates });
      this.setData({ _settingsId: res._id });
    }
  },

  onAnniversaryChange(e) {
    const anniversary = e.detail.value;
    const daysTogether = util.daysBetween(anniversary);
    this.setData({ anniversary, daysTogether });
    this.saveSettings({ anniversary });
  },

  onNextMeetChange(e) {
    const nextMeet = e.detail.value;
    const nextMeetDays = util.daysBetween(new Date(), nextMeet);
    this.setData({ nextMeet, nextMeetDays });
    this.saveSettings({ nextMeet });
  },

  onNotifyStatusChange(e) {
    const notifyStatus = e.detail.value;
    this.setData({ notifyStatus });
    this.saveSettings({ notifyStatus });
  },

  onNotifyNoteChange(e) {
    const notifyNote = e.detail.value;
    this.setData({ notifyNote });
    this.saveSettings({ notifyNote });
  },

  onViewAgreement() {
    wx.showToast({ title: '待完善', icon: 'none' });
  },

  onViewPrivacy() {
    wx.showToast({ title: '待完善', icon: 'none' });
  },
});
