// components/status-picker/status-picker.js
const { validateCustomStatus } = require('../../utils/validator');

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    currentStatus: {
      type: Object,
      value: {},
    },
  },

  data: {
    presetStatuses: [],
    customStatuses: [],  // 用户自定义状态
    moods: [],

    // 选中状态
    selectedId: '',
    selectedEmoji: '',
    selectedText: '',
    selectedNotify: false,

    // 自定义
    isCustomMode: false,
    customEmoji: '',
    customText: '',
    customError: '',

    // 心情
    selectedMood: '',
  },

  observers: {
    'show'(val) {
      if (val) {
        // 每次打开时重新加载自定义状态
        const customStatuses = wx.getStorageSync('customStatuses') || [];
        this.setData({ customStatuses });
      }
    },
  },

  lifetimes: {
    attached() {
      // 安全获取全局数据
      const app = getApp();
      const customStatuses = wx.getStorageSync('customStatuses') || [];
      this.setData({
        presetStatuses: app.globalData?.presetStatuses || [],
        moods: app.globalData?.moods || [],
        customStatuses,
      });

      // 初始化选中当前状态
      const cs = this.properties.currentStatus;
      if (cs && cs.emoji && cs.status) {
        // 检查是否是预设状态
        const preset = this.data.presetStatuses.find(
          p => p.emoji === cs.emoji && p.text === cs.status
        );
        if (preset) {
          this.setData({
            selectedId: preset.id,
            selectedEmoji: preset.emoji,
            selectedText: preset.text,
            selectedNotify: preset.notify || false,
          });
        } else {
          // 自定义状态
          this.setData({
            isCustomMode: true,
            customEmoji: cs.emoji || '',
            customText: cs.status || '',
            selectedEmoji: cs.emoji || '',
            selectedText: cs.status || '',
          });
        }
      }
    },
  },

  methods: {
    noop() {},

    onClose() {
      this.triggerEvent('close');
    },

    /** 选择预设状态 */
    onSelectPreset(e) {
      const { id, emoji, text, notify } = e.currentTarget.dataset;
      this.setData({
        selectedId: id,
        selectedEmoji: emoji,
        selectedText: text,
        selectedNotify: notify || false,
        isCustomMode: false,
        customEmoji: '',
        customText: '',
        customError: '',
      });
    },

    /** 选择自定义状态（来自 mine 页面保存的） */
    onSelectCustomStatus(e) {
      const { id, emoji, text } = e.currentTarget.dataset;
      this.setData({
        selectedId: id,
        selectedEmoji: emoji,
        selectedText: text,
        selectedNotify: false,
        isCustomMode: false,
        customEmoji: '',
        customText: '',
        customError: '',
      });
    },

    /** 进入自定义模式 */
    onEnterCustom() {
      this.setData({
        isCustomMode: true,
        selectedId: '',
        selectedNotify: false,
      });
    },

    /** 自定义 emoji 输入 */
    onCustomEmojiInput(e) {
      this.setData({ customEmoji: e.detail.value, customError: '' });
    },

    /** 自定义文本输入 */
    onCustomTextInput(e) {
      this.setData({ customText: e.detail.value, customError: '' });
    },

    /** 选择心情 */
    onSelectMood(e) {
      const mood = e.currentTarget.dataset.mood;
      this.setData({
        selectedMood: this.data.selectedMood === mood ? '' : mood,
      });
    },

    /** 确认切换 */
    onConfirm() {
      let emoji, text, isCustom;

      if (this.data.isCustomMode) {
        // 自定义状态
        const valid = validateCustomStatus(this.data.customText);
        if (!valid.valid) {
          this.setData({ customError: valid.message });
          return;
        }
        emoji = this.data.customEmoji || '💬';
        text = this.data.customText.trim();
        isCustom = true;
      } else {
        // 预设状态
        if (!this.data.selectedId) {
          wx.showToast({ title: '请选择一个状态', icon: 'none' });
          return;
        }
        emoji = this.data.selectedEmoji;
        text = this.data.selectedText;
        isCustom = false;
      }

      this.triggerEvent('confirm', {
        status: text,
        emoji,
        mood: this.data.selectedMood || '',
        isCustom,
        statusId: this.data.selectedId || '',
      });
    },
  },
});
