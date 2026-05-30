const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { URLSearchParams } = require("node:url");

const ROOT = __dirname;
loadEnvFile(path.join(ROOT, ".env"));

const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const HOST = process.env.HOST || (IS_PRODUCTION ? "0.0.0.0" : "127.0.0.1");
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5";
const PRODUCTION_FRONTEND_BASE_URL = "https://ericeva0130.ccwu.cc";
const PRODUCTION_API_BASE_URL = "https://qinghaxinyu.ccwu.cc";
const LOCAL_BASE_URL = `http://${HOST}:${PORT}`;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || process.env.PUBLIC_SITE_URL || (IS_PRODUCTION ? PRODUCTION_FRONTEND_BASE_URL : LOCAL_BASE_URL);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.API_PUBLIC_BASE_URL || (IS_PRODUCTION ? PRODUCTION_API_BASE_URL : LOCAL_BASE_URL);
const ALLOWED_ORIGINS = parseOriginList(process.env.ALLOWED_ORIGINS || `${FRONTEND_BASE_URL},${PUBLIC_BASE_URL}`);
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, "data");
const DB_FILE = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(DATA_DIR, "db.json");

function parseOriginList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const PLANS = {
  free: {
    id: "free",
    name: "体验版",
    priceCents: 0,
    dailyLimit: 3,
    durationDays: 0,
    badge: "试用",
    description: "每天 3 次，适合体验固定表单生成。"
  },
  starter: {
    id: "starter",
    name: "月卡",
    priceCents: 990,
    dailyLimit: 20,
    durationDays: 31,
    badge: "个人",
    description: "作文、政治、历史、语文和模联工具都可用。"
  },
  pro: {
    id: "pro",
    name: "高级版",
    priceCents: 2900,
    dailyLimit: 80,
    durationDays: 31,
    badge: "高频",
    description: "适合备赛、社团骨干和长期文科训练。"
  },
  club: {
    id: "club",
    name: "社团版",
    priceCents: 9900,
    dailyLimit: 300,
    durationDays: 31,
    badge: "团队",
    description: "适合模联队、学生会和校内项目小组。"
  },
  credits_50: {
    id: "credits_50",
    name: "50 次加油包",
    priceCents: 1900,
    dailyLimit: 0,
    durationDays: 0,
    extraCredits: 50,
    badge: "加量",
    description: "不改套餐，直接增加 50 次额外生成额度。"
  }
};

const TOOL_CONFIG = {
  essay: {
    title: "作文立意与修改",
    cost: 1,
    instructions:
      "你是高中语文写作教练。你的任务是帮助学生理解题目、优化立意、修改表达和形成训练稿。不要替学生承诺满分，不要鼓励直接照抄，输出应包含可学习的修改理由。",
    buildPrompt: (f) => `
作文题目：${f.topic}
已有草稿：${f.draft || "无"}
目标风格：${f.style || "清晰、有思想、有高中语文答题感"}
字数要求：${f.wordCount || f.length || "按题目需要"}

请输出：
1. 题目核心矛盾
2. 3 个可选立意，并说明优劣
3. 推荐标题 5 个
4. 对原文的结构和表达修改建议
5. 一段示范开头和一段示范结尾
`
  },
  politics: {
    title: "政治大题训练",
    cost: 1,
    instructions:
      "你是高中政治主观题训练教练。输出用于训练和讲评，强调材料提取、知识点对应和答题结构。不要把答案包装成考试作弊内容。",
    buildPrompt: (f) => `
题目：${f.question}
材料：${f.material}
模块：${f.module || "中国特色社会主义/经济与社会/政治与法治/哲学与文化/当代国际政治与经济"}
难度：${f.difficulty || "高考与名校月考之间"}

请输出：
1. 审题关键词
2. 材料分层
3. 知识点映射
4. 答题模板
5. 示例答案
6. 常见失分点
`
  },
  history: {
    title: "历史材料题解析",
    cost: 1,
    instructions:
      "你是高中历史材料题教练。请重视材料分层、时空定位、史实关联和规范表达，输出应服务于学习训练。",
    buildPrompt: (f) => `
题目：${f.question}
材料：${f.material}
时期/主题：${f.period || "未指定"}
要求：${f.requirement || "分层解析并给出示例答案"}

请输出：
1. 时空定位
2. 材料逐层概括
3. 可调用史实
4. 答题逻辑链
5. 示例答案
6. 拓展追问
`
  },
  chineseReading: {
    title: "语文阅读答题",
    cost: 1,
    instructions:
      "你是高中语文阅读题教练。输出要帮助学生理解文本、题型和答题路径，避免空泛套话。",
    buildPrompt: (f) => `
文本/节选：${f.passage}
题目：${f.question}
题型：${f.type || "现代文/古诗文/文学类文本"}
目标：${f.goal || "形成规范答案"}

请输出：
1. 文本关键信息
2. 题目真正问什么
3. 答题角度
4. 可套用但不空泛的句式
5. 示例答案
`
  },
  munPosition: {
    title: "模联立场文件",
    cost: 2,
    instructions:
      "你是严谨的模联教练。请帮助代表形成研究框架、国家立场、政策论据和可执行方案。不要虚构具体条约编号或数据；不确定时标注需要核查。",
    buildPrompt: (f) => `
委员会：${f.committee}
国家/席位：${f.country}
议题：${f.topic}
会议要求：${f.requirement || "标准立场文件"}
已有资料：${f.sources || "无"}

请输出：
1. 议题背景
2. 国家利益与历史立场
3. 核心论点
4. 可引用材料方向
5. 解决方案框架
6. 立场文件草稿
7. 需要进一步核查的事实清单
`
  },
  munSpeech: {
    title: "模联发言稿",
    cost: 1,
    instructions:
      "你是模联发言训练教练。输出要有会议语言、国家立场、可说出口的节奏和攻防意识。",
    buildPrompt: (f) => `
委员会：${f.committee}
国家/席位：${f.country}
议题：${f.topic}
会议阶段：${f.stage || "正式辩论"}
发言时长：${f.duration || "60 秒"}
核心立场：${f.position}

请输出：
1. 中文发言稿
2. 英文发言稿
3. 30 秒压缩版
4. 可追加的攻防句
5. 语气和节奏建议
`
  },
  munMotion: {
    title: "动议与质询清单",
    cost: 1,
    instructions:
      "你是模联会场策略教练。输出要具体、可执行、符合会议流程，避免攻击性或不当表达。",
    buildPrompt: (f) => `
委员会：${f.committee}
国家/席位：${f.country}
议题：${f.topic}
当前局势：${f.situation}
目标：${f.goal || "推动本国方案并争取盟友"}

请输出：
1. 可提动议 8 条
2. 每条动议的目的和适用时机
3. 质询其他国家的问题 10 个
4. 可能被质询时的回应
5. 盟友与反对方判断
`
  }
};

