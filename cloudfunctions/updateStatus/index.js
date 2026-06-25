// cloudfunctions/updateStatus/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 需要通知的状态 ID
const NOTIFY_STATUSES = ['missing']; // "想你💕"

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { status, emoji, mood, isCustom, statusId } = event;

  if (!status || !emoji) {
    return { code: 400, message: '缺少状态参数' };
  }

  if (status.length > 10) {
    return { code: 400, message: '状态文案过长' };
  }

  try {
    const now = new Date();

    // 1. 查找用户
    const { data: users } = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (users.length === 0) {
      return { code: 1005, message: '用户不存在' };
    }

    const user = users[0];

    // 2. Upsert 状态表
    const { data: existingStatus } = await db.collection('statuses')
      .where({ _openid: OPENID })
      .get();

    if (existingStatus.length > 0) {
      await db.collection('statuses').doc(existingStatus[0]._id).update({
        data: { status, emoji, mood: mood || '', isCustom: !!isCustom, updatedAt: now },
      });
    } else {
      await db.collection('statuses').add({
        data: {
          _openid: OPENID,
          status,
          emoji,
          mood: mood || '',
          isCustom: !!isCustom,
          updatedAt: now,
        },
      });
    }

    // 3. 写入历史
    await db.collection('history').add({
      data: {
        _openid: OPENID,
        status,
        emoji,
        mood: mood || '',
        isCustom: !!isCustom,
        createdAt: now,
      },
    });

    // 4. 判断是否需要推送通知（"想你💕" 等特定状态）
    // 注意：需要用户订阅了消息模板
    if (isCustom === false && statusId && NOTIFY_STATUSES.includes(statusId)) {
      if (user.partnerId) {
        try {
          await cloud.callFunction({
            name: 'sendSubscribeMsg',
            data: {
              toUser: user.partnerId,
              type: 'status',
              status,
              emoji,
              fromName: user.nickName || 'TA',
            },
          });
        } catch (err) {
          console.error('[updateStatus] 推送通知失败', err);
          // 不阻塞状态更新
        }
      }
    }

    return {
      code: 0,
      data: {
        status,
        emoji,
        mood: mood || '',
        updatedAt: now.getTime(),
      },
    };
  } catch (err) {
    console.error('[updateStatus]', err);
    return { code: 500, message: '更新失败' };
  }
};
