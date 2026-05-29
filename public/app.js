const APP_CONFIG = window.MUN_COPILOT_CONFIG || {};
const PRODUCTION_FRONTEND_HOST = "ericeva0130.ccwu.cc";
const PRODUCTION_API_BASE_URL = "https://qinghaxinyu.ccwu.cc";
const API_BASE_URL = String(
  APP_CONFIG.apiBaseUrl || (window.location.hostname === PRODUCTION_FRONTEND_HOST ? PRODUCTION_API_BASE_URL : "")
).replace(/\/$/, "");

const TOOLS = [
  {
    id: "essay",
    icon: "作",
    title: "作文立意与修改",
    hint: "标题、立意、结构、开头结尾",
    cost: 1,
    fields: [
      { name: "topic", label: "作文题目", type: "textarea", placeholder: "粘贴作文题或材料" },
      { name: "draft", label: "已有草稿", type: "textarea", placeholder: "没有草稿可以留空" },
      { name: "style", label: "目标风格", type: "input", placeholder: "例如：复旦附中难度、思辨一点、不要太空泛" },
      { name: "wordCount", label: "字数要求", type: "input", placeholder: "例如：800 字、只要提纲、开头 150 字" }
    ],
    sample: {
      topic: "有人说，真正的成长不是变得锋利，而是知道何时温柔。请写一篇议论文。",
      draft: "成长应该是变强，但也不能失去善意。",
      style: "高中议论文，有思辨感",
      wordCount: "给出提纲和示范开头"
    }
  },
  {
    id: "politics",
    icon: "政",
    title: "政治大题训练",
    hint: "材料分层、知识点、示例答案",
    cost: 1,
    fields: [
      { name: "question", label: "题目", type: "textarea", placeholder: "输入政治主观题" },
      { name: "material", label: "材料", type: "textarea", placeholder: "粘贴材料" },
      { name: "module", label: "模块", type: "input", placeholder: "例如：经济与社会、政治与法治、哲学与文化" },
      { name: "difficulty", label: "难度", type: "input", placeholder: "例如：高考、名校月考、竞赛拓展" }
    ],
    sample: {
      question: "结合材料，说明政府应如何推动新质生产力发展。",
      material: "某地通过数字基础设施建设、产学研合作和营商环境优化，推动传统产业升级。",
      module: "经济与社会 + 政治与法治",
      difficulty: "名校月考"
    }
  },
  {
    id: "history",
    icon: "史",
    title: "历史材料题解析",
    hint: "时空定位、史实调用、逻辑链",
    cost: 1,
    fields: [
      { name: "question", label: "题目", type: "textarea", placeholder: "输入历史材料题" },
      { name: "material", label: "材料", type: "textarea", placeholder: "粘贴材料" },
      { name: "period", label: "时期/主题", type: "input", placeholder: "例如：晚清变局、冷战、工业革命" },
      { name: "requirement", label: "要求", type: "input", placeholder: "例如：概括变化并分析原因" }
    ],
    sample: {
      question: "根据材料并结合所学，概括近代中国外交观念的变化。",
      material: "从天朝体制到条约体系，再到近代国际法观念的输入，中国对外关系发生深刻变化。",
      period: "晚清至民国初年",
      requirement: "分层概括并给出示例答案"
    }
  },
  {
    id: "chineseReading",
    icon: "阅",
    title: "语文阅读答题",
    hint: "题型拆解、答题角度、规范表达",
    cost: 1,
    fields: [
      { name: "passage", label: "文本/节选", type: "textarea", placeholder: "粘贴阅读文本或关键段落" },
      { name: "question", label: "题目", type: "textarea", placeholder: "输入阅读题" },
      { name: "type", label: "题型", type: "input", placeholder: "例如：文学类文本、论述类、古诗文" },
      { name: "goal", label: "目标", type: "input", placeholder: "例如：答题模板、压缩答案、讲清为什么" }
    ],
    sample: {
      passage: "他在暮色里回望故乡，忽然发现记忆并不是远方，而是一种缓慢改变自己的力量。",
      question: "请分析这句话在文中的作用。",
      type: "文学类文本",
      goal: "形成 4 分题答案"
    }
  },
  {
    id: "munPosition",
    icon: "M",
    title: "模联立场文件",
    hint: "国家立场、论点、方案草稿",
    cost: 2,
    fields: [
      { name: "committee", label: "委员会", type: "input", placeholder: "例如：UNSC、UNHRC、WHO" },
      { name: "country", label: "国家/席位", type: "input", placeholder: "例如：France、China、Brazil" },
      { name: "topic", label: "议题", type: "textarea", placeholder: "输入会议议题" },
      { name: "requirement", label: "会议要求", type: "input", placeholder: "例如：800 词英文立场文件、中文提纲" },
      { name: "sources", label: "已有资料", type: "textarea", placeholder: "粘贴背景文件、国家政策或资料链接摘要" }
    ],
    sample: {
      committee: "UNSC",
      country: "France",
      topic: "The protection of civilians in urban armed conflict",
      requirement: "中文研究提纲 + 英文立场文件草稿",
      sources: "关注国际人道法、停火机制、人道准入和战后重建。"
    }
  },
  {
    id: "munSpeech",
    icon: "稿",
    title: "模联发言稿",
    hint: "中英双语、时长版本、攻防句",
    cost: 1,
    fields: [
      { name: "committee", label: "委员会", type: "input", placeholder: "例如：UNSC" },
      { name: "country", label: "国家/席位", type: "input", placeholder: "例如：France" },
      { name: "topic", label: "议题", type: "textarea", placeholder: "输入议题" },
      { name: "stage", label: "会议阶段", type: "input", placeholder: "例如：开场、自由磋商、危机更新后" },
      { name: "duration", label: "发言时长", type: "input", placeholder: "例如：45 秒、1 分钟、3 分钟" },
      { name: "position", label: "核心立场", type: "textarea", placeholder: "输入本国立场和想推动的方案" }
    ],
    sample: {
      committee: "UNSC",
      country: "France",
      topic: "Urban armed conflict and civilian protection",
      stage: "正式辩论开场",
      duration: "60 秒",
      position: "强调国际人道法、人道准入、对袭击平民行为的问责，以及可监督的停火安排。"
    }
  },
  {
    id: "munMotion",
    icon: "动",
    title: "动议与质询清单",
    hint: "会场策略、问题、回应",
    cost: 1,
    fields: [
      { name: "committee", label: "委员会", type: "input", placeholder: "例如：UNSC" },
      { name: "country", label: "国家/席位", type: "input", placeholder: "例如：France" },
      { name: "topic", label: "议题", type: "textarea", placeholder: "输入议题" },
      { name: "situation", label: "当前局势", type: "textarea", placeholder: "描述会场现状、盟友、对手、草案争议点" },
      { name: "goal", label: "目标", type: "input", placeholder: "例如：争取中间国家、推动人道走廊条款" }
    ],
    sample: {
      committee: "UNSC",
      country: "France",
      topic: "Urban armed conflict and civilian protection",
      situation: "部分国家反对制裁语言，但支持人道准入；草案对监督机制写得很弱。",
      goal: "推动监督机制和人道走廊条款"
    }
  }
];

