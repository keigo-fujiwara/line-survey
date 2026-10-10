// GitHub Actionsの envsubst によりビルド時に環境変数が注入されます
const LIFF_ID = "$LIFF_ID";
const GAS_URL = "$GAS_URL";

let userProfile = null;

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
      updateStatus("ログイン状態確認中...");
      if (!liff.isLoggedIn()) {
        updateStatus("LINEログイン実行中...");
        liff.login();
      } else {
        return liff.getProfile();
      }
    })
    .then(profile => {
      if (profile) {
        userProfile = profile;
        updateStatus("重複回答チェック中...");
        checkAlreadyAnswered(userProfile.userId);
      }
    })
    .catch(err => {
      showError(`初期化エラー: ${err.message || err}\n(LIFF ID: ${LIFF_ID})`);
    });
});

function checkAlreadyAnswered(userId) {
  fetch(`${GAS_URL}?userId=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("status").style.display = "none";
      if (data && data.answered) {
        showError("すでに回答済みです。ご協力ありがとうございました！");
      } else {
        document.getElementById("consent-step").style.display = "block";
      }
    })
    .catch(err => {
      console.error("Check Error:", err);
      document.getElementById("status").style.display = "none";
      document.getElementById("consent-step").style.display = "block";
    });
}

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
    userId: userProfile ? userProfile.userId : "不明",
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