const rateBuckets = new Map();

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    writeDb({
      users: {},
      sessions: {},
      orders: {},
      generations: []
    });
  }
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  db.users ||= {};
  db.sessions ||= {};
  db.orders ||= {};
  db.generations ||= [];
  return db;
}

function writeDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...securityHeaders(),
    ...headers
  });
  res.end(body);
}

function text(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": contentType, ...securityHeaders() });
  res.end(body);
}

function securityHeaders() {
  return {
    "x-content-type-options": "nosniff",
    "referrer-policy": "same-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()"
  };
}

function originAllowed(origin) {
  if (!origin) return false;
  const cleanOrigin = String(origin).replace(/\/$/, "");
  return ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(cleanOrigin);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!originAllowed(origin)) return;
  res.setHeader("access-control-allow-origin", origin);
  res.setHeader("vary", "Origin");
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, authorization, x-admin-secret, stripe-signature, x-webhook-secret, wechatpay-signature, wechatpay-timestamp, wechatpay-nonce, wechatpay-serial, wechatpay-signature-type");
  res.setHeader("access-control-max-age", "86400");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      req.rawBody = raw;
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function publicUser(user) {
  const plan = effectivePlan(user);
  resetDailyIfNeeded(user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    planId: user.planId,
    planName: plan.name,
    planExpiresAt: user.planExpiresAt || null,
    dailyLimit: plan.dailyLimit,
    dailyUsed: user.dailyUsed || 0,
    dailyRemaining: Math.max(0, plan.dailyLimit - (user.dailyUsed || 0)),
    extraCredits: user.extraCredits || 0,
    createdAt: user.createdAt
  };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const digest = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${digest}`;
}

function verifyPassword(password, stored) {
  const [salt, digest] = String(stored || "").split(":");
  if (!salt || !digest) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(digest, "hex"));
}

function token() {
  return crypto.randomBytes(32).toString("base64url");
}

function nowIso() {
  return new Date().toISOString();
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function addDays(dateIso, days) {
  const base = dateIso ? new Date(dateIso) : new Date();
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString();
}

function resetDailyIfNeeded(user) {
  const today = todayKey();
  if (user.dailyDate !== today) {
    user.dailyDate = today;
    user.dailyUsed = 0;
  }
}

function effectivePlan(user) {
  if (!user.planId || user.planId === "free") return PLANS.free;
  if (user.planExpiresAt && new Date(user.planExpiresAt).getTime() > Date.now()) {
    return PLANS[user.planId] || PLANS.free;
  }
  user.planId = "free";
  user.planExpiresAt = null;
  return PLANS.free;
}

function findUserByEmail(db, email) {
  const normalized = normalizeEmail(email);
  return Object.values(db.users).find((user) => user.email === normalized);
}

function requireAuth(req, res, db) {
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = db.sessions[bearer];
  if (!bearer || !session || new Date(session.expiresAt).getTime() < Date.now()) {
    if (bearer && session) delete db.sessions[bearer];
    json(res, 401, { error: "请先登录" });
    return null;
  }
  const user = db.users[session.userId];
  if (!user) {
    json(res, 401, { error: "账号不存在" });
    return null;
  }
  resetDailyIfNeeded(user);
  effectivePlan(user);
  return { user, token: bearer };
}

function requireAdmin(req, res, body) {
  const expected = process.env.ADMIN_SECRET || "change-this-admin-secret";
  const provided = req.headers["x-admin-secret"] || body.adminSecret || body.secret;
  if (!provided || provided !== expected) {
    json(res, 403, { error: "后台密钥不正确" });
    return false;
  }
  return true;
}

function cleanupExpiredSessions(db) {
  const now = Date.now();
  let changed = false;
  for (const [sessionToken, session] of Object.entries(db.sessions || {})) {
    if (!session?.expiresAt || new Date(session.expiresAt).getTime() < now) {
      delete db.sessions[sessionToken];
      changed = true;
    }
  }
  return changed;
}

function applyPlanOrCredits(user, planId) {
  const plan = PLANS[planId];
  if (!plan) throw new Error("Unknown plan");
  if (plan.extraCredits) {
    user.extraCredits = (user.extraCredits || 0) + plan.extraCredits;
    return;
  }
  if (plan.id === "free") {
    user.planId = "free";
    user.planExpiresAt = null;
    return;
  }
  const currentExpiry = user.planExpiresAt && new Date(user.planExpiresAt).getTime() > Date.now()
    ? user.planExpiresAt
    : nowIso();
  user.planId = plan.id;
  user.planExpiresAt = addDays(currentExpiry, plan.durationDays);
}

function spendQuota(user, units) {
  resetDailyIfNeeded(user);
  const plan = effectivePlan(user);
  const used = user.dailyUsed || 0;
  const remaining = Math.max(0, plan.dailyLimit - used);

  if (remaining >= units) {
    user.dailyUsed = used + units;
    return { charged: "daily", units };
  }

  const overflow = units - remaining;
  if ((user.extraCredits || 0) >= overflow) {
    user.dailyUsed = used + remaining;
    user.extraCredits = (user.extraCredits || 0) - overflow;
    return { charged: remaining > 0 ? "daily+extra" : "extra", units };
  }

  throw new Error(`额度不足：本次需要 ${units} 次，今日剩余 ${remaining} 次，额外次数 ${user.extraCredits || 0} 次`);
}

function assertQuotaAvailable(user, units) {
  resetDailyIfNeeded(user);
  const plan = effectivePlan(user);
  const used = user.dailyUsed || 0;
  const remaining = Math.max(0, plan.dailyLimit - used);
  if (remaining + (user.extraCredits || 0) < units) {
    throw new Error(`额度不足：本次需要 ${units} 次，今日剩余 ${remaining} 次，额外次数 ${user.extraCredits || 0} 次`);
  }
}

function openAIStatus() {
  const configured = Boolean(process.env.OPENAI_API_KEY);
  return {
    configured,
    mode: configured ? "openai" : "demo",
    model: configured ? DEFAULT_MODEL : "demo",
    message: configured
      ? "OpenAI API 已配置，生成会调用真实模型。"
      : "当前是演示模式。在服务器 .env 配置 OPENAI_API_KEY 后重启即可调用真实模型。"
  };
}

function productionChecks() {
  const defaultProvider = defaultPaymentProvider();
  const stripeWebhookReady = Boolean(process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET);
  const paymentWebhookReady = defaultProvider === "wechat"
    ? wechatPayReady().webhook
    : defaultProvider === "stripe"
      ? stripeWebhookReady
      : !IS_PRODUCTION;
  const checks = [
    {
      id: "openai",
      label: "OpenAI API",
      ok: Boolean(process.env.OPENAI_API_KEY),
      detail: process.env.OPENAI_API_KEY ? `已配置 ${DEFAULT_MODEL}` : "缺少 OPENAI_API_KEY，当前只能演示输出。"
    },
    {
      id: "public_url",
      label: "后台 API 域名",
      ok: /^https:\/\//.test(PUBLIC_BASE_URL) || !IS_PRODUCTION,
      detail: PUBLIC_BASE_URL
    },
    {
      id: "domain",
      label: "前端网站域名",
      ok: !IS_PRODUCTION || new URL(FRONTEND_BASE_URL).hostname === "ericeva0130.ccwu.cc",
      detail: FRONTEND_BASE_URL
    },
    {
      id: "api_domain",
      label: "后台服务域名",
      ok: !IS_PRODUCTION || new URL(PUBLIC_BASE_URL).hostname === "qinghaxinyu.ccwu.cc",
      detail: PUBLIC_BASE_URL
    },
    {
      id: "cors",
      label: "API 跨域",
      ok: !IS_PRODUCTION || ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(new URL(FRONTEND_BASE_URL).origin),
      detail: ALLOWED_ORIGINS.join(", ") || "未配置"
    },
    {
      id: "payment",
      label: "真实支付",
      ok: !IS_PRODUCTION || paymentProviders().some((provider) => ["wechat", "stripe"].includes(provider.id)),
      detail: paymentProviders().length
        ? paymentProviders().map((provider) => provider.name).join(" / ")
        : "生产环境必须配置微信支付或 Stripe。"
    },
    {
      id: "webhook",
      label: "支付回调",
      ok: !IS_PRODUCTION || paymentWebhookReady,
      detail: wechatPayReady().webhook
        ? "微信支付回调验签和解密已配置"
        : stripeWebhookReady && defaultProvider === "stripe"
          ? "Stripe Webhook 已配置"
          : "缺少微信支付 APIv3 密钥/公钥或 Stripe Webhook 密钥。"
    },
    {
      id: "admin_secret",
      label: "后台密钥",
      ok: Boolean(process.env.ADMIN_SECRET) && process.env.ADMIN_SECRET !== "change-this-admin-secret",
      detail: process.env.ADMIN_SECRET && process.env.ADMIN_SECRET !== "change-this-admin-secret"
        ? "已配置"
        : "请把 ADMIN_SECRET 换成一串很长的随机密钥。"
    },
    {
      id: "data",
      label: "数据存储",
      ok: fs.existsSync(DATA_DIR),
      detail: DB_FILE
    }
  ];
  return {
    ok: checks.every((check) => check.ok),
    checks
  };
}

function centsToYuan(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}

function adminOverview(db) {
  const users = Object.values(db.users || {});
  const orders = Object.values(db.orders || {});
  const generations = db.generations || [];
  const paidOrders = orders.filter((order) => order.status === "paid");
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const now = Date.now();
  const activeUsers = users.filter((user) =>
    user.planExpiresAt && new Date(user.planExpiresAt).getTime() > now
  );
  const today = todayKey();
  const todayGenerations = generations.filter((item) => {
    if (!item.createdAt) return false;
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(item.createdAt)) === today;
  });

  return {
    endpoints: {
      frontendBaseUrl: FRONTEND_BASE_URL,
      apiBaseUrl: PUBLIC_BASE_URL,
      paymentWebhookUrl: `${PUBLIC_BASE_URL}/api/payments/wechat/notify`,
      wechatWebhookUrl: `${PUBLIC_BASE_URL}/api/payments/wechat/notify`,
      stripeWebhookUrl: `${PUBLIC_BASE_URL}/api/payments/webhook`
    },
    stats: {
      users: users.length,
      activeUsers: activeUsers.length,
      orders: orders.length,
      pendingOrders: pendingOrders.length,
      paidOrders: paidOrders.length,
      revenueCents: paidOrders.reduce((sum, order) => sum + Number(order.amountCents || 0), 0),
      revenueYuan: centsToYuan(paidOrders.reduce((sum, order) => sum + Number(order.amountCents || 0), 0)),
      generations: generations.length,
      todayGenerations: todayGenerations.length
    },
    checks: productionChecks(),
    users: users
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 20)
      .map(publicUser),
    orders: orders
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 20)
      .map((order) => ({
        ...order,
        userEmail: db.users[order.userId]?.email || "未知用户"
      })),
    generations: generations
      .slice(-20)
      .reverse()
      .map((item) => ({
        id: item.id,
        userEmail: db.users[item.userId]?.email || "未知用户",
        toolTitle: item.toolTitle,
        model: item.model,
        demo: item.demo,
        createdAt: item.createdAt
      }))
  };
}

function paymentProviders() {
  const providers = [];
  if (!IS_PRODUCTION) {
    providers.push({
      id: "mock",
      name: "模拟支付",
      description: "本地测试使用，生产环境禁用。"
    });
  }
  if (wechatPayReady().orders) {
    providers.push({
      id: "wechat",
      name: "微信支付",
      description: "微信 Native 扫码支付，用户付款后自动开通套餐。"
    });
  }
  if (process.env.STRIPE_SECRET_KEY) {
    providers.push({
      id: "stripe",
      name: "Stripe",
      description: "真实在线支付，成功后自动到账。"
    });
  }
  if (process.env.ALLOW_MANUAL_PAYMENT === "true") {
    providers.push({
      id: "manual",
      name: "人工收款",
      description: "提交订单后由管理员线下确认到账。"
    });
  }
  return providers;
}

function defaultPaymentProvider() {
  const configured = process.env.PAYMENT_PROVIDER || (IS_PRODUCTION ? "wechat" : "mock");
  const enabled = paymentProviders();
  if (enabled.some((provider) => provider.id === configured)) return configured;
  return enabled[0]?.id || "";
}

function assertPaymentProvider(provider) {
  if (provider === "mock" && IS_PRODUCTION) {
    throw new Error("生产环境已禁用模拟支付，请配置真实支付方式");
  }
  if (!paymentProviders().some((item) => item.id === provider)) {
    throw new Error("支付方式未配置，请检查服务器环境变量");
  }
}

function wechatPayConfig() {
  return {
    appId: process.env.WECHAT_PAY_APP_ID || process.env.WECHAT_PAY_APPID || "",
    mchId: process.env.WECHAT_PAY_MCH_ID || process.env.WECHAT_PAY_MCHID || "",
    serialNo: process.env.WECHAT_PAY_MCH_SERIAL_NO || process.env.WECHAT_PAY_SERIAL_NO || "",
    privateKey: pemFromEnv("WECHAT_PAY_PRIVATE_KEY") || pemFromEnv("WECHAT_PAY_PRIVATE_KEY_BASE64", true),
    apiV3Key: process.env.WECHAT_PAY_API_V3_KEY || "",
    publicKey: pemFromEnv("WECHAT_PAY_PUBLIC_KEY_PEM") || pemFromEnv("WECHAT_PAY_PUBLIC_KEY_BASE64", true) || publicKeyFromCertificate(pemFromEnv("WECHAT_PAY_PLATFORM_CERT_PEM") || pemFromEnv("WECHAT_PAY_PLATFORM_CERT_BASE64", true)),
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || `${PUBLIC_BASE_URL}/api/payments/wechat/notify`
  };
}

function wechatPayReady() {
  const config = wechatPayConfig();
  return {
    orders: Boolean(config.appId && config.mchId && config.serialNo && config.privateKey && config.apiV3Key),
    webhook: Boolean(config.apiV3Key && config.publicKey)
  };
}

function pemFromEnv(name, base64 = false) {
  const value = process.env[name];
  if (!value) return "";
  const decoded = base64 ? Buffer.from(value, "base64").toString("utf8") : value;
  return decoded.replace(/\\n/g, "\n").trim();
}

function publicKeyFromCertificate(certPem) {
  if (!certPem) return "";
  try {
    const publicKey = crypto.createPublicKey(certPem);
    return publicKey.export({ type: "spki", format: "pem" });
  } catch {
    return "";
  }
}

function isWechatPayNotification(headers, body) {
  return Boolean(headers["wechatpay-signature"] || headers["wechatpay-timestamp"] || body?.resource?.ciphertext);
}

function verifyStripeWebhookSignature(rawBody, signature, secret, toleranceSeconds = 300) {
  if (!signature || !secret) return false;
  const parts = signature.split(",").reduce((acc, item) => {
    const [key, value] = item.split("=");
    if (!key || !value) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(value);
    return acc;
  }, {});
  const timestamp = Number(parts.t?.[0]);
  const signatures = parts.v1 || [];
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");

  return signatures.some((candidate) => {
    const a = Buffer.from(candidate, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

function checkRate(req, res) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
  const key = `${ip}:${new URL(req.url, PUBLIC_BASE_URL).pathname}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + 60_000 };
  if (bucket.resetAt < now) {
    bucket.count = 0;
    bucket.resetAt = now + 60_000;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (bucket.count > 80) {
    json(res, 429, { error: "请求太频繁，请稍后再试" });
    return false;
  }
  return true;
}

