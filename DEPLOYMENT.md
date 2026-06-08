# 公网上线指南

这份代码已经可以部署成公网网站。真正让“所有人都能用”，必须准备三样东西：

1. 公网托管平台：Render、Railway、Fly.io、VPS 都可以。
2. AI API Key：至少配置 `DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY`；默认推荐 DeepSeek 控制成本。
3. 收款方式：没有营业执照先用人工收款；有商户号后再接微信支付 Native 扫码。

## 推荐方案：Cloudflare Pages + Pages Functions

现在项目已经支持 Cloudflare 原生部署：

- `public/` 是静态前端
- `functions/api/[[path]].js` 是后端 API
- Cloudflare KV 保存用户、订单、额度和生成记录

### Cloudflare Pages 构建设置

从 GitHub 导入 `enshuwu46-png/mun-copilot` 后填写：

```text
Framework preset: None
Build command: 留空
Build output directory: public
Functions directory: functions
```

### Cloudflare KV

在 Cloudflare 创建一个 KV namespace，例如：

```text
mun-copilot-db
```

然后在 Pages 项目里绑定：

```text
Variable name: MUN_DB
KV namespace: mun-copilot-db
```

### Cloudflare 环境变量

生产环境变量：

```bash
NODE_ENV=production
FRONTEND_BASE_URL=https://educopilot.ccwu.cc
PUBLIC_BASE_URL=https://qinghaxinyu.ccwu.cc
ALLOWED_ORIGINS=https://educopilot.ccwu.cc,https://qinghaxinyu.ccwu.cc
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5
DEFAULT_AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_THINKING=disabled
PAYMENT_PROVIDER=manual
ALLOW_MANUAL_PAYMENT=true
MANUAL_PAYMENT_NAME=人工收款
MANUAL_PAYMENT_QR_IMAGE_URL=你的收款码图片链接
MANUAL_PAYMENT_NOTE=付款时请备注订单号和注册邮箱
ADMIN_SECRET=一串很长的随机密钥
```

### 当前域名绑定

推荐把两个自定义域名都绑定到同一个 Cloudflare Pages 项目：

```text
educopilot.ccwu.cc      -> Pages 项目，用作用户访问前端
qinghaxinyu.ccwu.cc      -> 同一个 Pages 项目，用作 API 后台域名
```

前端访问 `educopilot.ccwu.cc` 时，会自动请求：

```text
https://qinghaxinyu.ccwu.cc/api/...
```

部署成功后，先打开：

```text
https://qinghaxinyu.ccwu.cc/api/health
```

它应该返回 JSON，而不是 HTML。

## 备选方案：Render

1. 把这个项目推到 GitHub。
2. 在 Render 新建 Web Service，选择这个仓库。
3. Start Command 填：

```bash
node server.js
```

4. 环境变量按 `.env.production.example` 填。当前域名分工是：

- 前端网站：`https://educopilot.ccwu.cc`
- 后台/API：`https://qinghaxinyu.ccwu.cc`

后端服务环境变量：

```bash
NODE_ENV=production
HOST=0.0.0.0
DATA_DIR=/app/data
FRONTEND_BASE_URL=https://educopilot.ccwu.cc
PUBLIC_BASE_URL=https://qinghaxinyu.ccwu.cc
ALLOWED_ORIGINS=https://educopilot.ccwu.cc,https://qinghaxinyu.ccwu.cc
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5
DEFAULT_AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_THINKING=disabled
PAYMENT_PROVIDER=manual
ALLOW_MANUAL_PAYMENT=true
MANUAL_PAYMENT_NAME=人工收款
MANUAL_PAYMENT_QR_IMAGE_URL=你的收款码图片链接
MANUAL_PAYMENT_NOTE=付款时请备注订单号和注册邮箱
ADMIN_SECRET=一串很长的随机密钥
```

5. 部署完成后，把 `qinghaxinyu.ccwu.cc` 指到这个后端服务，再打开 `https://qinghaxinyu.ccwu.cc/api/health` 检查。

