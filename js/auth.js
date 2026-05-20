const Auth = (function () {
  'use strict';

  let ready = false;
  let user = null;

  function loadAppId() {
    const saved = localStorage.getItem(FB_CONFIG.storageKeys.appId);
    if (saved) FB_CONFIG.appId = saved;
    const input = document.getElementById('app-id-input');
    if (input && FB_CONFIG.appId) input.value = FB_CONFIG.appId;
  }

  function saveAppId(id) {
    FB_CONFIG.appId = id.trim();
    if (!FB_CONFIG.appId) throw new Error('App ID required');
    localStorage.setItem(FB_CONFIG.storageKeys.appId, FB_CONFIG.appId);
  }

  function initSDK() {
    if (!FB_CONFIG.appId || ready) return Promise.resolve();

    return new Promise((resolve) => {
      window.fbAsyncInit = function () {
        FB.init({
          appId: FB_CONFIG.appId,
          cookie: true,
          xfbml: false,
          version: FB_CONFIG.version,
        });
        ready = true;
        resolve();
      };

      if (!document.getElementById('facebook-jssdk')) {
        const s = document.createElement('script');
        s.id = 'facebook-jssdk';
        s.src = 'https://connect.facebook.net/en_US/sdk.js';
        s.async = true;
        s.defer = true;
        document.body.appendChild(s);
      } else if (window.FB) {
        window.fbAsyncInit();
      }
    });
  }

  function checkSession() {
    return new Promise((resolve) => {
      if (!ready) return resolve(null);
      FB.getLoginStatus((res) => {
        resolve(res.status === 'connected' ? res.authResponse : null);
      });
    });
  }

  function login() {
    return new Promise((resolve, reject) => {
      FB.login(
        (res) => {
          if (res.authResponse) resolve(res.authResponse);
          else reject(new Error('Login cancelled or permissions denied'));
        },
        { scope: FB_CONFIG.scopes, return_scopes: true }
      );
    });
  }

  function logout() {
    return new Promise((resolve) => {
      if (ready) FB.logout(() => resolve());
      else resolve();
    });
  }

  async function fetchUser() {
    user = await GraphAPI.getMe();
    return user;
  }

  function getUser() {
    return user;
  }

  function isReady() {
    return ready;
  }

  return {
    loadAppId,
    saveAppId,
    initSDK,
    checkSession,
    login,
    logout,
    fetchUser,
    getUser,
    isReady,
  };
})();