function validateToolInput(toolId, fields) {
  const tool = TOOL_CONFIG[toolId];
  if (!tool) throw new Error("未知工具");
  const cleaned = {};
  for (const [key, value] of Object.entries(fields || {})) {
    const stringValue = String(value || "").trim();
    if (stringValue.length > 6000) {
      throw new Error("单个输入太长，请压缩材料后再试");
    }
    cleaned[key] = stringValue;
  }
  const joined = Object.values(cleaned).join("\n");
  if (!joined || joined.length < 4) throw new Error("请先填写表单内容");
  const risky = /(替我考试|代考|隐瞒使用AI|绕过检测|直接交作业|作弊)/i.test(joined);
  if (risky) {
    throw new Error("这个请求看起来像代写或作弊。你可以改成讲解、批改、训练或提纲生成。");
  }
  return cleaned;
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function demoResponse(toolId, fields) {
  const title = TOOL_CONFIG[toolId]?.title || "AI 工具";
  const subject = fields.topic || fields.question || fields.committee || "你的输入";
  return `【演示输出】${title}

核心判断：
围绕「${subject}」先把任务拆成背景、立场、论据和表达四层。第一版不要追求华丽，先保证逻辑清楚、材料对应、行动方案具体。

建议结构：
1. 开头点明问题和你的基本立场。
2. 中段用 2-3 个分论点展开，每个分论点都要有材料或事实支撑。
3. 结尾给出可执行方案，避免只说“加强合作”“提高意识”这类空话。

可直接改写的句式：
基于上述材料，可以看出问题的关键不在于单一事件本身，而在于其背后的制度安排、利益分配和执行能力。因此，较稳妥的回答应同时覆盖原因分析、主体责任和具体措施。

下一步：
配置 OPENAI_API_KEY 后，这里会调用真实模型生成更完整的版本。`;
}

async function callOpenAI(toolId, fields) {
  const apiKey = process.env.OPENAI_API_KEY;
  const tool = TOOL_CONFIG[toolId];
  if (!apiKey) {
    return { text: demoResponse(toolId, fields), demo: true, model: "demo" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        instructions: tool.instructions,
        input: tool.buildPrompt(fields)
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error?.message || `OpenAI API 请求失败：${response.status}`;
      throw new Error(message);
    }
    const textOutput = extractOutputText(data);
    if (!textOutput) throw new Error("模型没有返回文本内容");
    return { text: textOutput, demo: false, model: DEFAULT_MODEL, responseId: data.id };
  } finally {
    clearTimeout(timer);
  }
}

async function createStripeCheckout(order, plan, user) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("未配置 STRIPE_SECRET_KEY，无法创建 Stripe 支付会话");
  }
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", order.id);
  params.set("customer_email", user.email);
  params.set("success_url", `${FRONTEND_BASE_URL}/#payment_success=${order.id}`);
  params.set("cancel_url", `${FRONTEND_BASE_URL}/#pricing`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "cny");
  params.set("line_items[0][price_data][unit_amount]", String(plan.priceCents));
  params.set("line_items[0][price_data][product_data][name]", plan.name);
  params.set("metadata[order_id]", order.id);
  params.set("metadata[user_id]", user.id);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || "Stripe 会话创建失败");
  }
  return data.url;
}

