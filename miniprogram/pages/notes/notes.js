// pages/notes/notes.js
const cloud = require('../../utils/cloud');
const util = require('../../utils/util');
const { validateNoteContent } = require('../../utils/validator');
const { PAGE_SIZE } = require('../../utils/constants');
const app = getApp();

Page({
  data: {
    notes: [],
    loading: true,
    page: 1,
    hasMore: true,

    inputValue: '',
    myAvatar: '',
    partnerAvatar: '',
    scrollToId: '',

    _watcher: null,
  },

  async onLoad() {
    await this.loadNotes();
    await this.loadAvatars();
    this.startWatch();
  },

  onUnload() {
    if (this.data._watcher) {
      this.data._watcher.close();
    }
  },

  // ========== 数据加载 ==========

  async loadNotes() {
    try {
      const myOpenid = app.globalData.currentUser?._openid || '';
      const data = await cloud.getNotes({
        myOpenid,
        page: this.data.page,
        pageSize: PAGE_SIZE,
      });

      const notes = this.data.page === 1 ? data : [...data, ...this.data.notes];

      // 处理数据：标记是否是我发的，格式化时间
      const myOpenid = app.globalData.currentUser?._openid || '';
      const processed = notes.map(note => ({
        ...note,
        isMe: note.fromId === myOpenid,
        timeStr: util.formatDate(note.createdAt),
      }));

      this.setData({
        notes: processed,
        loading: false,
        hasMore: data.length >= PAGE_SIZE,
      });

      // 滚动到底部
      if (processed.length > 0 && this.data.page === 1) {
        const last = processed[processed.length - 1];
        this.setData({ scrollToId: `note-${last._id}` });
      }
    } catch (err) {
      console.error('[notes] 加载失败', err);
      this.setData({ loading: false });
    }
  },

  async loadAvatars() {
    try {
      const profile = await cloud.getMyProfile();
      if (profile) {
        this.setData({ myAvatar: profile.avatarUrl || '' });
      }

      if (app.globalData.partnerId) {
        const partner = await cloud.getPartnerProfile(app.globalData.partnerId);
        if (partner) {
          this.setData({ partnerAvatar: partner.avatarUrl || '' });
        }
      }
    } catch (err) {
      // ignore
    }
  },

  /** 监听新消息 */
  startWatch() {
    const db = wx.cloud.database();
    const watcher = db.collection('notes')
      .where({
        fromId: app.globalData.partnerId,
        toId: '{openid}',
      })
      .watch({
        onChange: (snapshot) => {
          if (snapshot.docChanges) {
            snapshot.docChanges.forEach(change => {
              if (change.dataType === 'add') {
                const newNote = {
                  ...change.doc,
                  isMe: false,
                  timeStr: util.formatDate(change.doc.createdAt),
                };
                this.setData({
                  notes: [...this.data.notes, newNote],
                  scrollToId: `note-${change.doc._id}`,
                });
              }
            });
          }
        },
        onError: (err) => console.error('[notes] watch 出错', err),
      });

    this.setData({ _watcher: watcher });
  },

  // ========== 发送 ==========

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async onSend() {
    const content = this.data.inputValue.trim();
    const valid = validateNoteContent(content);
    if (!valid.valid) {
      wx.showToast({ title: valid.message, icon: 'none' });
      return;
    }

    this.setData({ inputValue: '' });

    try {
      const result = await cloud.sendNote(content);

      // 乐观更新：添加到列表
      const newNote = {
        _id: result.noteId || Date.now().toString(),
        fromId: app.globalData.currentUser?._openid || '',
        toId: app.globalData.partnerId,
        content,
        type: 'text',
        isMe: true,
        timeStr: '刚刚',
        createdAt: new Date(),
      };

      this.setData({
        notes: [...this.data.notes, newNote],
        scrollToId: `note-${newNote._id}`,
      });
    } catch (err) {
      wx.showToast({ title: err.message || '发送失败', icon: 'error' });
      // 恢复输入
      this.setData({ inputValue: content });
    }
  },

  loadMore() {
    if (!this.data.hasMore) return;
    this.setData({ page: this.data.page + 1 });
    this.loadNotes();
  },
});
