// cloudfunctions/sendNote/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { content, type } = event;

  if (!content || content.trim().length === 0) {
    return { code: 400, message: '内容不能为空' };
  }

  if (content.trim().length > 200) {
    return { code: 400, message: '内容过长' };
  }

  try {
    // 获取发送者信息
    const { data: users } = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (users.length === 0) {
      return { code: 1005, message: '用户不存在' };
    }

    const user = users[0];
    if (!user.partnerId) {
      return { code: 1006, message: '请先绑定' };
    }

    // 写入小纸条
    const result = await db.collection('notes').add({
      data: {
        fromId: OPENID,
        toId: user.partnerId,
        content: content.trim(),
        type: type || 'text',
        voiceUrl: null,
        voiceDuration: null,
        isRead: false,
        createdAt: new Date(),
      },
    });

    // 推送通知给对方
    try {
      await cloud.callFunction({
        name: 'sendSubscribeMsg',
        data: {
          toUser: user.partnerId,
          type: 'note',
          fromName: user.nickName || 'TA',
        },
      });
    } catch (err) {
      console.error('[sendNote] 推送通知失败', err);
      // 不阻塞发送
    }

    return {
      code: 0,
      data: {
        noteId: result._id,
        createdAt: new Date().getTime(),
      },
    };
  } catch (err) {
    console.error('[sendNote]', err);
    return { code: 500, message: '发送失败' };
  }
};
