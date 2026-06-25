// app.js
App({
  async onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('[app] 请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'cloud1-0glkeu1r302c38f0', // 云环境 ID（需替换为实际环境）
      traceUser: true,
    });

    // 等待绑定状态检查完成，确保页面渲染前拿到状态
    await this.checkBindStatus();
    this.globalData.initialized = true;
  },

  /** 全局检查用户绑定状态 */
  async checkBindStatus() {
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('users').where({
        _openid: '{openid}', // 占位符，云开发自动替换
      }).get();

      if (data.length > 0) {
        const user = data[0];
        this.globalData.isBound = !!user.partnerId;
        this.globalData.currentUser = user;
        this.globalData.partnerId = user.partnerId;
      } else {
        // 新用户：自动注册
        try {
          const res = await wx.cloud.callFunction({
            name: 'registerUser',
            data: {},
          });
          if (res.result && res.result.code === 0) {
            this.globalData.currentUser = res.result.data;
          }
        } catch (regErr) {
          console.error('[app] 自动注册失败', regErr);
        }
        this.globalData.isBound = false;
      }
    } catch (err) {
      console.error('[app] 检查绑定状态失败', err);
      this.globalData.isBound = false;
    }
  },

  globalData: {
    isBound: false,
    currentUser: null,
    partnerId: null,
    initialized: false,  // 标记初始化是否完成
    // 预设状态常量
    presetStatuses: [
      { id: 'working', emoji: '💼', text: '办公中' },
      { id: 'eating', emoji: '🍚', text: '干饭中' },
      { id: 'missing', emoji: '💕', text: '想你', notify: true },
      { id: 'sleeping', emoji: '😴', text: '睡觉中' },
      { id: 'slacking', emoji: '🎣', text: '摸鱼中' },
      { id: 'exercising', emoji: '🏃', text: '运动中' },
      { id: 'studying', emoji: '📖', text: '学习中' },
      { id: 'gaming', emoji: '🎮', text: '游戏中' },
    ],
    // 心情列表
    moods: [
      { id: 'happy', emoji: '😊', label: '开心' },
      { id: 'love', emoji: '🥰', label: '甜蜜' },
      { id: 'neutral', emoji: '😐', label: '一般' },
      { id: 'tired', emoji: '😮‍💨', label: '疲惫' },
      { id: 'sad', emoji: '😢', label: '低落' },
    ],
  },
});
