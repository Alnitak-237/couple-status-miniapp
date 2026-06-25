// pages/history/history.js
const cloud = require('../../utils/cloud');
const util = require('../../utils/util');
const { PAGE_SIZE, MOODS } = require('../../utils/constants');
const app = getApp();

Page({
  data: {
    filter: 'all',
    loading: true,
    history: [],
    groupedHistory: [],
    page: 1,
    hasMore: true,
  },

  onShow() {
    this.setData({ page: 1, history: [], hasMore: true });
    this.loadHistory();
  },

  onFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ filter, page: 1, history: [], groupedHistory: [] });
    this.loadHistory();
  },

  async loadHistory() {
    this.setData({ loading: true });

    try {
      const filter = this.data.filter;
      let allData = [];

      allData = await cloud.getStatusHistory({
        filter,
        page: this.data.page,
        pageSize: PAGE_SIZE,
      });

      // 标记是否是我
      const myOpenid = app.globalData.currentUser?._openid || '';
      allData = allData.map(h => ({
        ...h,
        isMe: h._openid === myOpenid,
      }));

      const hasMore = allData.length >= PAGE_SIZE;
      const history = this.data.page === 1 ? allData : [...this.data.history, ...allData];

      this.setData({
        history,
        loading: false,
        hasMore,
      });

      this.groupByDate(history);
    } catch (err) {
      console.error('[history] 加载失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  /** 按日期分组 */
  groupByDate(history) {
    const groups = {};
    const today = util.formatDateOnly(new Date());
    const yesterday = util.formatDateOnly(new Date(Date.now() - 86400000));

    history.forEach(item => {
      const dateStr = util.formatDateOnly(item.createdAt);
      let label = dateStr;
      if (dateStr === today) label = '今天';
      else if (dateStr === yesterday) label = '昨天';

      if (!groups[label]) {
        groups[label] = [];
      }

      // 附加心情信息
      const moodInfo = MOODS.find(m => m.id === item.mood);
      groups[label].push({
        ...item,
        timeStr: util.formatDate(item.createdAt).split(' ')[1], // 只取时间部分
        moodEmoji: moodInfo ? moodInfo.emoji : '',
        moodLabel: moodInfo ? moodInfo.label : '',
      });
    });

    // 保持日期顺序
    const groupedHistory = Object.keys(groups).map(date => ({
      date,
      items: groups[date],
    }));

    this.setData({ groupedHistory });
  },

  loadMore() {
    if (!this.data.hasMore) return;
    this.setData({ page: this.data.page + 1 });
    this.loadHistory();
  },
});
