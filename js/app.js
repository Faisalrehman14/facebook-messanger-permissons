/**
 * FB Messenger Demo — App Review
 * Demonstrates all 5 Meta permissions with live Graph API calls.
 */

(function () {
  'use strict';

  let fbReady = false;
  let currentUser = null;
  let pages = [];
  let selectedPage = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ─── Init ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setUrls();
    setTestInstructions();
    loadConfigFromStorage();
    bindEvents();
    updateChecklist();
  }

  function setUrls() {
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
    const origin = window.location.origin;
    $('redirect-uri') && ($('redirect-uri').textContent = origin + '/');
    $('url-privacy') && ($('url-privacy').textContent = base + 'privacy.html');
    $('url-terms') && ($('url-terms').textContent = base + 'terms.html');
    $('url-app') && ($('url-app').textContent = origin + '/');
  }

  function setTestInstructions() {
    const base = window.location.origin;
    const text = `TEST INSTRUCTIONS FOR META APP REVIEW
=====================================
1. Open: ${base}/
2. Click "Connect with Facebook" and log in with the test account (added as App Admin/Developer).
3. public_profile tab: Click "Run Demo" — profile name and photo appear.
4. pages_show_list tab: Click "Refresh Pages List" — managed Pages list loads. Select a Page from dropdown.
5. pages_read_engagement tab: Click "Load Page Posts" — posts with likes/comments counts appear.
6. pages_messaging tab: Enter test user PSID + message → Click Send (test user must have messaged the Page before).
7. pages_utility_messaging tab: Send a utility message (order update style).

Test Account: [ADD YOUR TEST FB EMAIL HERE]
Test Page: [ADD YOUR PAGE NAME HERE]
Note: App is in Development mode — only users with App roles can log in.`;
    const el = $('test-instructions');
    if (el) el.value = text;
  }

  function loadConfigFromStorage() {
    const saved = localStorage.getItem('fb_demo_app_id');
    if (saved) {
      FB_CONFIG.appId = saved;
      $('app-id-input').value = saved;
    }
    updateConfigWarning();
    if (FB_CONFIG.appId) {
      initFacebookSDK();
      markCheck('config');
    }
  }

  function updateConfigWarning() {
    const el = $('config-warning');
    if (!el) return;
    if (FB_CONFIG.appId) {
      el.textContent = '✓ App ID configured — ab Facebook Login try karein.';
      el.classList.add('ok');
    }
  }

  function bindEvents() {
    $('btn-save-config')?.addEventListener('click', saveConfig);
    $('btn-login')?.addEventListener('click', login);
    $('btn-logout')?.addEventListener('click', logout);
    $('btn-demo-profile')?.addEventListener('click', demoProfile);
    $('btn-demo-pages')?.addEventListener('click', demoPages);
    $('btn-demo-engagement')?.addEventListener('click', demoEngagement);
    $('btn-send-msg')?.addEventListener('click', demoMessaging);
    $('btn-send-utility')?.addEventListener('click', demoUtilityMessaging);
    $('btn-copy-instructions')?.addEventListener('click', copyInstructions);
    $('page-select')?.addEventListener('change', onPageSelect);

    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
  }

  function saveConfig() {
    const id = $('app-id-input').value.trim();
    if (!id) return toast('App ID enter karein', true);
    FB_CONFIG.appId = id;
    localStorage.setItem('fb_demo_app_id', id);
    updateConfigWarning();
    markCheck('config');
    initFacebookSDK();
    toast('App ID saved!');
  }

  // ─── Facebook SDK ─────────────────────────────────────
  function initFacebookSDK() {
    if (!FB_CONFIG.appId || fbReady) return;

    window.fbAsyncInit = function () {
      FB.init({
        appId: FB_CONFIG.appId,
        cookie: true,
        xfbml: false,
        version: FB_CONFIG.version,
      });
      fbReady = true;
      checkLoginStatus();
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.async = true;
      js.defer = true;
      document.body.appendChild(js);
    } else if (window.FB) {
      window.fbAsyncInit();
    }
  }

  function checkLoginStatus() {
    FB.getLoginStatus((res) => {
      if (res.status === 'connected') {
        onLoginSuccess(res.authResponse);
      }
    });
  }

  function login() {
    if (!FB_CONFIG.appId) {
      toast('Pehle App ID save karein (Setup section)', true);
      $('setup').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!fbReady) {
      initFacebookSDK();
      setTimeout(login, 800);
      return;
    }

    FB.login(
      (res) => {
        if (res.authResponse) {
          onLoginSuccess(res.authResponse);
        } else {
          toast('Login cancel — permissions allow karein', true);
        }
      },
      { scope: FB_CONFIG.scopes, return_scopes: true }
    );
  }

  function logout() {
    if (fbReady) FB.logout(() => location.reload());
    else location.reload();
  }

  async function onLoginSuccess(auth) {
    markCheck('login');
    $('dashboard').classList.remove('hidden');
    $('hero').querySelector('.hero-actions')?.classList.add('hidden');

    try {
      const me = await api('GET', '/me?fields=id,name,picture.type(large)');
      currentUser = me;
      showUserPill(me);
      demoProfile();
      await demoPages();
    } catch (e) {
      toast('Profile load error: ' + e.message, true);
    }
  }

  function showUserPill(me) {
    const pill = $('user-pill');
    pill.classList.remove('hidden');
    $('user-avatar').src = me.picture?.data?.url || '';
    $('user-name').textContent = me.name;
  }

  // ─── Permission Demos ─────────────────────────────────
  async function demoProfile() {
    const box = $('profile-result');
    box.className = 'result-box';
    try {
      const me = await api('GET', '/me?fields=id,name,picture.type(large)');
      markCheck('profile');
      box.innerHTML = `
        <div class="profile-card">
          <img src="${me.picture?.data?.url || ''}" alt="" />
          <div>
            <div class="name">${escapeHtml(me.name)}</div>
            <div class="id">ID: ${me.id}</div>
          </div>
        </div>`;
      box.classList.add('success');
      $('api-profile').textContent = 'GET /me?fields=id,name,picture → ' + JSON.stringify(me, null, 2);
    } catch (e) {
      box.textContent = 'Error: ' + e.message;
      box.classList.add('error');
    }
  }

  async function demoPages() {
    const box = $('pages-result');
    box.className = 'result-box';
    box.textContent = 'Loading pages...';
    try {
      const res = await api('GET', '/me/accounts?fields=id,name,category,picture,access_token');
      pages = res.data || [];
      markCheck('pages');

      if (!pages.length) {
        box.textContent = 'Koi Page nahi mili. Facebook par Page create karein aur usse App se connect karein (Messenger settings).';
        return;
      }

      box.innerHTML = pages
        .map(
          (p) => `
        <div class="page-item">
          <img src="${p.picture?.data?.url || ''}" alt="" />
          <div>
            <strong>${escapeHtml(p.name)}</strong><br/>
            <span style="color:var(--muted);font-size:.8rem">${escapeHtml(p.category || '')} · ID: ${p.id}</span>
          </div>
        </div>`
        )
        .join('');
      box.classList.add('success');

      const sel = $('page-select');
      sel.innerHTML = '<option value="">— Select a page —</option>';
      pages.forEach((p, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = p.name;
        sel.appendChild(opt);
      });
      if (pages.length === 1) {
        sel.value = '0';
        onPageSelect();
      }
    } catch (e) {
      box.textContent = 'Error: ' + e.message + '\n\nTip: pages_show_list permission approve honi chahiye. Development mode mein admin account se login karein.';
      box.classList.add('error');
    }
  }

  function onPageSelect() {
    const idx = $('page-select').value;
    selectedPage = idx !== '' ? pages[Number(idx)] : null;
  }

  async function demoEngagement() {
    const box = $('engagement-result');
    if (!selectedPage) {
      box.textContent = 'Pehle pages_show_list tab se Page select karein.';
      box.className = 'result-box error';
      return;
    }
    box.className = 'result-box';
    box.textContent = 'Loading posts...';
    try {
      const res = await pageApi(
        selectedPage.id,
        selectedPage.access_token,
        'GET',
        `/${selectedPage.id}/posts?fields=message,created_time,likes.summary(true),comments.summary(true)&limit=5`
      );
      markCheck('engagement');
      const posts = res.data || [];
      if (!posts.length) {
        box.textContent = 'Is Page par koi posts nahi — pehle Page par post karein.';
        return;
      }
      box.innerHTML = posts
        .map((post) => {
          const likes = post.likes?.summary?.total_count ?? 0;
          const comments = post.comments?.summary?.total_count ?? 0;
          const date = post.created_time ? new Date(post.created_time).toLocaleString() : '';
          return `
          <div class="post-item">
            <div>${escapeHtml(post.message || '(no text)')}</div>
            <div class="meta">${date} · ❤️ ${likes} likes · 💬 ${comments} comments</div>
          </div>`;
        })
        .join('');
      box.classList.add('success');
    } catch (e) {
      box.textContent = 'Error: ' + e.message;
      box.classList.add('error');
    }
  }

  async function demoMessaging() {
    const box = $('messaging-result');
    if (!selectedPage) {
      toast('Pehle Page select karein', true);
      return;
    }
    const psid = $('recipient-psid').value.trim();
    const text = $('msg-text').value.trim() || 'Hello from Messenger Demo App Review!';
    if (!psid) {
      toast('Recipient PSID enter karein', true);
      return;
    }

    box.className = 'result-box';
    box.textContent = 'Sending...';
    try {
      const res = await pageApi(selectedPage.id, selectedPage.access_token, 'POST', `/${selectedPage.id}/messages`, {
        recipient: { id: psid },
        message: { text },
        messaging_type: 'RESPONSE',
      });
      markCheck('messaging');
      box.textContent = '✓ Message sent!\n' + JSON.stringify(res, null, 2);
      box.classList.add('success');
      toast('Message sent!');
    } catch (e) {
      box.textContent = 'Error: ' + e.message + '\n\nCommon fix: Test user ne pehle Page ko message kiya hona chahiye (24h window). App Roles mein test user add karein.';
      box.classList.add('error');
    }
  }

  async function demoUtilityMessaging() {
    const box = $('utility-result');
    if (!selectedPage) {
      toast('Pehle Page select karein', true);
      return;
    }
    const psid = $('utility-psid').value.trim() || $('recipient-psid').value.trim();
    const text = $('utility-text').value.trim() || 'Your order has been confirmed. Thank you!';
    const tag = $('utility-type').value;
    if (!psid) {
      toast('Recipient PSID enter karein', true);
      return;
    }

    box.className = 'result-box';
    box.textContent = 'Sending utility message...';
    try {
      const res = await pageApi(selectedPage.id, selectedPage.access_token, 'POST', `/${selectedPage.id}/messages`, {
        recipient: { id: psid },
        message: { text },
        messaging_type: 'MESSAGE_TAG',
        tag,
      });
      markCheck('utility');
      box.textContent = '✓ Utility message sent!\n' + JSON.stringify(res, null, 2);
      box.classList.add('success');
      toast('Utility message sent!');
    } catch (e) {
      box.textContent = 'Error: ' + e.message + '\n\nNote: Utility messages need approved message tag + user opt-in. Development mode restrictions apply.';
      box.classList.add('error');
    }
  }

  // ─── Graph API helpers ──────────────────────────────────
  function api(method, path, body) {
    return new Promise((resolve, reject) => {
      const params = { method: path.split('?')[0] === path && method === 'GET' ? 'GET' : method };
      if (method === 'GET') {
        FB.api(path, params, (res) => {
          if (res && !res.error) resolve(res);
          else reject(new Error(res?.error?.message || 'API failed'));
        });
      } else {
        FB.api(path, method, body || {}, (res) => {
          if (res && !res.error) resolve(res);
          else reject(new Error(res?.error?.message || 'API failed'));
        });
      }
    });
  }

  function pageApi(pageId, pageToken, method, path, body) {
    return new Promise((resolve, reject) => {
      const opts = body ? { ...body, access_token: pageToken } : { access_token: pageToken };
      if (method === 'GET') {
        FB.api(path, { access_token: pageToken }, (res) => {
          if (res && !res.error) resolve(res);
          else reject(new Error(res?.error?.message || JSON.stringify(res?.error)));
        });
      } else {
        FB.api(path, 'POST', opts, (res) => {
          if (res && !res.error) resolve(res);
          else reject(new Error(res?.error?.message || JSON.stringify(res?.error)));
        });
      }
    });
  }

  // ─── UI helpers ─────────────────────────────────────────
  function switchTab(name) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + name));
  }

  function markCheck(id) {
    const item = document.querySelector(`[data-check="${id}"]`);
    if (item) item.classList.add('done');
    if (id === 'privacy' || ['config'].includes(id)) return;
    if (['profile', 'pages', 'engagement', 'messaging', 'utility'].includes(id)) {
      markCheck('privacy');
    }
  }

  function updateChecklist() {
    if (window.location.protocol === 'https:' || location.hostname === 'localhost') {
      /* privacy url exists */
    }
    markCheck('privacy');
  }

  function copyInstructions() {
    const ta = $('test-instructions');
    ta.select();
    navigator.clipboard?.writeText(ta.value);
    toast('Copied to clipboard!');
  }

  function toast(msg, isError) {
    const el = $('toast');
    el.textContent = msg;
    el.style.background = isError ? '#f02849' : '#1c1e21';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3500);
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
