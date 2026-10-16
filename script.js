// GitHub Actionsの envsubst によりビルド時に環境変数が注入されます
const GAS_URL = "$GAS_URL";

// ===== 本番前に切り替える設定（true / false を変えてプッシュするだけ） =====

// 受付期間の制限（true: 期間外は回答できない / false: いつでも回答できる）
const ENABLE_PERIOD = false;
const PERIOD_START = new Date("2026-11-06T11:30:00+09:00");
const PERIOD_END = new Date("2026-12-07T23:59:59+09:00");

// 重複回答の防止（true: 同じ端末からは1回まで / false: 何回でも回答できる）
const ENABLE_DUPLICATE_CHECK = false;
// 回答済みの記録名。変えると、それまでの回答済み記録がリセットされる
const ANSWERED_KEY = "survey-answered-202612";

// =====================================================================

const CONFIRM_STEP = 7;

// 確認画面に表示する項目（step はタップしたときに戻る設問）
const CONFIRM_ITEMS = [
  { name: "grade", label: "お子様の学年", step: 1 },
  { name: "gender", label: "お子様の性別", step: 2 },
  { name: "satisfaction", label: "本日のイベントの感想", step: 3 },
  { name: "highlight", label: "良かった部分・面白かった部分", step: 4 },
  { name: "message", label: "ご感想・メッセージ", step: 5 },
  { name: "future", label: "参加してみたいイベント・テーマ", step: 6 }
];

// 確認画面から修正に来たときは、次へ進むボタンで確認画面に戻る
let isEditing = false;

function showSurveyStep(stepNumber) {
  document.querySelectorAll(".step").forEach(step => {
    const isActive = step.dataset.step === String(stepNumber);
    step.classList.toggle("is-active", isActive);

    const nextBtn = step.querySelector(".next-btn");
    if (isActive && nextBtn) {
      if (!nextBtn.dataset.label) nextBtn.dataset.label = nextBtn.innerText;
      nextBtn.innerText = isEditing ? "確認画面に戻る" : nextBtn.dataset.label;
    }
  });

  if (stepNumber === CONFIRM_STEP) renderConfirm();
  window.scrollTo(0, 0);
}

function renderConfirm() {
  const data = new FormData(document.getElementById("survey-form"));
  const list = document.getElementById("confirm-list");
  list.innerHTML = "";

  CONFIRM_ITEMS.forEach(item => {
    const value = (data.get(item.name) || "").trim();

    const row = document.createElement("button");
    row.type = "button";
    row.className = "confirm-item";

    const label = document.createElement("span");
    label.className = "confirm-label";
    label.textContent = item.label;

    const answer = document.createElement("span");
    answer.className = "confirm-value";
    answer.textContent = value;

    const edit = document.createElement("span");
    edit.className = "confirm-edit";
    edit.textContent = "修正する ›";

    row.append(label, answer, edit);
    row.addEventListener("click", () => {
      isEditing = true;
      showSurveyStep(item.step);
    });
    list.appendChild(row);
  });
}

document.querySelectorAll(".step[data-required='true']").forEach(step => {
  const nextBtn = step.querySelector(".next-btn");
  step.querySelectorAll("input[type='radio']").forEach(radio => {
    radio.addEventListener("change", () => {
      step.querySelectorAll(".choice").forEach(choice => choice.classList.remove("is-selected"));
      radio.closest(".choice").classList.add("is-selected");
      nextBtn.disabled = false;
    });
  });
});

document.querySelectorAll(".next-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    if (isEditing) {
      isEditing = false;
      showSurveyStep(CONFIRM_STEP);
      return;
    }
    showSurveyStep(Number(btn.closest(".step").dataset.step) + 1);
  });
});

document.getElementById("start-btn").onclick = function() {
  document.getElementById("consent-step").style.display = "none";
  document.getElementById("survey-form").style.display = "block";
  showSurveyStep(1);
};

// 日時を日本時間で「2026年12月6日 11:30」の形にする（端末のタイムゾーンに左右されない）
function formatJst(date, withYear) {
  const parts = {};
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).forEach(part => {
    parts[part.type] = part.value;
  });
  const year = withYear ? `${parts.year}年` : "";
  return `${year}${Number(parts.month)}月${Number(parts.day)}日 ${parts.hour}:${parts.minute}`;
}