const state = {
  token: localStorage.getItem("token") || "",
  user: null,
  plans: [],
  paymentProviders: [],
  defaultPaymentProvider: "",
  production: false,
  activeTool: TOOLS[0].id,
  lastResult: ""
};

const els = {
  accountSummary: document.querySelector("#accountSummary"),
  authButton: document.querySelector("#authButton"),
  logoutButton: document.querySelector("#logoutButton"),
  authDialog: document.querySelector("#authDialog"),
  authForm: document.querySelector("#authForm"),
  authTitle: document.querySelector("#authTitle"),
  authSubmit: document.querySelector("#authSubmit"),
  authCloseButton: document.querySelector("#authCloseButton"),
  toggleAuthMode: document.querySelector("#toggleAuthMode"),
  nameField: document.querySelector("#nameField"),
  toolList: document.querySelector("#toolList"),
  toolCount: document.querySelector("#toolCount"),
  toolTitle: document.querySelector("#toolTitle"),
  activeCost: document.querySelector("#activeCost"),
  generatorForm: document.querySelector("#generatorForm"),
  generateButton: document.querySelector("#generateButton"),
  sampleButton: document.querySelector("#sampleButton"),
  clearFormButton: document.querySelector("#clearFormButton"),
  resultBox: document.querySelector("#resultBox"),
  copyButton: document.querySelector("#copyButton"),
  exportWordButton: document.querySelector("#exportWordButton"),
  exportPptButton: document.querySelector("#exportPptButton"),
  dailyRemaining: document.querySelector("#dailyRemaining"),
  extraCredits: document.querySelector("#extraCredits"),
  planName: document.querySelector("#planName"),
  usageBar: document.querySelector("#usageBar"),
  openaiStatusDot: document.querySelector("#openaiStatusDot"),
  openaiMode: document.querySelector("#openaiMode"),
  openaiModel: document.querySelector("#openaiModel"),
  openaiHint: document.querySelector("#openaiHint"),
  testOpenAIButton: document.querySelector("#testOpenAIButton"),
  planGrid: document.querySelector("#planGrid"),
  providerSelect: document.querySelector("#providerSelect"),
  paymentWarning: document.querySelector("#paymentWarning"),
  checkoutPanel: document.querySelector("#checkoutPanel"),
  historyList: document.querySelector("#historyList"),
  adminForm: document.querySelector("#adminForm"),
  adminMessage: document.querySelector("#adminMessage"),
  refreshAdminButton: document.querySelector("#refreshAdminButton"),
  adminDashboard: document.querySelector("#adminDashboard"),
  toast: document.querySelector("#toast")
};

