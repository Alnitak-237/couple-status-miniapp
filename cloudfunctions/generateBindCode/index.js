// cloudfunctions/generateBindCode/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 6 位邀请码，24 小时过期
const CODE_LENGTH = 6;
const EXPIRE_HOURS = 24;

/** 生成随机邀请码 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  try {
    // 检查是否已绑定
    const { data: users } = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (users.length === 0) {
      return { code: 1005, message: '用户不存在，请先登录' };
    }

    const user = users[0];
    if (user.partnerId) {
      return { code: 1003, message: '你已绑定过' };
    }

    // 生成唯一邀请码（最多重试 10 次）
    let bindCode;
    let retries = 0;
    while (retries < 10) {
      bindCode = generateCode();
      const { total } = await db.collection('users')
        .where({
          bindCode,
          _openid: _.neq(OPENID),
        })
        .count();

      if (total === 0) break;
      retries++;
    }

    if (retries >= 10) {
      return { code: 500, message: '生成邀请码失败，请重试' };
    }

    // 写入数据库
    const expireAt = Date.now() + EXPIRE_HOURS * 60 * 60 * 1000;
    await db.collection('users').doc(user._id).update({
      data: {
        bindCode,
        bindCodeExpire: expireAt,
      },
    });

    return {
      code: 0,
      data: {
        bindCode,
        expireAt,
      },
    };
  } catch (err) {
    console.error('[generateBindCode]', err);
    return { code: 500, message: '服务器错误' };
  }
};
