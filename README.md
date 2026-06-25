# 💕 心心相连

> 为异地情侣打造的微信小程序 —— 实时共享彼此状态，让距离不再是距离。

## ✨ 功能

- **双人状态共享** — 预设 8 种状态（办公中、干饭中、想你、睡觉中等），一键切换，对方实时看到
- **自定义状态** — 自由编辑 emoji + 文案，最多 5 个
- **心情指数** — 状态附带心情（开心/甜蜜/疲惫等），传递更细腻的情绪
- **小纸条** — 私密留言，类聊天界面，实时收发
- **状态历史** — 时间线回顾彼此的生活轨迹
- **邀请码绑定** — 6 位邀请码，一对一安全绑定
- **纪念日倒计时** — 在一起多少天、下次见面倒计时
- **实时同步** — 基于微信云开发 watch 监听，状态变更 3 秒内同步

## 🛠 技术栈

- **前端**：微信小程序原生框架
- **后端**：微信云开发 CloudBase（云函数 + 云数据库 + 云存储）
- **实时通信**：云数据库 watch API
- **消息推送**：微信订阅消息

## 📁 项目结构

```
├── miniprogram/                # 小程序前端
│   ├── pages/
│   │   ├── index/              # 首页（双人状态卡片）
│   │   ├── bind/               # 绑定页（邀请码）
│   │   ├── mine/               # 我的（头像/自定义状态）
│   │   ├── history/            # 状态历史时间线
│   │   ├── notes/              # 小纸条
│   │   └── settings/           # 设置（纪念日/通知）
│   ├── components/
│   │   ├── status-card/        # 状态卡片组件
│   │   └── status-picker/      # 状态选择器组件
│   └── utils/                  # 工具函数
├── cloudfunctions/             # 云函数
│   ├── registerUser/           # 新用户注册
│   ├── generateBindCode/       # 生成邀请码
│   ├── bindPartner/            # 绑定操作（事务）
│   ├── updateStatus/           # 更新状态 + 写历史
│   ├── getHistory/             # 查询历史
│   ├── sendNote/               # 发送小纸条
│   ├── sendSubscribeMsg/       # 推送订阅消息
│   └── cleanupHistory/         # 定时清理历史
└── project.config.json
```

## 🚀 快速开始

### 前置条件

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 微信小程序 AppID
- 开通微信云开发

### 步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/Alnitak-237/couple-status-miniapp.git
   ```

2. **导入项目**  
   微信开发者工具 → 导入项目 → 选择仓库目录 → 填入 AppID

3. **配置云环境**  
   修改 `miniprogram/app.js` 中的 `env` 为你的云环境 ID

4. **创建数据库集合**  
   在云开发控制台创建以下集合：`users`、`statuses`、`history`、`notes`、`settings`

5. **上传云函数**  
   右键 `cloudfunctions/` 下每个云函数 → 上传并部署

6. **配置订阅消息（可选）**  
   在微信公众平台配置订阅消息模板，填入 `sendSubscribeMsg/index.js`

7. **预览测试**  
   开发者工具预览，用两台手机分别扫码测试绑定流程

## 📄 License

MIT

---

> 💌 为异地的心，搭一座桥。
