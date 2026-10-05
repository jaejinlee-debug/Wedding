(function () {
  "use strict";
  var C = window.WEDDING || {};
  var url;
  try {
    var address = new URL(C.siteUrl || location.href);
    address.hash = "";
    address.search = "";
    url = address.href;
  } catch (e) { url = ""; }
  var title = C.title || document.title;
  var desc = "2026.12.12 토요일 오후 3시 · " + (C.venue || "KU컨벤션웨딩홀");
  var image = url ? new URL("images/share-cover.jpg", url).href : "";
  function $(id) { return document.getElementById(id); }
  function say(msg) {
    var s = $("share-status");
    if (s) s.textContent = msg;
    if (window.weddingToast) window.weddingToast(msg);
  }
  function manualCopy() {
    var inp = $("share-url");
    if (inp) {
      inp.hidden = false; inp.value = url; inp.focus(); inp.select();
      inp.setSelectionRange(0, url.length);
    }
    say("아래 주소를 길게 눌러 복사한 뒤 카카오톡 대화방에 붙여 넣어 주세요.");
  }
  function copyLink() {
    var task;
    try {
      if (window.weddingCopy) task = window.weddingCopy(url);
      else if (navigator.clipboard && window.isSecureContext) task = navigator.clipboard.writeText(url);
      else { manualCopy(); return; }
      Promise.resolve(task).then(function () {
        say("링크를 복사했어요. 카카오톡 대화방에 붙여 넣어 주세요.");
      }, manualCopy);
    } catch (e) { manualCopy(); }
  }
  function ready() {
    return window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized() && window.Kakao.Share;
  }
  function init() {
    var kbtn = $("kakao-share"), cbtn = $("copy-link");
    if (!kbtn) return;
    if (!/^https?:\/\//.test(url)) {
      if (cbtn) cbtn.disabled = true;
      kbtn.hidden = true;
      say("공개된 청첩장 주소에서 공유할 수 있어요.");
      return;
    }
    if (cbtn) cbtn.addEventListener("click", copyLink);
    var inAndroidKakao = /Android/i.test(navigator.userAgent) && /KAKAOTALK/i.test(navigator.userAgent);
    var sdkState = C.kakaoJsKey ? "loading" : "absent";
    var pending = false;
    function updateButton() {
      kbtn.hidden = false;
      kbtn.textContent = ready() ? "카카오톡으로 보내기" :
        ((!inAndroidKakao && navigator.share) ? "공유하기" : "카카오톡에 보낼 링크 복사");
    }
    // SDK 로딩 성공 여부와 무관하게 클릭 처리기를 먼저 연결합니다.
    kbtn.addEventListener("click", function () {
      if (ready()) {
        try {
          // 사용자 클릭 안에서 즉시 실행해야 앱/공유창 호출이 허용됩니다.
          window.Kakao.Share.sendDefault({
            objectType: "feed",
            content: { title: title, description: desc, imageUrl: image, imageWidth: 1200, imageHeight: 800,
              link: { mobileWebUrl: url, webUrl: url } },
            buttons: [{ title: "청첩장 보기", link: { mobileWebUrl: url, webUrl: url } }]
          });
          say("공유창이 열리지 않으면 ‘청첩장 링크 복사’를 이용해 주세요.");
          return;
        } catch (e) { copyLink(); return; }
      }
      // 안드로이드 카카오 인앱에서는 Web Share가 노출되어도 작동하지 않을 수 있습니다.
      if (inAndroidKakao || !navigator.share) { copyLink(); return; }
      if (pending) {
        say("공유창이 열리지 않으면 ‘청첩장 링크 복사’를 이용해 주세요.");
        return;
      }
      var data = { title: title, text: desc, url: url };
      try {
        if (navigator.canShare && !navigator.canShare(data)) { copyLink(); return; }
        pending = true;
        say("공유 목록에서 카카오톡을 선택해 주세요. 창이 안 열리면 링크 복사를 이용해 주세요.");
        Promise.resolve(navigator.share(data)).then(function () {
          pending = false;
          say("");
        }, function (error) {
          pending = false;
          if (error && error.name === "AbortError") { say("공유를 취소했어요. 다시 누르거나 링크를 복사할 수 있어요."); return; }
          copyLink();
        });
      } catch (e) { pending = false; copyLink(); }
    });
    updateButton();
    if (!C.kakaoJsKey) return;
    var s = document.createElement("script");
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js";
    s.integrity = "sha384-zt/G7/KfaRQ9dT/QIkS0ujMtzouJqzuSJcXVQu50x0rl/+mD1dc70AeOejVbMD9E";
    s.crossOrigin = "anonymous";
    var timeout = setTimeout(function () {
      if (sdkState === "loading") { sdkState = "failed"; updateButton(); }
    }, 10000);
    s.onload = function () {
      clearTimeout(timeout);
      try {
        if (!window.Kakao.isInitialized()) window.Kakao.init(C.kakaoJsKey);
        sdkState = "ready";
      } catch (e) { sdkState = "failed"; }
      updateButton();
    };
    s.onerror = function () { clearTimeout(timeout); sdkState = "failed"; updateButton(); };
    document.head.appendChild(s);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
