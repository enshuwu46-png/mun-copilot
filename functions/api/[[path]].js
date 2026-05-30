const DEFAULT_FRONTEND_BASE_URL = "https://ericeva0130.ccwu.cc";
const DEFAULT_API_BASE_URL = "https://qinghaxinyu.ccwu.cc";
const DB_KEY = "mun-copilot-db";

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

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(request, env) });

  try {
    return await handleApi(request, env);
  } catch (error) {
    const status = error.status || 400;
    return json(request, env, status, { error: error.message || "请求失败" });
  }
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;
  const db = await readDb(env);
  const sessionsCleaned = cleanupExpiredSessions(db);
  const { body, rawBody } = await readBody(request);

  if (method === "GET" && pathname === "/api/health") {
    if (sessionsCleaned) await writeDb(env, db);
    return json(request, env, 200, {
      ok: true,
      time: nowIso(),
      mode: isProduction(env) ? "production" : "development",
      runtime: "cloudflare-pages-functions",
      openai: openAIStatus(env),
      readiness: productionChecks(env)
    });
  }

  if (method === "GET" && pathname === "/api/openai/status") {
    return json(request, env, 200, openAIStatus(env));
  }

  if (method === "GET" && pathname === "/api/plans") {
    return json(request, env, 200, {
      plans: listPlans(),
      provider: defaultPaymentProvider(env),
      providers: paymentProviders(env),
      production: isProduction(env)
    });
  }

  if (method === "POST" && pathname === "/api/auth/register") {
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const name = String(body.name || "新用户").trim().slice(0, 40) || "新用户";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "邮箱格式不正确");
    if (password.length < 6) throw new HttpError(400, "密码至少 6 位");
    if (findUserByEmail(db, email)) throw new HttpError(400, "这个邮箱已经注册");

    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash: await hashPassword(password),
      planId: "free",
      planExpiresAt: null,
      dailyDate: todayKey(),
      dailyUsed: 0,
      extraCredits: 0,
      createdAt: nowIso()
    };
    db.users[user.id] = user;
    const sessionToken = token();
    db.sessions[sessionToken] = { userId: user.id, createdAt: nowIso(), expiresAt: addDays(nowIso(), 30) };
    await writeDb(env, db);
    return json(request, env, 201, { token: sessionToken, user: publicUser(user) });
  }

  if (method === "POST" && pathname === "/api/auth/login") {
    const user = findUserByEmail(db, body.email);
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new HttpError(401, "邮箱或密码不正确");
    }
    const sessionToken = token();
    db.sessions[sessionToken] = { userId: user.id, createdAt: nowIso(), expiresAt: addDays(nowIso(), 30) };
    await writeDb(env, db);
    return json(request, env, 200, { token: sessionToken, user: publicUser(user) });
  }

  if (method === "POST" && pathname === "/api/auth/logout") {
    const auth = requireAuth(request, db);
    delete db.sessions[auth.token];
    await writeDb(env, db);
    return json(request, env, 200, { ok: true });
  }

  if (method === "GET" && pathname === "/api/me") {
    const auth = requireAuth(request, db);
    await writeDb(env, db);
    return json(request, env, 200, { user: publicUser(auth.user) });
  }

  if (method === "POST" && pathname === "/api/orders") {
    const auth = requireAuth(request, db);
    const plan = PLANS[body.planId];
    if (!plan || plan.id === "free") throw new HttpError(400, "请选择可购买的套餐");
    const provider = body.provider || defaultPaymentProvider(env);
    assertPaymentProvider(env, provider);
    const order = {
      id: `ord_${randomHex(8)}`,
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

    let checkoutUrl = `${frontendBaseUrl(env)}/#checkout=${order.id}`;
    let paymentNote = provider === "mock" ? "本地模拟支付，可在结算面板点击确认。" : "订单已创建。";
    if (provider === "stripe") {
      checkoutUrl = await createStripeCheckout(env, order, plan, auth.user);
      paymentNote = "已创建 Stripe Checkout Session。";
    } else if (provider === "wechat") {
      const wechatCheckout = await createWeChatNativeOrder(env, order, plan);
      checkoutUrl = wechatCheckout.checkoutUrl;
      order.payment = wechatCheckout.payment;
      paymentNote = "微信支付二维码已生成，请用微信扫码付款。";
    } else if (provider === "manual") {
      paymentNote = "人工收款订单已创建。管理员确认收款后会加额度。";
    }

    await writeDb(env, db);
    return json(request, env, 201, { order, checkoutUrl, paymentNote });
  }

  if (method === "GET" && pathname === "/api/orders") {
    const auth = requireAuth(request, db);
    const orders = Object.values(db.orders)
      .filter((order) => order.userId === auth.user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return json(request, env, 200, { orders });
  }

  if (method === "POST" && pathname === "/api/payments/mock/confirm") {
    if (isProduction(env)) throw new HttpError(400, "生产环境已禁用模拟支付");
    const auth = requireAuth(request, db);
    const order = db.orders[body.orderId];
    if (!order || order.userId !== auth.user.id) throw new HttpError(400, "订单不存在");
    if (order.status !== "paid") {
      order.status = "paid";
      order.paidAt = nowIso();
      applyPlanOrCredits(auth.user, order.planId);
    }
    await writeDb(env, db);
    return json(request, env, 200, { order, user: publicUser(auth.user) });
  }

  if (method === "POST" && (pathname === "/api/payments/webhook" || pathname === "/api/payments/wechat/notify")) {
    if (isWechatPayNotification(request.headers, body)) {
      await handleWeChatPayNotification(env, db, body, rawBody, request.headers);
      await writeDb(env, db);
      return json(request, env, 200, { code: "SUCCESS", message: "成功" });
    }
    const stripeSecret = env.STRIPE_WEBHOOK_SECRET || env.PAYMENT_WEBHOOK_SECRET;
    const stripeSignature = request.headers.get("stripe-signature");
    if (stripeSignature || isProduction(env)) {
      if (!(await verifyStripeWebhookSignature(rawBody, stripeSignature, stripeSecret))) {
        throw new HttpError(401, "Stripe webhook signature mismatch");
      }
    } else {
      const expectedSecret = env.PAYMENT_WEBHOOK_SECRET;
      if (expectedSecret && request.headers.get("x-webhook-secret") !== expectedSecret) {
        throw new HttpError(401, "Webhook secret mismatch");
      }
    }
    const stripeOrderId = body.type === "checkout.session.completed" ? body.data?.object?.client_reference_id : null;
    const orderId = body.orderId || stripeOrderId;
    const order = db.orders[orderId];
    if (!order) throw new HttpError(400, "订单不存在");
    if (order.status !== "paid") {
      const user = db.users[order.userId];
      order.status = "paid";
      order.paidAt = nowIso();
      order.providerEvent = body.type || body.event || "manual_webhook";
      applyPlanOrCredits(user, order.planId);
    }
    await writeDb(env, db);
    return json(request, env, 200, { ok: true });
  }

  if (method === "POST" && pathname === "/api/generate") {
    const auth = requireAuth(request, db);
    const toolId = String(body.toolId || "");
    const tool = TOOL_CONFIG[toolId];
    if (!tool) throw new HttpError(400, "未知工具");
    const fields = validateToolInput(toolId, body.fields || {});
    assertQuotaAvailable(auth.user, tool.cost);
    const ai = await callOpenAI(env, toolId, fields);
    const quota = spendQuota(auth.user, tool.cost);
    const record = {
      id: `gen_${randomHex(8)}`,
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
    await writeDb(env, db);
    return json(request, env, 200, { result: record, user: publicUser(auth.user) });
  }

  if (method === "GET" && pathname === "/api/history") {
    const auth = requireAuth(request, db);
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
    return json(request, env, 200, { history });
  }

  if (method === "POST" && pathname === "/api/admin/grant") {
    requireAdmin(env, body);
    const user = findUserByEmail(db, body.email);
    if (!user) throw new HttpError(400, "找不到这个用户");
    const credits = Number(body.credits || 0);
    if (credits > 0) user.extraCredits = (user.extraCredits || 0) + credits;
    if (body.planId && PLANS[body.planId]) applyPlanOrCredits(user, body.planId);
    await writeDb(env, db);
    return json(request, env, 200, { user: publicUser(user) });
  }

  if ((method === "GET" || method === "POST") && pathname === "/api/admin/overview") {
    requireAdmin(env, { adminSecret: body.adminSecret || url.searchParams.get("secret") });
    if (sessionsCleaned) await writeDb(env, db);
    return json(request, env, 200, adminOverview(env, db));
  }

  if (method === "POST" && pathname === "/api/admin/orders/confirm") {
    requireAdmin(env, body);
    const order = db.orders[body.orderId];
    if (!order) throw new HttpError(400, "订单不存在");
    const user = db.users[order.userId];
    if (!user) throw new HttpError(400, "订单用户不存在");
    if (order.status !== "paid") {
      order.status = "paid";
      order.paidAt = nowIso();
      order.providerEvent = "admin_confirmed";
      applyPlanOrCredits(user, order.planId);
    }
    await writeDb(env, db);
    return json(request, env, 200, { order, user: publicUser(user), overview: adminOverview(env, db) });
  }

  throw new HttpError(404, "接口不存在");
}

function headers(request, env, extra = {}) {
  const h = {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "same-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    ...extra
  };
  const origin = request.headers.get("origin");
  if (originAllowed(env, origin)) {
    h["access-control-allow-origin"] = origin;
    h.vary = "Origin";
    h["access-control-allow-methods"] = "GET, POST, OPTIONS";
    h["access-control-allow-headers"] = "content-type, authorization, x-admin-secret, stripe-signature, x-webhook-secret, wechatpay-signature, wechatpay-timestamp, wechatpay-nonce, wechatpay-serial, wechatpay-signature-type";
    h["access-control-max-age"] = "86400";
  }
  return h;
}

function json(request, env, status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: headers(request, env, { "content-type": "application/json; charset=utf-8" })
  });
}