async function createWeChatNativeOrder(order, plan) {
  const config = wechatPayConfig();
  if (!wechatPayReady().orders) {
    throw new Error("未完整配置微信支付，需填写 WECHAT_PAY_APP_ID、WECHAT_PAY_MCH_ID、WECHAT_PAY_MCH_SERIAL_NO、WECHAT_PAY_PRIVATE_KEY、WECHAT_PAY_API_V3_KEY");
  }

  const requestPath = "/v3/pay/transactions/native";
  const payload = {
    appid: config.appId,
    mchid: config.mchId,
    description: `MUN Copilot ${plan.name}`.slice(0, 127),
    out_trade_no: order.id,
    attach: order.id,
    notify_url: config.notifyUrl,
    amount: {
      total: plan.priceCents,
      currency: "CNY"
    }
  };
  const bodyText = JSON.stringify(payload);
  const authorization = createWeChatPayAuthorization("POST", requestPath, bodyText, config);
  const response = await fetch(`https://api.mch.weixin.qq.com${requestPath}`, {
    method: "POST",
    headers: {
      authorization,
      accept: "application/json",
      "content-type": "application/json"
    },
    body: bodyText
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.code || "微信支付下单失败");
  }
  if (!data.code_url) throw new Error("微信支付没有返回二维码链接");
  order.providerPayload = {
    codeUrl: data.code_url,
    notifyUrl: config.notifyUrl,
    createdAt: nowIso()
  };
  return {
    checkoutUrl: `${FRONTEND_BASE_URL}/#checkout=${order.id}`,
    payment: {
      type: "wechat_native",
      codeUrl: data.code_url,
      notifyUrl: config.notifyUrl
    }
  };
}

