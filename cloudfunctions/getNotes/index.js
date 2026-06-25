// cloudfunctions/getNotes/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

/**
 * 获取双方小纸条列表
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { page = 1, pageSize = 30 } = event;

  try {
    // 获取当前用户和 partnerId
    const { data: users } = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (users.length === 0) {
      return { code: 0, data: [] };
    }

    const user = users[0];
    const partnerId = user.partnerId;

    if (!partnerId) {
      // 未绑定，只查自己的
      const { data } = await db.collection('notes')
        .where(_.or([
          { fromId: OPENID },
          { toId: OPENID },
        ]))
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return { code: 0, data: data.reverse() };
    }

    // 已绑定：查双方的消息
    const { data } = await db.collection('notes')
      .where(_.or([
        { fromId: OPENID, toId: partnerId },
        { fromId: partnerId, toId: OPENID },
      ]))
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return { code: 0, data: data.reverse() };
  } catch (err) {
    console.error('[getNotes]', err);
    return { code: 500, message: '查询失败' };
  }
};
