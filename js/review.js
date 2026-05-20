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
    public_profile: `PageChat Hub uses public_profile only to display the signed-in user's name and profile picture in the dashboard sidebar after Facebook Login, so Page managers can confirm they are using the correct account. We do not use this data for advertising or sharing with third parties.`,

    pages_show_list: `PageChat Hub uses pages_show_list to display a dropdown of Facebook Pages the user manages. The user selects which Page inbox and engagement data to view. Without this permission, managers with multiple Pages cannot switch between them.`,

    pages_messaging: `PageChat Hub uses pages_messaging to provide a unified Messenger inbox for Facebook Page customer support. Users read conversations between their Page and customers, view message history, and send replies from our Inbox screen. This is the core feature of our app for businesses responding to customer inquiries on Messenger.`,

    pages_read_engagement: `PageChat Hub uses pages_read_engagement to show Page owners how their posts perform. The Engagement screen displays recent posts with like counts, comment counts, and shares so businesses can understand customer interest and improve their content.`,

    pages_utility_messaging: `PageChat Hub uses pages_utility_messaging to let businesses send transactional messages customers expect, such as order confirmations, shipping updates, and appointment reminders. Users select a customer who has already messaged the Page, choose an approved message tag, and send a one-to-one utility update from the Utility Messages screen.`,

    pages_manage_metadata: `PageChat Hub uses pages_manage_metadata to subscribe the user's Facebook Page to Messenger webhooks for our app. In Settings, the user clicks "Subscribe Page to webhooks" so PageChat Hub receives real-time notifications when customers send new messages. This allows timely inbox updates without manual refresh and is required for reliable customer support delivery.`,
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
      if (typeof toast === 'function') toast('All 5 permissions demonstrated. Submit App Review in Meta Developer portal.');
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
