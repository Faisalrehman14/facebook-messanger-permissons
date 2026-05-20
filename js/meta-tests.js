/**
 * Run API calls so Meta App Review "Testing" turns green
 */
const MetaTests = (function () {
  'use strict';

  async function runAll(page, pagesList) {
    const log = document.getElementById('meta-test-log');
    const results = [];

    function line(msg, ok) {
      results.push({ msg, ok });
      if (log) {
        log.innerHTML += `<div class="${ok ? 'ok' : 'err'}">${msg}</div>`;
        log.scrollTop = log.scrollHeight;
      }
    }

    if (log) log.innerHTML = '<strong>Running Meta API tests…</strong><br/>';

    try {
      await GraphAPI.getMe();
      line('✓ public_profile — GET /me', true);
      AppReview.markPermissionUsed('public_profile');
    } catch (e) {
      line('✗ public_profile — ' + e.message, false);
    }

    try {
      await GraphAPI.getPages();
      line('✓ pages_show_list — GET /me/accounts', true);
      AppReview.markPermissionUsed('pages_show_list');
    } catch (e) {
      line('✗ pages_show_list — ' + e.message, false);
    }

    if (page) {
      try {
        await GraphAPI.getConversations(page.id, page.access_token);
        line('✓ pages_messaging — GET conversations', true);
      } catch (e) {
        line('✗ pages_messaging — ' + e.message, false);
      }

      try {
        await GraphAPI.getPagePosts(page.id, page.access_token, 3);
        line('✓ pages_read_engagement — GET posts', true);
      } catch (e) {
        line('✗ pages_read_engagement — ' + e.message, false);
      }

      try {
        await PageMeta.getSubscription(page.id, page.access_token);
        line('✓ pages_manage_metadata — GET subscribed_apps', true);
      } catch (e) {
        line('✗ pages_manage_metadata — ' + e.message, false);
      }

      const convs = await GraphAPI.getConversations(page.id, page.access_token).catch(() => []);
      const cust = convs[0]
        ? GraphAPI.extractCustomerFromConversation(convs[0], page.id)
        : null;
      if (cust?.id) {
        try {
          await GraphAPI.sendMessage(
            page.id,
            page.access_token,
            cust.id,
            'PageChat Hub — Meta API test (utility message).',
            { messaging_type: 'MESSAGE_TAG', tag: 'POST_PURCHASE_UPDATE' }
          );
          line('✓ pages_utility_messaging — POST utility message', true);
          AppReview.markPermissionUsed('pages_utility_messaging');
          Readiness.markDemo('pages_utility_messaging');
        } catch (e) {
          line('✗ pages_utility_messaging — ' + e.message, false);
        }
      } else {
        line('⚠ pages_utility_messaging — no customer in inbox. Ask someone to message your Page first.', false);
      }
    }

    line('<br/><strong>Done.</strong> Wait 5–30 min, refresh Meta → App Review → Testing.', true);
    if (typeof toast === 'function') toast('API tests finished — refresh Meta dashboard');

    return results;
  }

  return { runAll };
})();
