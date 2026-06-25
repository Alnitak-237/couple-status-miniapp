// cloudfunctions/cleanupHistory/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

/**
 * 定时触发器：每天凌晨 3 点清理 30 天前的历史记录
 * trigger 配置：
 * {
 *   "triggers": [{
 *     "name": "dailyCleanup",
 *     "type": "timer",
 *     "config": "0 0 3 * * * *"
 *   }]
 * }
 */
exports.main = async (event, context) => {
  const RETENTION_DAYS = 30;
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  try {
    const result = await db.collection('history')
      .where({
        createdAt: _.lt(cutoff),
      })
      .remove();

    console.log(`[cleanupHistory] 清理了 ${result.stats.removed || 0} 条历史记录`);
    return { code: 0, data: { removed: result.stats.removed || 0 } };
  } catch (err) {
    console.error('[cleanupHistory]', err);
    return { code: 500, message: '清理失败' };
  }
};
