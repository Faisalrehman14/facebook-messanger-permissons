/**
 * PageChat Hub — Facebook Page Messenger Manager (production app)
 */
(function () {
  'use strict';

  let pages = [];
  let activePage = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    Auth.loadAppId();
    bindUI();
    setReviewNotes();

    if (FB_CONFIG.appId) {
      await Auth.initSDK();
      const session = await Auth.checkSession();
      if (session) await enterApp();
    }
  }

  function bindUI() {
    document.getElementById('btn-save-app-id')?.addEventListener('click', onSaveAppId);
    document.getElementById('btn-login')?.addEventListener('click', onLogin);
    document.getElementById('btn-logout')?.addEventListener('click', onLogout);
    document.getElementById('page-select')?.addEventListener('change', onPageChange);
    document.getElementById('btn-refresh-inbox')?.addEventListener('click', refreshInbox);
    document.getElementById('btn-refresh-posts')?.addEventListener('click', refreshEngagement);
    document.getElementById('composer-form')?.addEventListener('submit', onSendReply);
    document.getElementById('utility-form')?.addEventListener('submit', onSendUtility);
    document.getElementById('btn-copy-notes')?.addEventListener('click', copyNotes);

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
  }

  async function onSaveAppId() {
    try {
      const id = document.getElementById('app-id-input').value;
      Auth.saveAppId(id);
      await Auth.initSDK();
      setStatus('App ID saved. You can sign in now.');
      toast('App ID saved');
    } catch (e) {
      toast(e.message, true);
    }
  }

  async function onLogin() {
    try {
      if (!FB_CONFIG.appId) {
        toast('Enter your Facebook App ID first', true);
        return;
      }
      await Auth.initSDK();
      setStatus('Opening Facebook login…');
      await Auth.login();
      await enterApp();
    } catch (e) {
      setStatus(e.message, true);
      toast(e.message, true);
    }
  }

  async function enterApp() {
    const user = await Auth.fetchUser();
    document.querySelector('.landing-main')?.classList.add('hidden');
    document.querySelector('.landing-header')?.classList.add('hidden');
    document.querySelector('.landing-footer')?.classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');

    document.getElementById('sidebar-avatar').src = user.picture?.data?.url || '';
    document.getElementById('sidebar-name').textContent = user.name;

    pages = await GraphAPI.getPages();
    if (!pages.length) {
      toast('No Pages found. Create a Page and connect it in Meta → Messenger.', true);
      return;
    }

    const sel = document.getElementById('page-select');
    sel.innerHTML = pages.map((p) => `<option value="${p.id}">${escape(p.name)}</option>`).join('');

    const saved = localStorage.getItem(FB_CONFIG.storageKeys.activePageId);
    if (saved && pages.find((p) => p.id === saved)) sel.value = saved;
    await setActivePage(pages.find((p) => p.id === sel.value) || pages[0]);
  }

  async function setActivePage(page) {
    activePage = page;
    localStorage.setItem(FB_CONFIG.storageKeys.activePageId, page.id);
    Inbox.stopPolling();
    await Inbox.load(page);
    await Engagement.load(page);
    Inbox.startPolling(page);
  }

  async function onPageChange(e) {
    const page = pages.find((p) => p.id === e.target.value);
    if (page) await setActivePage(page);
  }

  async function refreshInbox() {
    if (!activePage) return;
    await Inbox.load(activePage);
    toast('Inbox updated');
  }

  async function refreshEngagement() {
    if (!activePage) return;
    await Engagement.load(activePage);
    toast('Engagement updated');
  }

  async function onSendReply(e) {
    e.preventDefault();
    const input = document.getElementById('reply-input');
    try {
      await Inbox.sendReply(activePage, input.value);
      input.value = '';
      toast('Message sent');
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function onSendUtility(e) {
    e.preventDefault();
    const psid = document.getElementById('utility-recipient').value;
    const text = document.getElementById('utility-body').value.trim();
    const tag = document.getElementById('utility-tag').value;
    if (!psid || !text) {
      Utility.showStatus('Select a customer and enter a message.', false);
      return;
    }
    try {
      await Utility.send(activePage, psid, text, tag);
      Utility.showStatus('Utility message sent successfully.', true);
      toast('Utility message sent');
    } catch (err) {
      Utility.showStatus(err.message, false);
      toast(err.message, true);
    }
  }

  async function onLogout() {
    Inbox.stopPolling();
    await Auth.logout();
    localStorage.removeItem(FB_CONFIG.storageKeys.activeConvId);
    location.reload();
  }

  function switchView(name) {
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === name));
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
  }

  function setReviewNotes() {
    const origin = window.location.origin;
    const webhook = `${origin}/webhook`;

    document.getElementById('webhook-callback').textContent = webhook;
    document.getElementById('webhook-url-display').textContent = webhook;

    document.getElementById('review-notes').value = `PageChat Hub — Meta App Review Test Guide
==========================================
App URL: ${origin}/

WHAT THIS APP DOES:
PageChat Hub is a customer support tool for Facebook Page owners. Businesses use it to read Messenger inbox, reply to customers, view post engagement, and send order/account utility updates.

TEST STEPS:
1. Log in with Facebook (test account must be App Admin/Developer).
2. Select a Facebook Page from the sidebar dropdown (pages_show_list).
3. INBOX: View real Messenger conversations (pages_messaging). Open a thread and send a reply.
   - Prerequisite: Test user must have sent a message to the Page first.
4. ENGAGEMENT: View Page posts with likes, comments, shares (pages_read_engagement).
5. UTILITY MESSAGES: Select a customer from inbox list, choose message type, send shipping/order update (pages_utility_messaging).
6. public_profile: Shown in sidebar after login (user name + photo).

Test Facebook account: [YOUR TEST EMAIL]
Test Page name: [YOUR PAGE NAME]

Webhook server (optional): Deploy /server for real-time message delivery.`;
  }

  function copyNotes() {
    const ta = document.getElementById('review-notes');
    ta.select();
    navigator.clipboard?.writeText(ta.value);
    toast('Copied');
  }

  function setStatus(msg, err) {
    const el = document.getElementById('login-status');
    if (el) {
      el.textContent = msg;
      el.style.color = err ? '#e41e3f' : '#65676b';
    }
  }

  function toast(msg, err) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background = err ? '#e41e3f' : '#1c1e21';
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 4000);
  }

  function escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
