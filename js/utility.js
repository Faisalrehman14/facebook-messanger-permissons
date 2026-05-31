const Utility = (function () {
  'use strict';

  async function send(page, psid, text, tag) {
    return GraphAPI.sendMessage(page.id, page.access_token, psid, text, {
      messaging_type: 'MESSAGE_TAG',
      tag,
    });
  }

  function showStatus(msg, ok) {
    const el = document.getElementById('utility-status');
    el.textContent = msg;
    el.className = 'status-msg ' + (ok ? 'ok' : 'err');
    el.classList.remove('hidden');
  }

  return { send, showStatus };
})();
