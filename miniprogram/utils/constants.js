// utils/constants.js — 常量定义

/** 预设状态列表 */
const PRESET_STATUSES = [
  { id: 'working',    emoji: '💼', text: '办公中' },
  { id: 'eating',     emoji: '🍚', text: '干饭中' },
  { id: 'missing',    emoji: '💕', text: '想你',    notify: true },
  { id: 'sleeping',   emoji: '😴', text: '睡觉中' },
  { id: 'slacking',   emoji: '🎣', text: '摸鱼中' },
  { id: 'exercising', emoji: '🏃', text: '运动中' },
  { id: 'studying',   emoji: '📖', text: '学习中' },
  { id: 'gaming',     emoji: '🎮', text: '游戏中' },
];

/** 心情列表 */
const MOODS = [
  { id: 'happy',   emoji: '😊',   label: '开心' },
  { id: 'love',    emoji: '🥰',   label: '甜蜜' },
  { id: 'neutral', emoji: '😐',   label: '一般' },
  { id: 'tired',   emoji: '😮‍💨', label: '疲惫' },
  { id: 'sad',     emoji: '😢',   label: '低落' },
];

/** 绑定码配置 */
const BIND_CODE_LENGTH = 6;
const BIND_CODE_EXPIRE_HOURS = 24;

/** 分页 */
const PAGE_SIZE = 20;

/** 自定义状态最大数量 */
const MAX_CUSTOM_STATUS = 5;

module.exports = {
  PRESET_STATUSES,
  MOODS,
  BIND_CODE_LENGTH,
  BIND_CODE_EXPIRE_HOURS,
  PAGE_SIZE,
  MAX_CUSTOM_STATUS,
};
