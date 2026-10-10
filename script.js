// GitHub Actionsの envsubst によりビルド時に環境変数が注入されます
const LIFF_ID = "$LIFF_ID";
const GAS_URL = "$GAS_URL";

function updateStatus(msg) {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.innerText = msg;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  updateStatus("LINE SDK初期化中...");

  if (typeof liff === "undefined") {
    showError("エラー: LINE SDKの読み込みに失敗しました。");
    return;
  }

  liff.init({ liffId: LIFF_ID })
    .then(() => {
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }
      document.getElementById("status").style.display = "none";
      document.getElementById("consent-step").style.display = "block";
    })
    .catch(err => {
      showError(`初期化エラー: ${err.message || err}`);
    });
});

document.getElementById("start-btn").onclick = function() {
  document.getElementById("consent-step").style.display = "none";
  document.getElementById("survey-form").style.display = "block";
};

document.getElementById("survey-form").onsubmit = function(e) {
  e.preventDefault();
  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.innerText = "送信中...";

  const payload = {
    satisfaction: document.getElementById("satisfaction").value,
    feedback: document.getElementById("feedback").value
  };

  fetch(GAS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(() => {
    alert("回答ありがとうございました！");
    liff.closeWindow();
  })
  .catch(err => {
    alert("送信エラーが発生しました: " + err);
    btn.disabled = false;
    btn.innerText = "送信する";
  });
};

function showError(msg) {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.className = "error-msg";
    statusEl.innerText = msg;
    statusEl.style.display = "block";
  }
}