let authMode = "login";

function money(cents) {
  if (!cents) return "免费";
  return `¥${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 1)}`;
}

function dateText(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString();
}

function activeTool() {
  return TOOLS.find((tool) => tool.id === state.activeTool) || TOOLS[0];
}

async function api(path, options = {}) {
  const target = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = {
    "content-type": "application/json",
    ...(options.headers || {})
  };
  if (state.token) headers.authorization = `Bearer ${state.token}`;
  const response = await fetch(target, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.add("hidden"), 2600);
}

function renderTools() {
  els.toolCount.textContent = `${TOOLS.length} 个`;
  els.toolList.innerHTML = TOOLS.map((tool) => `
    <button class="tool-button ${tool.id === state.activeTool ? "active" : ""}" type="button" data-tool="${tool.id}">
      <span class="tool-icon">${tool.icon}</span>
      <span>
        <strong>${tool.title}</strong>
        <small>${tool.hint}</small>
      </span>
      <span class="cost-pill">${tool.cost}</span>
    </button>
  `).join("");

  els.toolList.querySelectorAll("[data-tool]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTool = button.dataset.tool;
      renderTools();
      renderForm();
    });
  });
}

function renderForm() {
  const tool = activeTool();
  els.toolTitle.textContent = tool.title;
  els.activeCost.textContent = `每次 ${tool.cost} 额度`;
  els.generatorForm.innerHTML = tool.fields.map((field) => {
    const common = `name="${field.name}" placeholder="${field.placeholder || ""}"`;
    const input = field.type === "textarea"
      ? `<textarea ${common}></textarea>`
      : `<input ${common} />`;
    return `<label class="field"><span>${field.label}</span>${input}</label>`;
  }).join("");
}

function renderUser() {
  const user = state.user;
  els.logoutButton.classList.toggle("hidden", !user);
  els.authButton.classList.toggle("hidden", Boolean(user));

  if (!user) {
    els.accountSummary.textContent = "未登录";
    els.dailyRemaining.textContent = "--";
    els.extraCredits.textContent = "--";
    els.planName.textContent = "体验版";
    els.usageBar.style.width = "0%";
    return;
  }

  els.accountSummary.textContent = `${user.email}`;
  els.dailyRemaining.textContent = user.dailyRemaining;
  els.extraCredits.textContent = user.extraCredits;
  els.planName.textContent = user.planName;
  const percent = user.dailyLimit ? Math.min(100, (user.dailyUsed / user.dailyLimit) * 100) : 100;
  els.usageBar.style.width = `${percent}%`;
}

