window.onload = function() {
  // 初期化時の ID を画面に表示して検証
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
      // エラー時に実際に読み込まれた LIFF_ID を表示させる
      showError(`初期化エラー: ${err}\n(読み込み中のLIFF ID: ${LIFF_ID})`);
    });
};