// 実施期間（終了が開始と同じ年なら、終了側の年は省略する）
const PERIOD_TEXT = `${formatJst(PERIOD_START, true)} 〜 ${formatJst(PERIOD_END, PERIOD_START.getFullYear() !== PERIOD_END.getFullYear())}`;
document.getElementById("period-text").innerText = PERIOD_TEXT;

// 回答できない状態なら、その理由を表示する（回答できる場合は null）
function getClosedReason() {
  if (ENABLE_PERIOD) {
    const now = new Date();
    if (now < PERIOD_START) {
      return { title: "受付開始前です", text: `アンケートは${formatJst(PERIOD_START, true)}から受け付けます。` };
    }
    if (now > PERIOD_END) {
      return { title: "受付終了", text: "アンケート受付期間は終了しました。ご協力誠にありがとうございます。" };
    }
  }
  if (ENABLE_DUPLICATE_CHECK && hasAnswered()) {
    return { title: "回答済みです", text: "このアンケートにはすでにご回答いただいています。ご協力誠にありがとうございます。" };
  }
  return null;
}

function showClosed(reason) {
  document.getElementById("status").style.display = "none";
  document.getElementById("consent-step").style.display = "none";
  document.getElementById("survey-form").style.display = "none";
  document.getElementById("closed-title").innerText = reason.title;
  document.getElementById("closed-text").innerText = reason.text;
  document.getElementById("closed-step").style.display = "block";
  window.scrollTo(0, 0);
}

// 回答済みの記録は端末のブラウザに保存する（使えない環境では記録しない）
function hasAnswered() {
  try {
    return localStorage.getItem(ANSWERED_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function markAnswered() {
  if (!ENABLE_DUPLICATE_CHECK) return;
  try {
    localStorage.setItem(ANSWERED_KEY, "1");
  } catch (e) {
    // 保存できない環境では重複防止をあきらめる
  }
}

const closedReason = getClosedReason();
if (closedReason) showClosed(closedReason);

// 「送信中.」→「送信中..」→「送信中...」→「送信中.」と繰り返す
let sendingTimer = null;

function startSending() {
  const dots = document.getElementById("sending-dots");
  let count = 1;
  dots.innerText = ".";
  sendingTimer = setInterval(() => {
    count = count % 3 + 1;
    dots.innerText = ".".repeat(count);
  }, 400);

  document.getElementById("status").style.display = "none";
  document.getElementById("sending-overlay").style.display = "flex";
}

function stopSending() {
  clearInterval(sendingTimer);
  sendingTimer = null;
  document.getElementById("sending-overlay").style.display = "none";
}

document.getElementById("survey-form").onsubmit = function(e) {
  e.preventDefault();
  const data = new FormData(e.target);
  const grade = data.get("grade") || "";
  const gender = data.get("gender") || "";
  const satisfaction = data.get("satisfaction") || "";

  if (!grade || !gender || !satisfaction) {
    isEditing = true;
    showSurveyStep(!grade ? 1 : !gender ? 2 : 3);
    return;
  }

  // 回答中に受付終了時刻を過ぎた場合や、別の画面で回答済みの場合は送信しない
  const reason = getClosedReason();
  if (reason) {
    showClosed(reason);
    return;
  }

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;

  const payload = {
    grade: grade,
    gender: gender,
    satisfaction: satisfaction,
    highlight: data.get("highlight") || "",
    message: data.get("message") || "",
    future: data.get("future") || ""
  };

  startSending();

  fetch(GAS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
  .then(() => {
    stopSending();
    markAnswered();
    document.getElementById("survey-form").style.display = "none";
    document.getElementById("done-step").style.display = "block";
    window.scrollTo(0, 0);
  })
  .catch(() => {
    stopSending();
    showError("送信できませんでした。もう一度お試しください。");
    window.scrollTo(0, 0);
    btn.disabled = false;
  });
};

// LINEの中のブラウザは window.close() で閉じられないため、公式アカウントを開く
// （oaMessage だとメッセージ入力状態になるため、ti/p を使う）
const LINE_CHAT_URL = "https://line.me/R/ti/p/%40684dmirn";

document.querySelectorAll(".back-btn").forEach(btn => {
  btn.onclick = function() {
    location.href = LINE_CHAT_URL;
  };
});

function showError(msg) {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.className = "error-msg";
    statusEl.innerText = msg;
    statusEl.style.display = "block";
  }
}
