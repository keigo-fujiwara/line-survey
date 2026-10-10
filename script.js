// GitHub Actionsによって実行時に環境変数へ置換されます
const LIFF_ID = "__LIFF_ID__";
const GAS_URL = "__GAS_URL__";

let userProfile = null;

window.onload = function() {
  liff.init({ liffId: LIFF_ID })
    .then(() => {
      if (!liff.isLoggedIn()) {
        liff.login();
      } else {
        return liff.getProfile();
      }
    })
    .then(profile => {
      if (profile) {
        userProfile = profile;
        checkAlreadyAnswered(userProfile.userId);
      }
    })
    .catch(err => {
      showError("初期化エラーが発生しました: " + err);
    });
};

function checkAlreadyAnswered(userId) {
  fetch(`${GAS_URL}?userId=${encodeURIComponent(userId)}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("status").style.display = "none";
      if (data.answered) {
        showError("すでに回答済みです。ご協力ありがとうございました！");
      } else {
        document.getElementById("consent-step").style.display = "block";
      }
    })
    .catch(() => {
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
  statusEl.className = "error-msg";
  statusEl.innerText = msg;
  statusEl.style.display = "block";
}