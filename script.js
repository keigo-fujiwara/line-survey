// GitHub Actionsの envsubst によりビルド時に環境変数が注入されます
const GAS_URL = "$GAS_URL";

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

document.getElementById("back-btn").onclick = function() {
  window.close();
};

function showError(msg) {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.className = "error-msg";
    statusEl.innerText = msg;
    statusEl.style.display = "block";
  }
}