`render.yaml` 已经配置了 `/app/data` 持久化磁盘，用来保存当前 JSON 数据库。后续用户变多时，再把它换成 PostgreSQL。

## Cloudflare 域名配置提醒

你现在的推荐结构是：

```text
educopilot.ccwu.cc      -> Cloudflare Pages 静态前端
qinghaxinyu.ccwu.cc      -> Render/Railway/Fly/VPS 上的 Node 后端
```

前端代码会在访问 `educopilot.ccwu.cc` 时自动请求：

```text
https://qinghaxinyu.ccwu.cc/api/...
```

如果使用上面的 Cloudflare Pages Functions 方案，两个域名可以都绑定到同一个 Pages 项目。如果使用 Render 方案，则 `qinghaxinyu.ccwu.cc` 必须指向 Render 后端服务。

## 上线前检查

部署后打开网站底部的“运营后台”，输入 `ADMIN_SECRET`，点击“刷新运营看板”。生产自检里这些项都应该通过：

- AI 服务商已配置：DeepSeek 或 OpenAI 至少一个可用
- 公网地址是 `https://...`
- 收款方式已配置
- 人工收款不需要支付平台回调，微信支付才需要回调验签
- 后台密钥不是默认值
- 数据存储路径存在

如果某项显示黄色警告，先修配置再推广。

## 没有营业执照：人工收款

先在 Cloudflare Pages 的 Variables and Secrets 中设置：

```bash
PAYMENT_PROVIDER=manual
ALLOW_MANUAL_PAYMENT=true
MANUAL_PAYMENT_NAME=人工收款
MANUAL_PAYMENT_QR_IMAGE_URL=https://你的收款码图片地址
MANUAL_PAYMENT_ACCOUNT=你的微信/支付宝收款账号说明
MANUAL_PAYMENT_NOTE=付款时请备注订单号和注册邮箱。管理员确认到账后开通。
```

前端会显示订单号、付款说明和收款码图片。用户付款后，进入运营后台，在“最近订单”里点“确认到账”即可开通套餐。

个人收款适合早期小范围验证。正式长期经营时，建议补齐主体资质后接微信支付商户 API 或其他合规支付服务。

## 有商户号后：微信支付配置

在微信支付商户平台准备这些参数：

```text
AppID
商户号 MCH_ID
商户 API 证书序列号
商户 API 私钥 PEM
APIv3 密钥
微信支付平台公钥 PEM
```

Cloudflare Pages 的 Variables and Secrets 中至少添加：

```bash
PAYMENT_PROVIDER=wechat
WECHAT_PAY_APP_ID=wx...
WECHAT_PAY_MCH_ID=1900000001
WECHAT_PAY_MCH_SERIAL_NO=...
WECHAT_PAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WECHAT_PAY_API_V3_KEY=32位APIv3密钥
WECHAT_PAY_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

前端会显示微信支付二维码。微信支付通知到达后，后端会验签、解密通知资源、校验金额和商户号，然后自动给用户开通套餐或加额度。

## Docker 部署

```bash
docker build -t mun-copilot .
docker run -p 3000:3000 --env-file .env.production mun-copilot
```

## 重要提醒

- 现在的数据存储是 `data/db.json`，适合早期试跑。真正多用户长期运营，建议下一步换成 PostgreSQL。
- 不要把 `.env`、OpenAI Key、微信支付私钥/APIv3 密钥上传到 GitHub。
- `FRONTEND_BASE_URL` 必须是用户实际访问的前端网站地址。
- `PUBLIC_BASE_URL` 是后台/API 的公网地址，微信支付回调和跨域请求会用到它；人工收款只需要后台能访问。
- `ALLOWED_ORIGINS` 至少包含 `https://educopilot.ccwu.cc`，否则前端会被浏览器拦截跨域请求。
- 后台可以查看用户、订单、营收、生成量，也可以手动确认人工收款订单。
