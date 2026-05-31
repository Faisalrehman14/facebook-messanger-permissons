/**
 * Meta App Review — guided walkthrough & submission text
 */
const AppReview = (function () {
  'use strict';

  const STEPS = [
    {
      id: 'public_profile',
      view: null,
      title: 'Step 1: public_profile',
      text: 'Your name and photo appear in the sidebar after login. This identifies the Page manager.',
      check: 'check-profile',
    },
    {
      id: 'pages_show_list',
      view: null,
      title: 'Step 2: pages_show_list',
      text: 'Use the "Active Page" dropdown in the sidebar — it lists every Page you manage.',
      check: 'check-pages',
    },
    {
      id: 'pages_messaging',
      view: 'inbox',
      title: 'Step 3: pages_messaging',
      text: 'Open Inbox → select a conversation → read messages → type a reply and press Send.',
      check: 'check-messaging',
    },
    {
      id: 'pages_read_engagement',
      view: 'engagement',
      title: 'Step 4: pages_read_engagement',
      text: 'Open Engagement → view posts with likes, comments, and shares for the selected Page.',
      check: 'check-engagement',
    },
    {
      id: 'pages_utility_messaging',
      view: 'utility',
      title: 'Step 5: pages_utility_messaging',
      text: 'Open Utility Messages → pick a customer → choose message type → send an order/shipping update.',
      check: 'check-utility',
    },
    {
      id: 'pages_manage_metadata',
      view: 'settings',
      title: 'Step 6: pages_manage_metadata',
      text: 'Open Settings → click "Subscribe Page to webhooks" → see green confirmation that the Page is connected for real-time messages.',
      check: 'check-metadata',
    },
  ];

  const PERMISSION_ANSWERS = {
    public_profile: `PageChat Hub uses public_profile solely to display the authenticated user's name and profile picture in the bottom-left sidebar of the dashboard immediately after Facebook Login. This allows Page managers and customer support agents to visually confirm they are signed in with the correct Facebook account before accessing their Page inbox. The profile data is rendered client-side only and is never stored on our servers, shared with third parties, or used for advertising or analytics purposes.`,

    pages_show_list: `PageChat Hub uses pages_show_list to retrieve the list of Facebook Pages that the authenticated user manages, and displays them in an "Active Page" dropdown selector in the dashboard sidebar. This is the essential first step in our onboarding flow — the user must select which Page's inbox and engagement data they want to work with. Without this permission, users who manage multiple Pages cannot navigate between them, and the entire platform becomes non-functional since all subsequent features (inbox, engagement, messaging) are scoped to the selected Page. Page names and IDs are used only to populate this selector and are not stored or shared.`,

    pages_messaging: `PageChat Hub uses pages_messaging to power its core feature: a real-time Messenger inbox for Facebook Page customer support. After selecting a Page, the user can view all active Messenger conversations with customers, open individual threads to read the full message history, and send direct replies to customers from within the dashboard — all without switching to Facebook. This permission is essential for businesses that rely on Messenger as a primary customer service channel. Messages are fetched from Meta's API and rendered in the browser session only. We do not store message content on our servers, we never initiate unsolicited messages, and we only send replies to existing user-initiated conversations where the customer has already contacted the Page.`,

    pages_read_engagement: `PageChat Hub uses pages_read_engagement to display post performance metrics for the selected Facebook Page in our Engagement screen. The dashboard fetches the Page's recent posts and shows each post's like count, comment count, and share count, along with aggregate totals at the top. This gives Page managers a quick overview of which content resonates with their audience and how active their community is. The data is displayed in read-only format for analytics purposes only. We do not modify posts, and this data is never used for advertising, retargeting, or shared with any third party.`,

    pages_utility_messaging: `PageChat Hub uses pages_utility_messaging to enable businesses to send one-to-one transactional notifications to customers who have already initiated contact with their Page on Messenger. In the Utility Messages screen, the user selects a customer from their existing inbox conversations, chooses an approved Meta message tag (Order/Shipping Update, Confirmed Event Update, or Account Update), composes a message such as an order confirmation or shipping alert, and sends it. All messages are strictly transactional in nature, sent only to customers who have previously messaged the Page, and comply fully with Meta's messaging tag policies. This feature is not used for marketing or promotional messaging.`,

    pages_manage_metadata: `PageChat Hub uses pages_manage_metadata to allow Page administrators to subscribe their Facebook Page to Messenger webhook events through our Settings screen. When the user clicks "Subscribe Page to webhooks," our platform registers the Page with Meta's webhook system to receive real-time push notifications for incoming messages, postbacks, and message echoes. This subscription enables our inbox to update in real time when new customer messages arrive, eliminating the need for manual page refreshes. The permission is used exclusively for webhook subscription management and no Page settings or metadata are modified for any other purpose.`,
  };

  let stepIndex = 0;

  function init() {
    buildModal();
    bindCopyButtons();
  }

  function buildModal() {
    if (document.getElementById('review-modal')) return;

    const html = `
      <div id="review-modal" class="review-modal hidden">
        <div class="review-modal-inner">
          <button type="button" class="review-close" id="review-close" aria-label="Close">×</button>
          <span class="review-badge">Meta App Review Guide</span>
          <h2 id="review-step-title"></h2>
          <p id="review-step-text"></p>
          <div class="review-progress"><span id="review-progress-label"></span></div>
          <div class="review-actions">
            <button type="button" class="btn-outline-sm" id="review-skip">Skip guide</button>
            <button type="button" class="btn-primary" id="review-next">Next step →</button>
          </div>
        </div>
      </div>
      <div id="review-banner" class="review-banner hidden">
        <span>📋 Meta reviewer? Open the <button type="button" id="review-open-banner" class="btn-link">permission walkthrough</button></span>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('review-close')?.addEventListener('click', closeGuide);
    document.getElementById('review-skip')?.addEventListener('click', closeGuide);
    document.getElementById('review-next')?.addEventListener('click', nextStep);
    document.getElementById('review-open-banner')?.addEventListener('click', () => openGuide(0));
  }

  function bindCopyButtons() {
    document.querySelectorAll('[data-copy-perm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const perm = btn.dataset.copyPerm;
        const text = PERMISSION_ANSWERS[perm] || '';
        navigator.clipboard?.writeText(text);
        if (typeof toast === 'function') toast('Copied: ' + perm);
      });
    });
  }

  function showBanner() {
    document.getElementById('review-banner')?.classList.remove('hidden');
  }

  function openGuide(start = 0) {
    stepIndex = start;
    document.getElementById('review-modal')?.classList.remove('hidden');
    renderStep();
  }

  function closeGuide() {
    document.getElementById('review-modal')?.classList.add('hidden');
    localStorage.setItem('pagechat_review_seen', '1');
  }

  function nextStep() {
    const step = STEPS[stepIndex];
    if (step.view && typeof switchView === 'function') {
      switchView(step.view);
    }
    stepIndex++;
    if (stepIndex >= STEPS.length) {
      closeGuide();
      if (typeof toast === 'function') toast('All 6 permissions demonstrated. Submit App Review in Meta Developer portal.');
      return;
    }
    renderStep();
  }

  function renderStep() {
    const step = STEPS[stepIndex];
    document.getElementById('review-step-title').textContent = step.title;
    document.getElementById('review-step-text').textContent = step.text;
    document.getElementById('review-progress-label').textContent =
      `Step ${stepIndex + 1} of ${STEPS.length}`;
    const btn = document.getElementById('review-next');
    if (btn) btn.textContent = stepIndex === STEPS.length - 1 ? 'Finish' : 'Next step →';
    if (step.view && typeof switchView === 'function') switchView(step.view);
  }

  function onLoginComplete() {
    markCheck('check-profile');
    markCheck('check-pages');
    showBanner();
    if (!localStorage.getItem('pagechat_review_seen')) {
      setTimeout(() => openGuide(0), 600);
    }
  }

  function markPermissionUsed(perm) {
    const map = {
      public_profile: 'check-profile',
      pages_show_list: 'check-pages',
      pages_messaging: 'check-messaging',
      pages_read_engagement: 'check-engagement',
      pages_utility_messaging: 'check-utility',
      pages_manage_metadata: 'check-metadata',
    };
    if (map[perm]) markCheck(map[perm]);
    if (typeof Readiness !== 'undefined') Readiness.markDemo(perm);
  }

  function markCheck(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('done');
      el.querySelector('.check-icon')?.replaceWith(document.createTextNode('✓'));
    }
  }

  function getSubmissionPack(origin) {
    return {
      appUrl: origin + '/',
      privacy: origin + '/privacy.html',
      terms: origin + '/terms.html',
      dataDeletion: origin + '/data-deletion.html',
      webhook: origin + '/webhook',
      testInstructions: buildTestInstructions(origin),
      permissions: PERMISSION_ANSWERS,
    };
  }

  function buildTestInstructions(origin) {
    return `PAGECHAT HUB — META APP REVIEW TEST INSTRUCTIONS
================================================

APP URL: ${origin}/

LOGIN:
1. Open the URL above.
2. Click "Connect with Facebook".
3. Log in with the test user credentials provided below.
4. Accept ALL requested permissions when prompted.

TEST USER CREDENTIALS (fill in before submit):
Email: _______________________
Password: _______________________

TEST PAGE NAME: _______________________

FEATURE TESTS (match screencast):

1) public_profile
   - After login, see user name + photo in bottom-left sidebar.

2) pages_show_list
   - See "Active Page" dropdown in sidebar with list of managed Pages.
   - Switch between Pages.

3) pages_messaging
   - Click Inbox in sidebar.
   - Prerequisite: Test user must have sent a message to the test Page on Messenger first.
   - Open a conversation, read messages, type a reply, click Send.

