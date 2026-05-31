# MUN / 文科 Copilot

一个可运行的付费 AI 工具 MVP：登录、套餐、订单、支付接口、后台加额度、额度扣减、AI 生成接口都已经接好。现在也带了生产部署配置，可以部署到公网。

## 运行

```bash
npm start
```

打开 `http://localhost:3000`。

没有配置 `OPENAI_API_KEY` 时，生成接口会返回演示内容，方便测试登录、额度、套餐和支付流程。配置 Key 后，后端会调用 OpenAI Responses API，Key 不会暴露到前端。

## 环境变量

复制 `.env.example` 到 `.env` 后按需填写：

```bash
OPENAI_API_KEY=你的服务器端 API Key
OPENAI_MODEL=gpt-5
PAYMENT_PROVIDER=mock
DATA_DIR=./data
ADMIN_SECRET=你的后台密钥
```

本项目默认使用本地 JSON 文件作为数据存储：`data/db.json`。这是 MVP 形态，适合校内试跑；正式上线建议换成 PostgreSQL 或托管数据库。

## 公网上线

看 `DEPLOYMENT.md`。现在优先走 Cloudflare Pages + Pages Functions：

- 静态前端在 `public/`
- 后端接口在 `functions/api/[[path]].js`
- 数据存储用 Cloudflare KV，绑定名必须叫 `MUN_DB`

最少需要配置：

```bash
NODE_ENV=production
FRONTEND_BASE_URL=https://educopilot.ccwu.cc
PUBLIC_BASE_URL=https://qinghaxinyu.ccwu.cc
ALLOWED_ORIGINS=https://educopilot.ccwu.cc,https://qinghaxinyu.ccwu.cc
OPENAI_API_KEY=sk-...
PAYMENT_PROVIDER=manual
ALLOW_MANUAL_PAYMENT=true
MANUAL_PAYMENT_NAME=人工收款
MANUAL_PAYMENT_QR_IMAGE_URL=你的收款码图片链接
MANUAL_PAYMENT_NOTE=付款时请备注订单号和注册邮箱
ADMIN_SECRET=一串很长的随机密钥
```

生产环境会禁用模拟支付。没有营业执照时，先用人工收款：用户下单后扫码/转账，你在后台确认到账，系统再开通套餐。

## 已有接口

- `POST /api/auth/register` 注册
- `POST /api/auth/login` 登录
- `GET /api/me` 当前用户、套餐和额度
- `GET /api/plans` 套餐
- `GET /api/openai/status` OpenAI 接入状态
- `POST /api/orders` 创建订单
- `GET /api/orders` 我的订单
- `POST /api/payments/mock/confirm` 本地模拟支付确认
- 人工收款订单由 `POST /api/admin/orders/confirm` 后台确认到账
- `POST /api/payments/wechat/notify` 微信支付回调
- `POST /api/payments/webhook` Stripe/通用支付回调兼容入口
- `POST /api/generate` AI 生成
- `GET /api/history` 生成历史
- `POST /api/admin/grant` 后台加额度/开套餐
- `GET /api/admin/users` 后台用户列表

## 没有营业执照怎么收款

先用人工收款，不接微信支付商户 API：

```bash
PAYMENT_PROVIDER=manual
ALLOW_MANUAL_PAYMENT=true
MANUAL_PAYMENT_NAME=人工收款
MANUAL_PAYMENT_QR_IMAGE_URL=https://你的收款码图片地址
MANUAL_PAYMENT_ACCOUNT=你的微信/支付宝收款账号说明
MANUAL_PAYMENT_NOTE=付款时请备注订单号和注册邮箱。管理员确认到账后开通。
```

前端会显示订单号、付款说明和收款码图片。用户付款后，你在运营后台的“最近订单”里点“确认到账”。

## 有商户号后怎么接微信支付

有营业执照和微信支付商户号后，可以切回微信支付 Native 扫码：

```bash
PAYMENT_PROVIDER=wechat
WECHAT_PAY_APP_ID=wx...
WECHAT_PAY_MCH_ID=1900000001
WECHAT_PAY_MCH_SERIAL_NO=商户 API 证书序列号
WECHAT_PAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WECHAT_PAY_API_V3_KEY=32位APIv3密钥
WECHAT_PAY_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
FRONTEND_BASE_URL=https://educopilot.ccwu.cc
PUBLIC_BASE_URL=https://qinghaxinyu.ccwu.cc
ALLOWED_ORIGINS=https://educopilot.ccwu.cc,https://qinghaxinyu.ccwu.cc
```

创建订单接口会调用微信支付 API v3 Native 下单，前端显示微信二维码。微信支付通知会先验签，再用 `WECHAT_PAY_API_V3_KEY` 解密通知资源；确认 `trade_state=SUCCESS`、金额和商户号一致后自动给用户开通套餐或加额度。

## 当前域名分工

- 前端网站：`https://educopilot.ccwu.cc`
- 后台/API：`https://qinghaxinyu.ccwu.cc`
- 微信支付回调：`https://qinghaxinyu.ccwu.cc/api/payments/wechat/notify`

当前前端会在 `educopilot.ccwu.cc` 自动请求 `qinghaxinyu.ccwu.cc` 的 API。后台服务已带 CORS 配置，生产环境要把 `ALLOWED_ORIGINS` 保持为这两个域名。

## Cloudflare 绑定

Cloudflare Pages 构建设置：

```text
Build command: 留空
Build output directory: public
Functions directory: functions
```

Pages 项目需要在 Settings -> Functions 绑定一个 KV namespace：

```text
Variable name: MUN_DB
```

绑定好以后，`https://qinghaxinyu.ccwu.cc/api/health` 应该返回 JSON。

## 安全边界

- API Key 只在后端环境变量里读取，前端拿不到。
- 每次生成都会扣额度，避免“无限用”亏损。
- 有基础 IP 限流、输入长度限制、每日额度和额外次数。
- 学习类工具的提示词定位为“训练、讲解、改写建议”，避免把产品做成代写工具。
