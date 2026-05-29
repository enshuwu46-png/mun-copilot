# 公网上线指南

这份代码已经可以部署成公网网站。真正让“所有人都能用”，必须准备三样东西：

1. 公网托管平台：Render、Railway、Fly.io、VPS 都可以。
2. OpenAI API Key：填到服务器环境变量 `OPENAI_API_KEY`。
3. 真实支付：推荐先接 Stripe Checkout，填 `STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET`。

## 推荐方案：Render

1. 把这个项目推到 GitHub。
2. 在 Render 新建 Web Service，选择这个仓库。
3. Start Command 填：

```bash
node server.js
```

4. 环境变量按 `.env.production.example` 填：

```bash
NODE_ENV=production
HOST=0.0.0.0
DATA_DIR=/app/data
PUBLIC_BASE_URL=https://你的公网域名
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_SECRET=一串很长的随机密钥
```

5. 部署完成后，打开 Render 给你的 `https://...onrender.com` 链接。

`render.yaml` 已经配置了 `/app/data` 持久化磁盘，用来保存当前 JSON 数据库。后续用户变多时，再把它换成 PostgreSQL。

## 上线前检查

部署后打开网站底部的“运营后台”，输入 `ADMIN_SECRET`，点击“刷新运营看板”。生产自检里这些项都应该通过：

- OpenAI API 已配置
- 公网地址是 `https://...`
- Stripe 支付已配置
- Stripe Webhook 签名密钥已配置
- 后台密钥不是默认值
- 数据存储路径存在

如果某项显示黄色警告，先修配置再推广。

## Stripe 支付配置

在 Stripe Dashboard 创建 webhook endpoint：

```text
https://你的公网域名/api/payments/webhook
```

订阅事件：

```text
checkout.session.completed
```

把 Stripe 给你的 Signing secret 填到：

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

生产环境下，模拟支付会被禁用；只有配置好的真实支付方式会显示在前端。

## Docker 部署

```bash
docker build -t mun-copilot .
docker run -p 3000:3000 --env-file .env.production mun-copilot
```

## 重要提醒

- 现在的数据存储是 `data/db.json`，适合早期试跑。真正多用户长期运营，建议下一步换成 PostgreSQL。
- 不要把 `.env`、OpenAI Key、Stripe Secret 上传到 GitHub。
- `PUBLIC_BASE_URL` 必须是用户实际访问的网站地址，否则 Stripe 支付成功后跳转会不对。
- 后台可以查看用户、订单、营收、生成量，也可以手动确认人工收款订单。