function createWeChatPayAuthorization(method, requestPath, bodyText, config) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString("hex");
  const message = `${method}\n${requestPath}\n${timestamp}\n${nonce}\n${bodyText}\n`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(message, "utf8"), config.privateKey).toString("base64");
  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`;
}

function verifyWeChatPaySignature(rawBody, headers) {
  const config = wechatPayConfig();
  if (!config.publicKey) return false;
  const timestamp = headers["wechatpay-timestamp"];
  const nonce = headers["wechatpay-nonce"];
  const signature = headers["wechatpay-signature"];
  if (!timestamp || !nonce || !signature) return false;
  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
  return crypto.verify("RSA-SHA256", Buffer.from(message, "utf8"), config.publicKey, Buffer.from(signature, "base64"));
}

function decryptWeChatPayResource(resource) {
  const config = wechatPayConfig();
  if (!config.apiV3Key) throw new Error("缺少 WECHAT_PAY_API_V3_KEY，无法解密微信支付通知");
  if (resource?.algorithm !== "AEAD_AES_256_GCM") throw new Error("不支持的微信支付通知加密算法");
  const encrypted = Buffer.from(resource.ciphertext || "", "base64");
  if (encrypted.length <= 16) throw new Error("微信支付通知密文无效");
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const authTag = encrypted.subarray(encrypted.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(config.apiV3Key, "utf8"), Buffer.from(resource.nonce || "", "utf8"));
  decipher.setAAD(Buffer.from(resource.associated_data || "", "utf8"));
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return JSON.parse(decrypted);
}

function handleWeChatPayNotification(db, body, rawBody, headers) {
  if (IS_PRODUCTION && !verifyWeChatPaySignature(rawBody, headers)) {
    throw new Error("微信支付通知签名验证失败，请配置 WECHAT_PAY_PUBLIC_KEY_PEM 或 WECHAT_PAY_PLATFORM_CERT_PEM");
  }
  const transaction = decryptWeChatPayResource(body.resource || {});
  const orderId = transaction.out_trade_no || transaction.attach;
  const order = db.orders[orderId];
  if (!order) throw new Error("订单不存在");
  if (order.provider !== "wechat") throw new Error("订单支付方式不匹配");
  if (transaction.mchid && transaction.mchid !== wechatPayConfig().mchId) throw new Error("微信支付商户号不匹配");
  if (Number(transaction.amount?.total) !== Number(order.amountCents)) throw new Error("微信支付金额不匹配");
  order.providerEvent = body.event_type || transaction.trade_state || "wechatpay_notify";
  order.transactionId = transaction.transaction_id || order.transactionId;
  order.wechatTradeState = transaction.trade_state || "";
  if (transaction.trade_state === "SUCCESS" && order.status !== "paid") {
    const user = db.users[order.userId];
    order.status = "paid";
    order.paidAt = nowIso();
    applyPlanOrCredits(user, order.planId);
  }
  return order;
}

function listPlans() {
  return Object.values(PLANS).map((plan) => ({
    id: plan.id,
    name: plan.name,
    priceCents: plan.priceCents,
    dailyLimit: plan.dailyLimit,
    durationDays: plan.durationDays,
    extraCredits: plan.extraCredits || 0,
    badge: plan.badge,
    description: plan.description
  }));
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8",
    ".ico": "image/x-icon"
  }[ext] || "application/octet-stream";
}

async function handleApi(req, res, pathname) {
  if (!checkRate(req, res)) return;
  const db = readDb();
  const sessionsCleaned = cleanupExpiredSessions(db);
  const method = req.method;
  let body = {};
  if (method !== "GET") {
    try {
      body = await parseBody(req);
    } catch (error) {
      json(res, 400, { error: error.message });
      return;
    }
  }

  try {
    if (method === "GET" && pathname === "/api/health") {
      if (sessionsCleaned) writeDb(db);
      json(res, 200, {
        ok: true,
        time: nowIso(),
        mode: IS_PRODUCTION ? "production" : "development",
        openai: openAIStatus(),
        readiness: productionChecks()
      });
      return;
    }

    if (method === "GET" && pathname === "/api/openai/status") {
      json(res, 200, openAIStatus());
      return;
    }

    if (method === "GET" && pathname === "/api/plans") {
      json(res, 200, {
        plans: listPlans(),
        provider: defaultPaymentProvider(),
        providers: paymentProviders(),
        production: IS_PRODUCTION
      });
      return;
    }

    if (method === "POST" && pathname === "/api/auth/register") {
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      const name = String(body.name || "新用户").trim().slice(0, 40) || "新用户";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("邮箱格式不正确");
      if (password.length < 6) throw new Error("密码至少 6 位");
      if (findUserByEmail(db, email)) throw new Error("这个邮箱已经注册");
      const user = {
        id: crypto.randomUUID(),
        email,
        name,
        passwordHash: hashPassword(password),
        planId: "free",
        planExpiresAt: null,
        dailyDate: todayKey(),
        dailyUsed: 0,
        extraCredits: 0,
        createdAt: nowIso()
      };
      db.users[user.id] = user;
      const sessionToken = token();
      db.sessions[sessionToken] = {
        userId: user.id,
        createdAt: nowIso(),
        expiresAt: addDays(nowIso(), 30)
      };
      writeDb(db);
      json(res, 201, { token: sessionToken, user: publicUser(user) });
      return;
    }

    if (method === "POST" && pathname === "/api/auth/login") {
      const user = findUserByEmail(db, body.email);
      if (!user || !verifyPassword(body.password, user.passwordHash)) {
        json(res, 401, { error: "邮箱或密码不正确" });
        return;
      }
      const sessionToken = token();
      db.sessions[sessionToken] = {
        userId: user.id,
        createdAt: nowIso(),
        expiresAt: addDays(nowIso(), 30)
      };
      writeDb(db);
      json(res, 200, { token: sessionToken, user: publicUser(user) });
      return;
    }

    if (method === "POST" && pathname === "/api/auth/logout") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      delete db.sessions[auth.token];
      writeDb(db);
      json(res, 200, { ok: true });
      return;
    }

    if (method === "GET" && pathname === "/api/me") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      writeDb(db);
      json(res, 200, { user: publicUser(auth.user) });
      return;
    }

    if (method === "POST" && pathname === "/api/orders") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const plan = PLANS[body.planId];
      if (!plan || plan.id === "free") throw new Error("请选择可购买的套餐");
      const provider = body.provider || defaultPaymentProvider();
      assertPaymentProvider(provider);
      const order = {
        id: `ord_${crypto.randomBytes(8).toString("hex")}`,
        userId: auth.user.id,
        planId: plan.id,
        provider,
        amountCents: plan.priceCents,
        currency: "CNY",
        status: "pending",
        createdAt: nowIso(),
        paidAt: null
      };
      db.orders[order.id] = order;

      let checkoutUrl = `${FRONTEND_BASE_URL}/#checkout=${order.id}`;
      let paymentNote = provider === "mock"
        ? "本地模拟支付，可在结算面板点击确认。"
        : "订单已创建。";
      if (provider === "stripe") {
        checkoutUrl = await createStripeCheckout(order, plan, auth.user);
        paymentNote = "已创建 Stripe Checkout Session。";
      } else if (provider === "wechat") {
        const wechatCheckout = await createWeChatNativeOrder(order, plan);
        checkoutUrl = wechatCheckout.checkoutUrl;
        order.payment = wechatCheckout.payment;
        paymentNote = "微信支付二维码已生成，请用微信扫码付款。";
      } else if (provider === "manual") {
        paymentNote = "人工收款订单已创建。管理员确认收款后会加额度。";
      }

      writeDb(db);
      json(res, 201, { order, checkoutUrl, paymentNote });
      return;
    }

    if (method === "GET" && pathname === "/api/orders") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const orders = Object.values(db.orders)
        .filter((order) => order.userId === auth.user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      json(res, 200, { orders });
      return;
    }

    if (method === "POST" && pathname === "/api/payments/mock/confirm") {
      if (IS_PRODUCTION) throw new Error("生产环境已禁用模拟支付");
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const order = db.orders[body.orderId];
      if (!order || order.userId !== auth.user.id) throw new Error("订单不存在");
      if (order.status !== "paid") {
        order.status = "paid";
        order.paidAt = nowIso();
        applyPlanOrCredits(auth.user, order.planId);
      }
      writeDb(db);
      json(res, 200, { order, user: publicUser(auth.user) });
      return;
    }

    if (method === "POST" && (pathname === "/api/payments/webhook" || pathname === "/api/payments/wechat/notify")) {
      if (isWechatPayNotification(req.headers, body)) {
        handleWeChatPayNotification(db, body, req.rawBody || "", req.headers);
        writeDb(db);
        json(res, 200, { code: "SUCCESS", message: "成功" });
        return;
      }
      const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;
      const stripeSignature = req.headers["stripe-signature"];
      if (stripeSignature || IS_PRODUCTION) {
        if (!verifyStripeWebhookSignature(req.rawBody || "", stripeSignature, stripeSecret)) {
          json(res, 401, { error: "Stripe webhook signature mismatch" });
          return;
        }
      } else {
        const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET;
        if (expectedSecret && req.headers["x-webhook-secret"] !== expectedSecret) {
          json(res, 401, { error: "Webhook secret mismatch" });
          return;
        }
      }
      const stripeOrderId = body.type === "checkout.session.completed"
        ? body.data?.object?.client_reference_id
        : null;
      const orderId = body.orderId || stripeOrderId;
      const order = db.orders[orderId];
      if (!order) throw new Error("订单不存在");
      if (order.status !== "paid") {
        const user = db.users[order.userId];
        order.status = "paid";
        order.paidAt = nowIso();
        order.providerEvent = body.type || body.event || "manual_webhook";
        applyPlanOrCredits(user, order.planId);
      }
      writeDb(db);
      json(res, 200, { ok: true });
      return;
    }

    if (method === "POST" && pathname === "/api/generate") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const toolId = String(body.toolId || "");
      const tool = TOOL_CONFIG[toolId];
      if (!tool) throw new Error("未知工具");
      const fields = validateToolInput(toolId, body.fields || {});
      assertQuotaAvailable(auth.user, tool.cost);
      const ai = await callOpenAI(toolId, fields);
      const quota = spendQuota(auth.user, tool.cost);
      const record = {
        id: `gen_${crypto.randomBytes(8).toString("hex")}`,
        userId: auth.user.id,
        toolId,
        toolTitle: tool.title,
        cost: tool.cost,
        charged: quota.charged,
        model: ai.model,
        demo: ai.demo,
        fields,
        output: ai.text,
        createdAt: nowIso()
      };
      db.generations.push(record);
      if (db.generations.length > 1000) db.generations = db.generations.slice(-1000);
      writeDb(db);
      json(res, 200, { result: record, user: publicUser(auth.user) });
      return;
    }

    if (method === "GET" && pathname === "/api/history") {
      const auth = requireAuth(req, res, db);
      if (!auth) return;
      const history = db.generations
        .filter((item) => item.userId === auth.user.id)
        .slice(-20)
        .reverse()
        .map((item) => ({
          id: item.id,
          toolId: item.toolId,
          toolTitle: item.toolTitle,
          output: item.output,
          demo: item.demo,
          createdAt: item.createdAt
        }));
      json(res, 200, { history });
      return;
    }

    if (method === "POST" && pathname === "/api/admin/grant") {
      if (!requireAdmin(req, res, body)) return;
      const user = findUserByEmail(db, body.email);
      if (!user) throw new Error("找不到这个用户");
      const credits = Number(body.credits || 0);
      if (credits > 0) user.extraCredits = (user.extraCredits || 0) + credits;
      if (body.planId && PLANS[body.planId]) {
        applyPlanOrCredits(user, body.planId);
      }
      writeDb(db);
      json(res, 200, { user: publicUser(user) });
      return;
    }

    if ((method === "GET" || method === "POST") && pathname === "/api/admin/overview") {
      const url = new URL(req.url, PUBLIC_BASE_URL);
      if (!requireAdmin(req, res, { adminSecret: body.adminSecret || url.searchParams.get("secret") })) return;
      if (sessionsCleaned) writeDb(db);
      json(res, 200, adminOverview(db));
      return;
    }

    if (method === "POST" && pathname === "/api/admin/orders/confirm") {
      if (!requireAdmin(req, res, body)) return;
      const order = db.orders[body.orderId];
      if (!order) throw new Error("订单不存在");
      const user = db.users[order.userId];
      if (!user) throw new Error("订单用户不存在");
      if (order.status !== "paid") {
        order.status = "paid";
        order.paidAt = nowIso();
        order.providerEvent = "admin_confirmed";
        applyPlanOrCredits(user, order.planId);
      }
      writeDb(db);
      json(res, 200, { order, user: publicUser(user), overview: adminOverview(db) });
      return;
    }

    if (method === "GET" && pathname === "/api/admin/users") {
      const url = new URL(req.url, PUBLIC_BASE_URL);
      if (!requireAdmin(req, res, { adminSecret: url.searchParams.get("secret") })) return;
      const users = Object.values(db.users).map(publicUser);
      json(res, 200, { users });
      return;
    }

    json(res, 404, { error: "接口不存在" });
  } catch (error) {
    json(res, 400, { error: error.message || "请求失败" });
  }
}

function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    text(res, 403, "Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      text(res, 404, "Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": contentTypeFor(filePath),
      "cache-control": /\.(html|css|js)$/.test(filePath) ? "no-store" : "public, max-age=3600",
      ...securityHeaders()
    });
    res.end(data);
  });
}

ensureDb();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, PUBLIC_BASE_URL);
  if (url.pathname.startsWith("/api/")) {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204, securityHeaders());
      res.end();
      return;
    }
    handleApi(req, res, url.pathname);
    return;
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`MUN / Humanities Copilot running at http://${HOST}:${PORT}`);
  console.log(`Mode: ${IS_PRODUCTION ? "production" : "development"}`);
  console.log(`Frontend URL: ${FRONTEND_BASE_URL}`);
  console.log(`API base URL: ${PUBLIC_BASE_URL}`);
  if (IS_PRODUCTION && !process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY is missing. The site will stay in demo mode.");
  }
  if (IS_PRODUCTION && !paymentProviders().length) {
    console.warn("Warning: no production payment provider is configured. Set WeChat Pay credentials or Stripe credentials.");
  }
});
