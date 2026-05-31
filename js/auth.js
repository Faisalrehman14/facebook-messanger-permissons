const Auth = (function () {
  'use strict';

  let ready = false;
  let user = null;

  function getAppId() {
    return FB_CONFIG.appId?.trim() || '';
  }

  function initSDK() {
    const appId = getAppId();
    if (!appId) {
      return Promise.reject(
        new Error(
          'App is not configured yet. Owner must set FACEBOOK_APP_ID on Railway (or js/config.js).'
        )
      );
    }
    if (ready) return Promise.resolve();

    return new Promise((resolve, reject) => {
      window.fbAsyncInit = function () {
        try {
          FB.init({
            appId,
            cookie: true,
            xfbml: false,
            version: FB_CONFIG.version,
          });
          ready = true;
          resolve();
        } catch (e) {
          reject(e);
        }
      };

      if (!document.getElementById('facebook-jssdk')) {
        const s = document.createElement('script');
        s.id = 'facebook-jssdk';
        s.src = 'https://connect.facebook.net/en_US/sdk.js';
        s.async = true;
        s.defer = true;
        s.onerror = () => reject(new Error('Could not load Facebook SDK. Check your internet connection.'));
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
          if (res.authResponse) {
            res.authResponse.grantedScopes = res.authResponse.grantedScopes || '';
            return resolve(res.authResponse);
          }
          if (res.status === 'not_authorized') {
            return reject(
              new Error(
                'Permissions not granted. Please accept all permissions so we can load your Page inbox.'
              )
            );
          }
          reject(
            new Error(
              'Login cancelled. If you cannot log in, the app may still be in Development mode — ask the app owner to add you as a Tester, or wait until the app is Live.'
            )
          );
        },
        {
          scope: FB_CONFIG.scopes,
          return_scopes: true,
          auth_type: 'rerequest',
        }
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
    getAppId,
    initSDK,
    checkSession,
    login,
    logout,
    fetchUser,
    getUser,
    isReady,
  };
})();
