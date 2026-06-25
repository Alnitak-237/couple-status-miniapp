// components/status-card/status-card.js
const util = require('../../utils/util');

Component({
  properties: {
    // 是否是我的卡片
    isMine: {
      type: Boolean,
      value: false,
    },
    // 昵称
    nickName: {
      type: String,
      value: '未知',
    },
    // 头像地址
    avatarUrl: {
      type: String,
      value: '',
    },
    // 状态 emoji
    emoji: {
      type: String,
      value: '🌟',
    },
    // 状态文案
    statusText: {
      type: String,
      value: '暂无状态',
    },
    // 心情 emoji
    moodEmoji: {
      type: String,
      value: '',
    },
    // 心情标签
    moodLabel: {
      type: String,
      value: '',
    },
    // 状态更新时间
    updatedAt: {
      type: Number,
      value: 0,
    },
    // 是否在线
    online: {
      type: Boolean,
      value: false,
    },
    // 头像占位图
    placeholder: {
      type: String,
      value: '',
    },
  },

  data: {
    timeText: '',
  },

  lifetimes: {
    attached() {
      // 初始化时间文本
      if (this.properties.updatedAt) {
        this.setData({
          timeText: util.formatRelativeTime(this.properties.updatedAt),
        });
      }
    },
  },

  observers: {
    'updatedAt'(val) {
      if (val) {
        this.setData({
          timeText: util.formatRelativeTime(val),
        });
      } else {
        this.setData({ timeText: '' });
      }
    },
  },

  methods: {
    /** 点击卡片 */
    onCardTap(e) {
      const { isMine } = e.currentTarget.dataset;
      this.triggerEvent('tap', { isMine });
    },

    /** 点击头像 */
    onAvatarTap() {
      if (this.properties.avatarUrl) {
        wx.previewImage({
          urls: [this.properties.avatarUrl],
          current: this.properties.avatarUrl,
        });
      }
    },

    /** 发小纸条 */
    onSendNote() {
      this.triggerEvent('sendnote');
    },
  },
});