async function readBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return { body: {}, rawBody: "" };
  const rawBody = await request.text();
  if (!rawBody) return { body: {}, rawBody };
  try {
    return { body: JSON.parse(rawBody), rawBody };
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

async function readDb(env) {
  const initial = { users: {}, sessions: {}, orders: {}, generations: [] };
  if (!env.MUN_DB) return initial;
  const db = await env.MUN_DB.get(DB_KEY, "json");
  return {
    users: db?.users || {},
    sessions: db?.sessions || {},
    orders: db?.orders || {},
    generations: db?.generations || []
  };
}

async function writeDb(env, db) {
  if (!env.MUN_DB) throw new HttpError(500, "缺少 Cloudflare KV 绑定 MUN_DB");
  await env.MUN_DB.put(DB_KEY, JSON.stringify(db, null, 2));
}

function isProduction(env) {
  return (env.NODE_ENV || "production") === "production";
}

function frontendBaseUrl(env) {
  return String(env.FRONTEND_BASE_URL || env.PUBLIC_SITE_URL || DEFAULT_FRONTEND_BASE_URL).replace(/\/$/, "");
}

function apiBaseUrl(env) {
  return String(env.PUBLIC_BASE_URL || env.API_PUBLIC_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || `${frontendBaseUrl(env)},${apiBaseUrl(env)}`)
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function originAllowed(env, origin) {
  if (!origin) return false;
  const origins = allowedOrigins(env);
  return origins.includes("*") || origins.includes(String(origin).replace(/\/$/, ""));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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

function effectivePlan(user) {
  if (!user) return PLANS.free;
  if (!user.planId || user.planId === "free") return PLANS.free;
  if (user.planExpiresAt && new Date(user.planExpiresAt).getTime() > Date.now()) return PLANS[user.planId] || PLANS.free;
  user.planId = "free";
  user.planExpiresAt = null;
  return PLANS.free;
}

function resetDailyIfNeeded(user) {
  const today = todayKey();
  if (user.dailyDate !== today) {
    user.dailyDate = today;
    user.dailyUsed = 0;
  }
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

function findUserByEmail(db, email) {
  const normalized = normalizeEmail(email);
  return Object.values(db.users || {}).find((user) => user.email === normalized);
}

function requireAuth(request, db) {
  const header = request.headers.get("authorization") || "";
  const tokenValue = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = db.sessions[tokenValue];
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) throw new HttpError(401, "请先登录");
  const user = db.users[session.userId];
  if (!user) throw new HttpError(401, "账号不存在");
  return { user, token: tokenValue };
}

function requireAdmin(env, body) {
  const expected = env.ADMIN_SECRET || "change-this-admin-secret";
  const provided = body.adminSecret || body.secret;
  if (!provided || provided !== expected) throw new HttpError(401, "后台密钥不正确");
}

function cleanupExpiredSessions(db) {
  let changed = false;
  const now = Date.now();
  for (const [sessionToken, session] of Object.entries(db.sessions || {})) {
    if (!session.expiresAt || new Date(session.expiresAt).getTime() < now) {
      delete db.sessions[sessionToken];
      changed = true;
    }
  }
  return changed;
}

function assertQuotaAvailable(user, cost) {
  const plan = effectivePlan(user);
  resetDailyIfNeeded(user);
  const remaining = Math.max(0, plan.dailyLimit - (user.dailyUsed || 0));
  if (remaining + (user.extraCredits || 0) < cost) throw new HttpError(402, "额度不足，请购买套餐或加油包");
}

function spendQuota(user, cost) {
  const plan = effectivePlan(user);
  resetDailyIfNeeded(user);
  const remaining = Math.max(0, plan.dailyLimit - (user.dailyUsed || 0));
  const dailySpend = Math.min(cost, remaining);
  const extraSpend = cost - dailySpend;
  user.dailyUsed = (user.dailyUsed || 0) + dailySpend;
  if (extraSpend > 0) user.extraCredits = Math.max(0, (user.extraCredits || 0) - extraSpend);
  return { charged: cost, dailySpend, extraSpend };
}

function applyPlanOrCredits(user, planId) {
  const plan = PLANS[planId];
  if (!plan) throw new HttpError(400, "未知套餐");
  if (plan.extraCredits) {
    user.extraCredits = (user.extraCredits || 0) + plan.extraCredits;
    return;
  }
  user.planId = plan.id;
  user.planExpiresAt = addDays(nowIso(), plan.durationDays);
  resetDailyIfNeeded(user);
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

function paymentProviders(env) {
  const providers = [];
  if (!isProduction(env)) providers.push({ id: "mock", name: "模拟支付", description: "本地测试使用，生产环境禁用。" });
  if (wechatPayReady(env).orders) providers.push({ id: "wechat", name: "微信支付", description: "微信 Native 扫码支付，用户付款后自动开通套餐。" });
  if (env.STRIPE_SECRET_KEY) providers.push({ id: "stripe", name: "Stripe", description: "真实在线支付，成功后自动到账。" });
  if (env.ALLOW_MANUAL_PAYMENT === "true") providers.push({ id: "manual", name: "人工收款", description: "提交订单后由管理员线下确认到账。" });
  return providers;
}

function defaultPaymentProvider(env) {
  const configured = env.PAYMENT_PROVIDER || (isProduction(env) ? "wechat" : "mock");
  const enabled = paymentProviders(env);
  if (enabled.some((provider) => provider.id === configured)) return configured;
  return enabled[0]?.id || "";
}

function assertPaymentProvider(env, provider) {
  if (provider === "mock" && isProduction(env)) throw new HttpError(400, "生产环境已禁用模拟支付，请配置真实支付方式");
  if (!paymentProviders(env).some((item) => item.id === provider)) throw new HttpError(400, "支付方式未配置，请检查服务器环境变量");
}

function wechatPayConfig(env) {
  const certificatePem = pemFromEnv(env, "WECHAT_PAY_PLATFORM_CERT_PEM") || pemFromEnv(env, "WECHAT_PAY_PLATFORM_CERT_BASE64", true);
  return {
    appId: env.WECHAT_PAY_APP_ID || env.WECHAT_PAY_APPID || "",
    mchId: env.WECHAT_PAY_MCH_ID || env.WECHAT_PAY_MCHID || "",
    serialNo: env.WECHAT_PAY_MCH_SERIAL_NO || env.WECHAT_PAY_SERIAL_NO || "",
    privateKey: pemFromEnv(env, "WECHAT_PAY_PRIVATE_KEY") || pemFromEnv(env, "WECHAT_PAY_PRIVATE_KEY_BASE64", true),
    apiV3Key: env.WECHAT_PAY_API_V3_KEY || "",
    publicKey: pemFromEnv(env, "WECHAT_PAY_PUBLIC_KEY_PEM") || pemFromEnv(env, "WECHAT_PAY_PUBLIC_KEY_BASE64", true) || publicKeyFromCertificate(certificatePem),
    notifyUrl: env.WECHAT_PAY_NOTIFY_URL || `${apiBaseUrl(env)}/api/payments/wechat/notify`
  };
}

function wechatPayReady(env) {
  const config = wechatPayConfig(env);
  return {
    orders: Boolean(config.appId && config.mchId && config.serialNo && config.privateKey && config.apiV3Key),
    webhook: Boolean(config.apiV3Key && config.publicKey)
  };
}

function pemFromEnv(env, name, base64 = false) {
  const value = env[name];
  if (!value) return "";
  const decoded = base64 ? bytesToUtf8(base64ToBytes(value)) : String(value);
  return decoded.replace(/\\n/g, "\n").trim();
}

function publicKeyFromCertificate(certPem) {
  if (!certPem) return "";
  try {
    const der = pemToBytes(certPem, "CERTIFICATE");
    const certificate = readDerElement(der, 0);
    const tbs = readDerElement(der, certificate.contentStart);
    let offset = tbs.contentStart;
    let element = readDerElement(der, offset);
    if (element.tag === 0xa0) {
      offset = element.end;
    }
    for (let i = 0; i < 5; i += 1) {
      element = readDerElement(der, offset);
      offset = element.end;
    }
    const spki = readDerElement(der, offset);
    return `-----BEGIN PUBLIC KEY-----\n${chunkBase64(bytesToBase64(der.slice(spki.start, spki.end)))}\n-----END PUBLIC KEY-----`;
  } catch {
    return "";
  }
}

function readDerElement(bytes, offset) {
  const start = offset;
  const tag = bytes[offset++];
  let length = bytes[offset++];
  if (length & 0x80) {
    const lengthBytes = length & 0x7f;
    length = 0;
    for (let i = 0; i < lengthBytes; i += 1) length = (length << 8) + bytes[offset++];
  }
  return { tag, start, contentStart: offset, contentEnd: offset + length, end: offset + length };
}

function isWechatPayNotification(headers, body) {
  return Boolean(headers.get("wechatpay-signature") || headers.get("wechatpay-timestamp") || body?.resource?.ciphertext);
}

function validateToolInput(toolId, fields) {
  const tool = TOOL_CONFIG[toolId];
  if (!tool) throw new HttpError(400, "未知工具");
  const cleaned = {};
  for (const [key, value] of Object.entries(fields || {})) {
    const stringValue = String(value || "").trim();
    if (stringValue.length > 6000) throw new HttpError(400, "单个输入太长，请压缩材料后再试");
    cleaned[key] = stringValue;
  }
  const joined = Object.values(cleaned).join("\n");
  if (!joined || joined.length < 4) throw new HttpError(400, "请先填写表单内容");
  if (/(替我考试|代考|隐瞒使用AI|绕过检测|直接交作业|作弊)/i.test(joined)) {
    throw new HttpError(400, "这个请求看起来像代写或作弊。你可以改成讲解、批改、训练或提纲生成。");
  }
  return cleaned;
}

function openAIStatus(env) {
  const configured = Boolean(env.OPENAI_API_KEY);
  const model = env.OPENAI_MODEL || "gpt-5";
  return {
    configured,
    mode: configured ? "openai" : "demo",
    model: configured ? model : "demo",
    message: configured ? "OpenAI API 已配置，生成会调用真实模型。" : "当前是演示模式。配置 OPENAI_API_KEY 后即可调用真实模型。"
  };
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

下一步：
配置 OPENAI_API_KEY 后，这里会调用真实模型生成更完整的版本。`;
}

async function callOpenAI(env, toolId, fields) {
  const apiKey = env.OPENAI_API_KEY;
  const tool = TOOL_CONFIG[toolId];
  const model = env.OPENAI_MODEL || "gpt-5";
  if (!apiKey) return { text: demoResponse(toolId, fields), demo: true, model: "demo" };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model, instructions: tool.instructions, input: tool.buildPrompt(fields) })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(502, data.error?.message || `OpenAI API 请求失败：${response.status}`);
  const textOutput = extractOutputText(data);
  if (!textOutput) throw new HttpError(502, "模型没有返回文本内容");
  return { text: textOutput, demo: false, model, responseId: data.id };
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

async function createStripeCheckout(env, order, plan, user) {
  if (!env.STRIPE_SECRET_KEY) throw new HttpError(400, "未配置 STRIPE_SECRET_KEY，无法创建 Stripe 支付会话");
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", order.id);
  params.set("customer_email", user.email);
  params.set("success_url", `${frontendBaseUrl(env)}/#payment_success=${order.id}`);
  params.set("cancel_url", `${frontendBaseUrl(env)}/#pricing`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "cny");
  params.set("line_items[0][price_data][unit_amount]", String(plan.priceCents));
  params.set("line_items[0][price_data][product_data][name]", plan.name);
  params.set("metadata[order_id]", order.id);
  params.set("metadata[user_id]", user.id);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: params
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(502, data.error?.message || "Stripe 会话创建失败");
  return data.url;
}

async function createWeChatNativeOrder(env, order, plan) {
  const config = wechatPayConfig(env);
  if (!wechatPayReady(env).orders) {
    throw new HttpError(400, "未完整配置微信支付，需填写 WECHAT_PAY_APP_ID、WECHAT_PAY_MCH_ID、WECHAT_PAY_MCH_SERIAL_NO、WECHAT_PAY_PRIVATE_KEY、WECHAT_PAY_API_V3_KEY");
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
  const authorization = await createWeChatPayAuthorization("POST", requestPath, bodyText, config);
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
  if (!response.ok) throw new HttpError(502, data.message || data.code || "微信支付下单失败");
  if (!data.code_url) throw new HttpError(502, "微信支付没有返回二维码链接");
  order.providerPayload = {
    codeUrl: data.code_url,
    notifyUrl: config.notifyUrl,
    createdAt: nowIso()
  };
  return {
    checkoutUrl: `${frontendBaseUrl(env)}/#checkout=${order.id}`,
    payment: {
      type: "wechat_native",
      codeUrl: data.code_url,
      notifyUrl: config.notifyUrl
    }
  };
}

async function createWeChatPayAuthorization(method, requestPath, bodyText, config) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomHex(16);
  const message = `${method}\n${requestPath}\n${timestamp}\n${nonce}\n${bodyText}\n`;
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(config.privateKey, "PRIVATE KEY"),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, encode(message));
  const signature = bytesToBase64(new Uint8Array(signatureBytes));
  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`;
}

async function verifyWeChatPaySignature(env, rawBody, headers) {
  const config = wechatPayConfig(env);
  if (!config.publicKey) return false;
  const timestamp = headers.get("wechatpay-timestamp");
  const nonce = headers.get("wechatpay-nonce");
  const signature = headers.get("wechatpay-signature");
  if (!timestamp || !nonce || !signature) return false;
  const publicKey = await crypto.subtle.importKey(
    "spki",
    pemToBytes(config.publicKey, "PUBLIC KEY"),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, base64ToBytes(signature), encode(`${timestamp}\n${nonce}\n${rawBody}\n`));
}

async function decryptWeChatPayResource(env, resource) {
  const config = wechatPayConfig(env);
  if (!config.apiV3Key) throw new HttpError(400, "缺少 WECHAT_PAY_API_V3_KEY，无法解密微信支付通知");
  if (resource?.algorithm !== "AEAD_AES_256_GCM") throw new HttpError(400, "不支持的微信支付通知加密算法");
  const key = await crypto.subtle.importKey("raw", encode(config.apiV3Key), "AES-GCM", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: encode(resource.nonce || ""),
      additionalData: encode(resource.associated_data || ""),
      tagLength: 128
    },
    key,
    base64ToBytes(resource.ciphertext || "")
  );
  return JSON.parse(bytesToUtf8(new Uint8Array(decrypted)));
}

async function handleWeChatPayNotification(env, db, body, rawBody, headers) {
  if (isProduction(env) && !(await verifyWeChatPaySignature(env, rawBody, headers))) {
    throw new HttpError(401, "微信支付通知签名验证失败，请配置 WECHAT_PAY_PUBLIC_KEY_PEM 或 WECHAT_PAY_PLATFORM_CERT_PEM");
  }
  const transaction = await decryptWeChatPayResource(env, body.resource || {});
  const orderId = transaction.out_trade_no || transaction.attach;
  const order = db.orders[orderId];
  if (!order) throw new HttpError(400, "订单不存在");
  if (order.provider !== "wechat") throw new HttpError(400, "订单支付方式不匹配");
  if (transaction.mchid && transaction.mchid !== wechatPayConfig(env).mchId) throw new HttpError(400, "微信支付商户号不匹配");
  if (Number(transaction.amount?.total) !== Number(order.amountCents)) throw new HttpError(400, "微信支付金额不匹配");
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

function productionChecks(env) {
  const defaultProvider = defaultPaymentProvider(env);
  const stripeWebhookReady = Boolean(env.STRIPE_WEBHOOK_SECRET || env.PAYMENT_WEBHOOK_SECRET);
  const paymentWebhookReady = defaultProvider === "wechat"
    ? wechatPayReady(env).webhook
    : defaultProvider === "stripe"
      ? stripeWebhookReady
      : !isProduction(env);
  const checks = [
    { id: "openai", label: "OpenAI API", ok: Boolean(env.OPENAI_API_KEY), detail: env.OPENAI_API_KEY ? `已配置 ${env.OPENAI_MODEL || "gpt-5"}` : "缺少 OPENAI_API_KEY，当前只能演示输出。" },
    { id: "kv", label: "Cloudflare KV", ok: Boolean(env.MUN_DB), detail: env.MUN_DB ? "已绑定 MUN_DB" : "缺少 KV 绑定 MUN_DB。" },
    { id: "public_url", label: "后台 API 域名", ok: /^https:\/\//.test(apiBaseUrl(env)) || !isProduction(env), detail: apiBaseUrl(env) },
    { id: "domain", label: "前端网站域名", ok: !isProduction(env) || new URL(frontendBaseUrl(env)).hostname === "ericeva0130.ccwu.cc", detail: frontendBaseUrl(env) },
    { id: "api_domain", label: "后台服务域名", ok: !isProduction(env) || new URL(apiBaseUrl(env)).hostname === "qinghaxinyu.ccwu.cc", detail: apiBaseUrl(env) },
    { id: "cors", label: "API 跨域", ok: !isProduction(env) || allowedOrigins(env).includes("*") || allowedOrigins(env).includes(new URL(frontendBaseUrl(env)).origin), detail: allowedOrigins(env).join(", ") || "未配置" },
    { id: "payment", label: "真实支付", ok: !isProduction(env) || paymentProviders(env).some((provider) => ["wechat", "stripe"].includes(provider.id)), detail: paymentProviders(env).length ? paymentProviders(env).map((provider) => provider.name).join(" / ") : "生产环境必须配置微信支付或 Stripe。" },
    { id: "webhook", label: "支付回调", ok: !isProduction(env) || paymentWebhookReady, detail: wechatPayReady(env).webhook ? "微信支付回调验签和解密已配置" : stripeWebhookReady && defaultProvider === "stripe" ? "Stripe Webhook 已配置" : "缺少微信支付 APIv3 密钥/公钥或 Stripe Webhook 密钥。" },
    { id: "admin_secret", label: "后台密钥", ok: Boolean(env.ADMIN_SECRET) && env.ADMIN_SECRET !== "change-this-admin-secret", detail: env.ADMIN_SECRET && env.ADMIN_SECRET !== "change-this-admin-secret" ? "已配置" : "请把 ADMIN_SECRET 换成一串很长的随机密钥。" }
  ];
  return { ok: checks.every((check) => check.ok), checks };
}

function adminOverview(env, db) {
  const users = Object.values(db.users || {});
  const orders = Object.values(db.orders || {});
  const generations = db.generations || [];
  const paidOrders = orders.filter((order) => order.status === "paid");
  const now = Date.now();
  const activeUsers = users.filter((user) => user.planExpiresAt && new Date(user.planExpiresAt).getTime() > now);
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
      frontendBaseUrl: frontendBaseUrl(env),
      apiBaseUrl: apiBaseUrl(env),
      paymentWebhookUrl: `${apiBaseUrl(env)}/api/payments/wechat/notify`,
      wechatWebhookUrl: `${apiBaseUrl(env)}/api/payments/wechat/notify`,
      stripeWebhookUrl: `${apiBaseUrl(env)}/api/payments/webhook`
    },
    stats: {
      users: users.length,
      activeUsers: activeUsers.length,
      orders: orders.length,
      pendingOrders: orders.filter((order) => order.status === "pending").length,
      paidOrders: paidOrders.length,
      revenueCents: paidOrders.reduce((sum, order) => sum + Number(order.amountCents || 0), 0),
      revenueYuan: centsToYuan(paidOrders.reduce((sum, order) => sum + Number(order.amountCents || 0), 0)),
      generations: generations.length,
      todayGenerations: todayGenerations.length
    },
    checks: productionChecks(env),
    users: users.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 20).map(publicUser),
    orders: orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 20).map((order) => ({ ...order, userEmail: db.users[order.userId]?.email || "未知用户" })),
    generations: generations.slice(-20).reverse().map((item) => ({
      id: item.id,
      userEmail: db.users[item.userId]?.email || "未知用户",
      toolTitle: item.toolTitle,
      model: item.model,
      demo: item.demo,
      createdAt: item.createdAt
    }))
  };
}

function centsToYuan(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}

async function hashPassword(password, salt = randomHex(16)) {
  const key = await crypto.subtle.importKey("raw", encode(String(password)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(salt), iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return `${salt}:${bytesToHex(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  const [salt, digest] = String(stored || "").split(":");
  if (!salt || !digest) return false;
  const candidate = (await hashPassword(password, salt)).split(":")[1];
  return constantTimeEqual(candidate, digest);
}

function token() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function randomHex(bytes) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  const normalized = String(value || "").replace(/\s/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes);
}

function pemToBytes(pem, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(pem || "").replace(/\\n/g, "\n").match(new RegExp(`-----BEGIN ${escaped}-----([\\s\\S]+?)-----END ${escaped}-----`));
  if (!match) throw new Error(`Invalid ${label} PEM`);
  return base64ToBytes(match[1]);
}

function chunkBase64(value) {
  return String(value).match(/.{1,64}/g)?.join("\n") || "";
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function encode(value) {
  return new TextEncoder().encode(value);
}

function constantTimeEqual(a, b) {
  const left = String(a);
  const right = String(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeWebhookSignature(rawBody, signature, secret, toleranceSeconds = 300) {
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
  const key = await crypto.subtle.importKey("raw", encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, encode(`${timestamp}.${rawBody}`));
  const expected = bytesToHex(new Uint8Array(signed));
  return signatures.some((candidate) => constantTimeEqual(candidate, expected));
}
