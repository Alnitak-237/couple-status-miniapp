// cloudfunctions/sendSubscribeMsg/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 发送微信订阅消息
 *
 * 前置条件：
 * 1. 小程序后台配置订阅消息模板
 * 2. 用户在小程序内授权订阅
 *
 * 模板示例：
 * - 状态变更：templateId: "xxx"  (状态更新通知)
 * - 小纸条：  templateId: "yyy"  (新消息通知)
 */
exports.main = async (event, context) => {
  const { toUser, type, status, emoji, fromName } = event;

  if (!toUser) {
    return { code: 400, message: '缺少接收者' };
  }

  try {
    // 模板 ID 需在微信公众平台配置后替换
    const TEMPLATES = {
      status: 'TODO_STATUS_TEMPLATE_ID',  // 状态变更模板
      note: 'TODO_NOTE_TEMPLATE_ID',      // 新消息模板
    };

    const templateId = TEMPLATES[type];
    if (!templateId || templateId.startsWith('TODO_')) {
      console.log('[sendSubscribeMsg] 模板未配置，跳过推送', type);
      return { code: 0, message: '模板未配置' };
    }

    const msgData = type === 'status' ? {
      thing1: { value: `${emoji} ${status}` },       // 状态
      name2: { value: fromName },                      // 昵称
      time3: { value: new Date().toLocaleString() },   // 时间
    } : {
      thing1: { value: '你收到一条小纸条' },
      name2: { value: fromName },
      time3: { value: new Date().toLocaleString() },
    };

    await cloud.openapi.subscribeMessage.send({
      touser: toUser,
      templateId,
      data: msgData,
      page: 'pages/index/index',  // 点击跳转首页
    });

    return { code: 0 };
  } catch (err) {
    console.error('[sendSubscribeMsg]', err);
    // 订阅消息失败不应阻断主流程
    return { code: 0, message: '推送失败但不影响主流程' };
  }
};
