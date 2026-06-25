// cloudfunctions/bindPartner/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { bindCode } = event;

  if (!bindCode || typeof bindCode !== 'string' || bindCode.trim().length !== 6) {
    return { code: 400, message: '邀请码格式错误' };
  }

  const code = bindCode.trim().toUpperCase();

  try {
    // 1. 获取当前用户
    const { data: myUsers } = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (myUsers.length === 0) {
      return { code: 1005, message: '用户不存在' };
    }

    const me = myUsers[0];
    if (me.partnerId) {
      return { code: 1003, message: '你已绑定过，请先解除绑定' };
    }

    // 2. 查找邀请码所属用户
    const { data: partnerUsers } = await db.collection('users')
      .where({
        bindCode: code,
        _openid: cloud.database().command.neq(OPENID),
      })
      .get();

    if (partnerUsers.length === 0) {
      return { code: 1001, message: '邀请码无效' };
    }

    const partner = partnerUsers[0];

    // 3. 校验邀请码过期
    if (partner.bindCodeExpire && partner.bindCodeExpire < Date.now()) {
      return { code: 1001, message: '邀请码已过期' };
    }

    // 4. 校验不能绑定自己
    if (partner._openid === OPENID) {
      return { code: 1002, message: '不能绑定自己' };
    }

    // 5. 校验对方是否已绑定
    if (partner.partnerId) {
      return { code: 1004, message: '对方已绑定过' };
    }

    // 6. 使用云开发事务保证双向绑定的原子性
    const transaction = await db.startTransaction();

    try {
      const userCollection = transaction.collection('users');
      const statusCollection = transaction.collection('statuses');

      // 双向绑定
      await userCollection.doc(me._id).update({
        data: {
          partnerId: partner._openid,
          bindCode: null,
          bindCodeExpire: null,
        },
      });

      await userCollection.doc(partner._id).update({
        data: {
          partnerId: OPENID,
          bindCode: null,
          bindCodeExpire: null,
        },
      });

      // 初始化双方状态
      const defaultStatus = { emoji: '🌟', status: '在线', mood: '', updatedAt: new Date() };
      await statusCollection.add({
        data: { _openid: OPENID, ...defaultStatus },
      });
      await statusCollection.add({
        data: { _openid: partner._openid, ...defaultStatus },
      });

      await transaction.commit();

      return {
        code: 0,
        data: {
          partner: {
            nickName: partner.nickName,
            avatarUrl: partner.avatarUrl,
          },
        },
      };
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
  } catch (err) {
    console.error('[bindPartner]', err);
    return { code: 500, message: '绑定失败，请重试' };
  }
};
