// cloudfunctions/getHistory/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

/**
 * 获取状态历史
 * @param {string} event.filter - 'me' | 'partner' | 'all'
 * @param {number} event.page - 页码
 * @param {number} event.pageSize - 每页条数
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { filter = 'all', page = 1, pageSize = 20 } = event;

  try {
    // 获取用户信息（需要 partnerId）
    const { data: users } = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (users.length === 0) {
      return { code: 1005, message: '用户不存在' };
    }

    const user = users[0];
    let query;

    if (filter === 'me') {
      query = db.collection('history').where({ _openid: OPENID });
    } else if (filter === 'partner') {
      if (!user.partnerId) {
        return { code: 0, data: [] };
      }
      query = db.collection('history').where({ _openid: user.partnerId });
    } else {
      // all：双方数据
      const partnerId = user.partnerId;
      if (partnerId) {
        query = db.collection('history').where(
          _.or([{ _openid: OPENID }, { _openid: partnerId }])
        );
      } else {
        query = db.collection('history').where({ _openid: OPENID });
      }
    }

    const { data } = await query
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return { code: 0, data };
  } catch (err) {
    console.error('[getHistory]', err);
    return { code: 500, message: '查询失败' };
  }
};