function renderPlans() {
  const paidPlans = state.plans.filter((plan) => plan.id !== "free");
  els.planGrid.innerHTML = paidPlans.map((plan) => `
    <article class="plan-card ${plan.id === "pro" ? "featured" : ""}">
      <div class="plan-top">
        <div>
          <h3>${plan.name}</h3>
          <span class="badge">${plan.badge}</span>
        </div>
        <div class="price">${money(plan.priceCents)}</div>
      </div>
      <p>${plan.description}</p>
      <p>${plan.extraCredits ? `${plan.extraCredits} 次额外额度` : `每天 ${plan.dailyLimit} 次，${plan.durationDays} 天`}</p>
      <button class="button primary" type="button" data-buy="${plan.id}">购买</button>
    </article>
  `).join("");

  els.planGrid.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => buyPlan(button.dataset.buy));
  });
}

function renderHistory(history = []) {
  if (!state.user) {
    els.historyList.innerHTML = `<div class="history-item">登录后显示生成记录。</div>`;
    return;
  }
  if (!history.length) {
    els.historyList.innerHTML = `<div class="history-item">还没有生成记录。</div>`;
    return;
  }
  els.historyList.innerHTML = history.map((item) => `
    <article class="history-item">
      <div class="history-meta">
        <strong>${item.toolTitle}</strong>
        <span>${new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <div class="history-output">${escapeHtml(item.output)}</div>
      <button class="button ghost" type="button" data-history="${item.id}">放到结果区</button>
    </article>
  `).join("");

  els.historyList.querySelectorAll("[data-history]").forEach((button) => {
    const item = history.find((entry) => entry.id === button.dataset.history);
    button.addEventListener("click", () => {
      state.lastResult = item.output;
      els.resultBox.textContent = item.output;
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function refreshMe() {
  if (!state.token) {
    state.user = null;
    renderUser();
    renderHistory();
    return;
  }
  try {
    const data = await api("/api/me");
    state.user = data.user;
    renderUser();
    await loadHistory();
  } catch {
    state.token = "";
    state.user = null;
    localStorage.removeItem("token");
    renderUser();
    renderHistory();
  }
}

async function loadPlans() {
  const data = await api("/api/plans");
  state.plans = data.plans;
  state.paymentProviders = data.providers || [];
  state.defaultPaymentProvider = data.provider || "";
  state.production = Boolean(data.production);
  renderPaymentProviders();
  renderPlans();
}

function renderPaymentProviders() {
  if (!state.paymentProviders.length) {
    els.providerSelect.innerHTML = `<option value="">支付未配置</option>`;
    els.providerSelect.disabled = true;
    els.paymentWarning.textContent = "服务器还没有配置真实支付方式。生产上线请配置 STRIPE_SECRET_KEY 和 STRIPE_WEBHOOK_SECRET。";
    return;
  }
  els.providerSelect.disabled = false;
  els.providerSelect.innerHTML = state.paymentProviders.map((provider) => `
    <option value="${provider.id}">${provider.name}</option>
  `).join("");
  els.providerSelect.value = state.defaultPaymentProvider || state.paymentProviders[0].id;
  els.paymentWarning.textContent = state.paymentProviders
    .map((provider) => provider.description)
    .filter(Boolean)
    .join(" ");
}

async function loadHistory() {
  if (!state.user) {
    renderHistory();
    return;
  }
  const data = await api("/api/history");
  renderHistory(data.history);
}

function closeAuth() {
  if (els.authDialog.open) els.authDialog.close();
  els.authForm.reset();
}

function openAuth(mode = "login") {
  authMode = mode;
  els.authTitle.textContent = mode === "login" ? "登录" : "创建账号";
  els.authSubmit.textContent = mode === "login" ? "登录" : "注册";
  els.toggleAuthMode.textContent = mode === "login" ? "创建新账号" : "已有账号，去登录";
  els.nameField.classList.toggle("hidden", mode === "login");
  els.authDialog.showModal();
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function handleAuth(event) {
  event.preventDefault();
  const values = formValues(els.authForm);
  const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
  try {
    const data = await api(path, { method: "POST", body: values });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("token", state.token);
    closeAuth();
    renderUser();
    await loadHistory();
    showToast(authMode === "login" ? "登录成功" : "注册成功");
  } catch (error) {
    showToast(error.message);
  }
}

async function loadOpenAIStatus(showResult = false) {
  try {
    const status = await api("/api/openai/status");
    els.openaiStatusDot.classList.toggle("connected", status.configured);
    els.openaiMode.textContent = status.configured ? "OpenAI 已连接" : "演示模式";
    els.openaiModel.textContent = status.model || "--";
    els.openaiHint.textContent = status.message;
    if (showResult) showToast(status.configured ? "OpenAI API 已连接" : "还没配置 OPENAI_API_KEY");
  } catch (error) {
    els.openaiStatusDot.classList.remove("connected");
    els.openaiMode.textContent = "检测失败";
    els.openaiModel.textContent = "--";
    els.openaiHint.textContent = error.message;
    if (showResult) showToast(error.message);
  }
}

function fillSample() {
  const tool = activeTool();
  for (const [name, value] of Object.entries(tool.sample)) {
    const field = els.generatorForm.querySelector(`[name="${name.replaceAll('"', '\\"')}"]`);
    if (field) field.value = value;
  }
}

async function generate(event) {
  event.preventDefault();
  if (!state.user) {
    openAuth("login");
    return;
  }
  const tool = activeTool();
  const fields = formValues(els.generatorForm);
  els.generateButton.disabled = true;
  els.generateButton.textContent = "生成中";
  els.resultBox.textContent = "正在生成...";
  try {
    const data = await api("/api/generate", {
      method: "POST",
      body: { toolId: tool.id, fields }
    });
    state.user = data.user;
    state.lastResult = data.result.output;
    els.resultBox.textContent = data.result.output;
    renderUser();
    await loadHistory();
    showToast(data.result.demo ? "演示内容已生成" : "生成完成");
  } catch (error) {
    els.resultBox.textContent = "生成失败：" + error.message;
    showToast(error.message);
  } finally {
    els.generateButton.disabled = false;
    els.generateButton.textContent = "生成";
  }
}

async function buyPlan(planId) {
  if (!state.user) {
    openAuth("login");
    return;
  }
  try {
    if (!els.providerSelect.value) throw new Error("支付方式还没配置");
    const data = await api("/api/orders", {
      method: "POST",
      body: { planId, provider: els.providerSelect.value }
    });
    if (data.order.provider === "stripe" && data.checkoutUrl.startsWith("http")) {
      window.location.href = data.checkoutUrl;
      return;
    }
    renderCheckout(data.order, data.paymentNote);
    showToast("订单已创建");
  } catch (error) {
    showToast(error.message);
  }
}

function renderCheckout(order, note = "") {
  const plan = state.plans.find((item) => item.id === order.planId);
  const action = order.provider === "mock"
    ? `<button class="button primary" type="button" id="confirmMockPayment">确认模拟支付</button>`
    : `<a class="button primary" href="#admin">等待到账</a>`;
  els.checkoutPanel.classList.remove("hidden");
  els.checkoutPanel.innerHTML = `
    <div class="checkout-panel-inner">
      <div>
        <strong>订单 ${order.id}</strong>
        <div class="muted">${plan?.name || order.planId} · ${money(order.amountCents)} · ${note}</div>
      </div>
      ${action}
    </div>
  `;
  document.querySelector("#confirmMockPayment")?.addEventListener("click", () => confirmMockPayment(order.id));
}

async function confirmMockPayment(orderId) {
  try {
    const data = await api("/api/payments/mock/confirm", {
      method: "POST",
      body: { orderId }
    });
    state.user = data.user;
    renderUser();
    els.checkoutPanel.classList.add("hidden");
    showToast("支付已确认，额度已到账");
  } catch (error) {
    showToast(error.message);
  }
}

function download(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportWord() {
  const content = state.lastResult || els.resultBox.textContent;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>AI 输出</title></head><body><pre style="white-space:pre-wrap;font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.6">${escapeHtml(content)}</pre></body></html>`;
  download("copilot-output.doc", "application/msword", html);
}

function exportPpt() {
  const content = state.lastResult || els.resultBox.textContent;
  const parts = content.split(/\n(?=\d+\.|【|#)/).filter(Boolean).slice(0, 8);
  const slides = (parts.length ? parts : [content]).map((part, index) => `
    <section style="width:960px;height:540px;padding:54px;font-family:Arial,'Microsoft YaHei',sans-serif;page-break-after:always">
      <h1 style="font-size:32px;margin:0 0 24px">第 ${index + 1} 页</h1>
      <pre style="white-space:pre-wrap;font-size:22px;line-height:1.45">${escapeHtml(part)}</pre>
    </section>
  `).join("");
  download("copilot-outline.ppt", "application/vnd.ms-powerpoint", `<!doctype html><html><head><meta charset="utf-8"></head><body>${slides}</body></html>`);
}

async function handleAdmin(event) {
  event.preventDefault();
  const values = formValues(els.adminForm);
  try {
    const data = await api("/api/admin/grant", {
      method: "POST",
      body: values
    });
    els.adminMessage.textContent = `${data.user.email} 已更新：${data.user.planName}，额外 ${data.user.extraCredits} 次`;
    await loadAdminOverview();
    showToast("后台操作完成");
  } catch (error) {
    els.adminMessage.textContent = error.message;
    showToast(error.message);
  }
}

function adminSecret() {
  return String(new FormData(els.adminForm).get("adminSecret") || "").trim();
}

async function loadAdminOverview() {
  const secret = adminSecret();
  if (!secret) {
    showToast("先填写后台密钥");
    return;
  }
  try {
    const data = await api("/api/admin/overview", {
      method: "POST",
      body: { adminSecret: secret }
    });
    renderAdminDashboard(data);
    showToast("运营看板已刷新");
  } catch (error) {
    els.adminDashboard.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    showToast(error.message);
  }
}

function renderAdminDashboard(data) {
  const stats = data.stats || {};
  const checks = data.checks?.checks || [];
  const endpoints = data.endpoints || {};
  const orders = data.orders || [];
  const users = data.users || [];
  const generations = data.generations || [];
  els.adminDashboard.innerHTML = `
    <div class="stat-grid">
      ${adminStat("用户", stats.users)}
      ${adminStat("活跃套餐", stats.activeUsers)}
      ${adminStat("待支付订单", stats.pendingOrders)}
      ${adminStat("已付订单", stats.paidOrders)}
      ${adminStat("营收", `¥${stats.revenueYuan || 0}`)}
      ${adminStat("今日生成", stats.todayGenerations)}
    </div>
    <div class="ops-grid">
      <section class="ops-panel">
        <h3>生产自检</h3>
        <div class="check-list">
          ${checks.map((check) => `
            <div class="check-item ${check.ok ? "ok" : "warn"}">
              <strong>${escapeHtml(check.label)}</strong>
              <span>${escapeHtml(check.detail)}</span>
            </div>
          `).join("") || `<div class="empty-state">暂无检查项</div>`}
        </div>
      </section>
      <section class="ops-panel">
        <h3>上线地址</h3>
        <div class="check-list">
          <div class="check-item ok">
            <strong>前端网站</strong>
            <span>${escapeHtml(endpoints.frontendBaseUrl || "https://ericeva0130.ccwu.cc")}</span>
          </div>
          <div class="check-item ok">
            <strong>后台 API</strong>
            <span>${escapeHtml(endpoints.apiBaseUrl || "https://qinghaxinyu.ccwu.cc")}</span>
          </div>
          <div class="check-item ok">
            <strong>支付回调</strong>
            <span>${escapeHtml(endpoints.stripeWebhookUrl || "https://qinghaxinyu.ccwu.cc/api/payments/webhook")}</span>
          </div>
        </div>
      </section>
      <section class="ops-panel">
        <h3>最近订单</h3>
        <div class="table-scroll">
          <table>
            <thead><tr><th>用户</th><th>套餐</th><th>金额</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              ${orders.map((order) => `
                <tr>
                  <td>${escapeHtml(order.userEmail)}</td>
                  <td>${escapeHtml(order.planId)}</td>
                  <td>${money(order.amountCents)}</td>
                  <td>${escapeHtml(order.status)}</td>
                  <td>
                    ${order.status === "pending"
                      ? `<button class="button ghost compact-button" type="button" data-confirm-order="${order.id}">确认到账</button>`
                      : `<span class="muted">${dateText(order.paidAt)}</span>`}
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="5">暂无订单</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
      <section class="ops-panel">
        <h3>最近用户</h3>
        <div class="table-scroll">
          <table>
            <thead><tr><th>邮箱</th><th>套餐</th><th>今日剩余</th><th>额外</th></tr></thead>
            <tbody>
              ${users.map((user) => `
                <tr>
                  <td>${escapeHtml(user.email)}</td>
                  <td>${escapeHtml(user.planName)}</td>
                  <td>${user.dailyRemaining}</td>
                  <td>${user.extraCredits}</td>
                </tr>
              `).join("") || `<tr><td colspan="4">暂无用户</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
      <section class="ops-panel">
        <h3>最近生成</h3>
        <div class="table-scroll">
          <table>
            <thead><tr><th>用户</th><th>工具</th><th>模型</th><th>时间</th></tr></thead>
            <tbody>
              ${generations.map((item) => `
                <tr>
                  <td>${escapeHtml(item.userEmail)}</td>
                  <td>${escapeHtml(item.toolTitle)}</td>
                  <td>${escapeHtml(item.model)}${item.demo ? " / demo" : ""}</td>
                  <td>${dateText(item.createdAt)}</td>
                </tr>
              `).join("") || `<tr><td colspan="4">暂无生成记录</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
  els.adminDashboard.querySelectorAll("[data-confirm-order]").forEach((button) => {
    button.addEventListener("click", () => confirmAdminOrder(button.dataset.confirmOrder));
  });
}

function adminStat(label, value) {
  return `
    <div class="stat-card">
      <span>${label}</span>
      <strong>${value ?? 0}</strong>
    </div>
  `;
}

async function confirmAdminOrder(orderId) {
  const secret = adminSecret();
  if (!secret) {
    showToast("先填写后台密钥");
    return;
  }
  try {
    const data = await api("/api/admin/orders/confirm", {
      method: "POST",
      body: { adminSecret: secret, orderId }
    });
    renderAdminDashboard(data.overview);
    showToast("订单已确认到账");
  } catch (error) {
    showToast(error.message);
  }
}

function handleHashCheckout() {
  const match = location.hash.match(/checkout=([^&]+)/);
  const success = location.hash.match(/payment_success=([^&]+)/);
  if (match) {
    renderCheckout({ id: match[1], planId: "starter", amountCents: 0 }, "请回到订单列表核对支付状态。");
  }
  if (success) {
    showToast("支付平台已返回，请等待 webhook 确认到账");
  }
}

function bindEvents() {
  els.authButton.addEventListener("click", () => openAuth("login"));
  els.authCloseButton.addEventListener("click", closeAuth);
  els.authDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeAuth();
  });
  els.authDialog.addEventListener("click", (event) => {
    if (event.target === els.authDialog) closeAuth();
  });
  els.logoutButton.addEventListener("click", async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Local logout should still proceed if the session already expired.
    }
    state.token = "";
    state.user = null;
    localStorage.removeItem("token");
    renderUser();
    renderHistory();
  });
  els.toggleAuthMode.addEventListener("click", () => openAuth(authMode === "login" ? "register" : "login"));
  els.authForm.addEventListener("submit", handleAuth);
  els.generatorForm.addEventListener("submit", generate);
  els.sampleButton.addEventListener("click", fillSample);
  els.clearFormButton.addEventListener("click", () => els.generatorForm.reset());
  els.copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(state.lastResult || els.resultBox.textContent);
    showToast("已复制");
  });
  els.exportWordButton.addEventListener("click", exportWord);
  els.exportPptButton.addEventListener("click", exportPpt);
  els.testOpenAIButton.addEventListener("click", () => loadOpenAIStatus(true));
  els.adminForm.addEventListener("submit", handleAdmin);
  els.refreshAdminButton.addEventListener("click", loadAdminOverview);
  window.addEventListener("hashchange", handleHashCheckout);
}

async function init() {
  renderTools();
  renderForm();
  bindEvents();
  await loadPlans();
  await loadOpenAIStatus();
  await refreshMe();
  handleHashCheckout();
}

init().catch((error) => {
  showToast(error.message);
});
