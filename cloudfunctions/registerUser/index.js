// cloudfunctions/registerUser/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * 新用户注册
 * 检查用户是否已存在，不存在则创建 users 记录
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  try {
    // 检查是否已注册
    const { data: users } = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (users.length > 0) {
      return { code: 0, data: users[0] };
    }

    // 创建新用户记录
    const result = await db.collection('users').add({
      data: {
        _openid: OPENID,
        nickName: '',
        avatarUrl: '',
        partnerId: null,
        bindCode: null,
        bindCodeExpire: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      code: 0,
      data: {
        _id: result._id,
        _openid: OPENID,
        nickName: '',
        avatarUrl: '',
        partnerId: null,
      },
    };
  } catch (err) {
    console.error('[registerUser]', err);
    return { code: 500, message: '注册失败' };
  }
};
