// utils/cloud.js — 云开发统一封装

const db = wx.cloud.database();
const _ = db.command;

// ============================================================
// 查询类
// ============================================================

/** 获取当前用户信息 */
async function getMyProfile() {
  try {
    const { data } = await db.collection('users')
      .where({ _openid: '{openid}' })
      .get();
    return data[0] || null;
  } catch (err) {
    console.error('[cloud] getMyProfile 失败', err);
    throw err;
  }
}

/** 获取对方信息 */
async function getPartnerProfile(partnerId) {
  if (!partnerId) return null;
  try {
    const { data } = await db.collection('users')
      .where({ _openid: partnerId })
      .get();
    return data[0] || null;
  } catch (err) {
    console.error('[cloud] getPartnerProfile 失败', err);
    throw err;
  }
}

/** 获取对方当前状态 */
async function getPartnerStatus(partnerId) {
  if (!partnerId) return null;
  try {
    const { data } = await db.collection('statuses')
      .where({ _openid: partnerId })
      .get();
    return data[0] || null;
  } catch (err) {
    console.error('[cloud] getPartnerStatus 失败', err);
    throw err;
  }
}

/** 获取我的当前状态 */
async function getMyStatus() {
  try {
    const { data } = await db.collection('statuses')
      .where({ _openid: '{openid}' })
      .get();
    return data[0] || null;
  } catch (err) {
    console.error('[cloud] getMyStatus 失败', err);
    throw err;
  }
}

/** 获取状态历史（通过云函数，支持双方数据）
 * @param {string} filter - 'me' | 'partner' | 'all'
 */
async function getStatusHistory({ filter = 'all', page = 1, pageSize = 20 } = {}) {
  return callFunction('getHistory', { filter, page, pageSize });
}

/** 获取小纸条列表（分页）
 * @param {string} myOpenid - 当前用户的 openid（必填）
 */
async function getNotes({ myOpenid = null, page = 1, pageSize = 30 } = {}) {
  try {
    let query = db.collection('notes');

    if (myOpenid) {
      // 双方的消息：我是发送者或接收者
      query = query.where(_.or([
        { fromId: myOpenid },
        { toId: myOpenid },
      ]));
    }

    const { data } = await query
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return data.reverse(); // 返回正序
  } catch (err) {
    console.error('[cloud] getNotes 失败', err);
    throw err;
  }
}

/** 监听对方状态变更（实时） */
function watchPartnerStatus(partnerId, callback) {
  if (!partnerId) return null;

  const watcher = db.collection('statuses')
    .where({ _openid: partnerId })
    .watch({
      onChange(snapshot) {
        if (snapshot.docs && snapshot.docs.length > 0) {
          callback(snapshot.docs[0]);
        }
      },
      onError(err) {
        console.error('[cloud] watchPartnerStatus 出错', err);
      },
    });

  return watcher;
}

// ============================================================
// 命令类（通过云函数）
// ============================================================

/** 通用云函数调用 */
async function callFunction(name, data = {}) {
  try {
    const res = await wx.cloud.callFunction({ name, data });
    if (res.result && res.result.code === 0) {
      return res.result.data;
    }
    throw new Error(res.result?.message || `${name} 执行失败`);
  } catch (err) {
    console.error(`[cloud] callFunction ${name} 失败`, err);
    throw err;
  }
}

/** 生成绑定邀请码 */
function generateBindCode() {
  return callFunction('generateBindCode');
}

/** 执行绑定 */
function bindPartner(bindCode) {
  return callFunction('bindPartner', { bindCode });
}

/** 更新状态 */
function updateStatus(statusData) {
  return callFunction('updateStatus', statusData);
}

/** 发送小纸条 */
function sendNote(content, type = 'text') {
  return callFunction('sendNote', { content, type });
}

module.exports = {
  // 查询
  getMyProfile,
  getPartnerProfile,
  getPartnerStatus,
  getMyStatus,
  getStatusHistory,
  getNotes,
  watchPartnerStatus,
  // 命令
  generateBindCode,
  bindPartner,
  updateStatus,
  sendNote,
};