4) pages_read_engagement
   - Click Engagement in sidebar.
   - View posts with like count, comment count, and shares.

5) pages_utility_messaging
   - Click Utility Messages.
   - Select customer from dropdown (from inbox).
   - Choose "Order / shipping update", enter message, click Send.

6) pages_manage_metadata
   - Click Settings in sidebar.
   - Click "Subscribe Page to webhooks".
   - Confirm green status: Page subscribed to real-time webhooks.

WEBHOOK CALLBACK: ${origin}/webhook
Privacy Policy: ${origin}/privacy.html
Data Deletion: ${origin}/data-deletion.html`;
  }

  function renderSettingsBlocks(origin) {
    const pack = getSubmissionPack(origin);
    const permsHtml = Object.entries(pack.permissions)
      .map(
        ([perm, answer]) => `
        <div class="perm-answer-block">
          <div class="perm-answer-head">
            <code>${perm}</code>
            <button type="button" class="btn-outline-sm" data-copy-perm="${perm}">Copy answer</button>
          </div>
          <p class="perm-answer-text">${answer}</p>
        </div>`
      )
      .join('');

    const el = document.getElementById('permission-answers');
    if (el) el.innerHTML = permsHtml;
    bindCopyButtons();

    const notes = document.getElementById('review-notes');
    if (notes) notes.value = pack.testInstructions;

    const urls = document.getElementById('meta-urls');
    if (urls) {
      urls.innerHTML = `
        <li><strong>App URL:</strong> ${pack.appUrl}</li>
        <li><strong>Privacy:</strong> ${pack.privacy}</li>
        <li><strong>Data deletion:</strong> ${pack.dataDeletion}</li>
        <li><strong>Terms:</strong> ${pack.terms}</li>
        <li><strong>Webhook:</strong> ${pack.webhook}</li>`;
    }
  }

  return {
    init,
    onLoginComplete,
    markPermissionUsed,
    openGuide,
    renderSettingsBlocks,
    getSubmissionPack,
    PERMISSION_ANSWERS,
  };
})();
