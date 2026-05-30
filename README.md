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
FRONTEND_BASE_URL=https://ericeva0130.ccwu.cc
PUBLIC_BASE_URL=https://qinghaxinyu.ccwu.cc
ALLOWED_ORIGINS=https://ericeva0130.ccwu.cc,https://qinghaxinyu.ccwu.cc
OPENAI_API_KEY=sk-...
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_SECRET=一串很长的随机密钥
```

生产环境会禁用模拟支付。没有配置 `STRIPE_SECRET_KEY` 时，前端不会显示可用的真实支付方式。

## 已有接口

- `POST /api/auth/register` 注册
- `POST /api/auth/login` 登录
- `GET /api/me` 当前用户、套餐和额度
- `GET /api/plans` 套餐
- `GET /api/openai/status` OpenAI 接入状态
- `POST /api/orders` 创建订单
- `GET /api/orders` 我的订单
- `POST /api/payments/mock/confirm` 本地模拟支付确认
- `POST /api/payments/webhook` 支付回调占位
- `POST /api/generate` AI 生成
- `GET /api/history` 生成历史
- `POST /api/admin/grant` 后台加额度/开套餐
- `GET /api/admin/users` 后台用户列表

## 真实支付怎么接

本地默认 `PAYMENT_PROVIDER=mock`。生产环境请使用 Stripe：

```bash
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_BASE_URL=https://ericeva0130.ccwu.cc
PUBLIC_BASE_URL=https://qinghaxinyu.ccwu.cc
ALLOWED_ORIGINS=https://ericeva0130.ccwu.cc,https://qinghaxinyu.ccwu.cc
```

创建订单接口会创建 Stripe Checkout Session。Webhook 会校验 `Stripe-Signature`，并在收到 `checkout.session.completed` 后自动给用户开通套餐或加额度。

## 当前域名分工

- 前端网站：`https://ericeva0130.ccwu.cc`
- 后台/API：`https://qinghaxinyu.ccwu.cc`
- Stripe Webhook：`https://qinghaxinyu.ccwu.cc/api/payments/webhook`

当前前端会在 `ericeva0130.ccwu.cc` 自动请求 `qinghaxinyu.ccwu.cc` 的 API。后台服务已带 CORS 配置，生产环境要把 `ALLOWED_ORIGINS` 保持为这两个域名。

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
