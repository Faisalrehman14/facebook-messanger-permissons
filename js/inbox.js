const Inbox = (function () {
  'use strict';

  let conversations = [];
  let activeConv = null;
  let activeCustomer = null;
  let pollTimer = null;

  function renderList(convs, pageId, onSelect) {
    const el = document.getElementById('conv-list');
    if (!convs.length) {
      el.innerHTML = '<p class="empty-state">No conversations yet. Ask a test user to message your Page on Messenger.</p>';
      return;
    }

    el.innerHTML = convs
      .map((c) => {
        const customer = GraphAPI.extractCustomerFromConversation(c, pageId);
        const name = customer?.name || customer?.email || 'Customer';
        const time = c.updated_time ? formatTime(c.updated_time) : '';
        const unread = c.unread_count > 0 ? `<span class="unread-dot"></span>` : '';
        const active = activeConv?.id === c.id ? ' active' : '';
        return `
          <button type="button" class="conv-item${active}" data-id="${c.id}" data-psid="${customer?.id || ''}">
            <div class="conv-avatar">${name.charAt(0).toUpperCase()}</div>
            <div class="conv-body">
              <div class="conv-top"><strong>${escape(name)}</strong><span>${time}</span></div>
              <div class="conv-snippet">${escape(c.snippet || '')}${unread}</div>
            </div>
          </button>`;
      })
      .join('');

    el.querySelectorAll('.conv-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const conv = convs.find((x) => x.id === btn.dataset.id);
        onSelect(conv, btn.dataset.psid);
      });
    });
  }

  function renderMessages(messages, pageId) {
    const box = document.getElementById('messages');
    box.innerHTML = messages
      .map((m) => {
        const fromPage = m.from?.id === pageId;
        const cls = fromPage ? 'msg out' : 'msg in';
        const time = m.created_time ? formatTime(m.created_time) : '';
        return `<div class="${cls}"><div class="bubble">${escape(m.message || '[attachment]')}</div><time>${time}</time></div>`;
      })
      .join('');
    box.scrollTop = box.scrollHeight;
  }

  function showChatHeader(customer, psid) {
    document.getElementById('chat-header').classList.remove('hidden');
    document.getElementById('composer-form').classList.remove('hidden');
    document.getElementById('chat-empty').classList.add('hidden');
    document.getElementById('chat-name').textContent = customer?.name || 'Customer';
    document.getElementById('chat-psid').textContent = psid ? `ID: ${psid}` : '';
    document.getElementById('chat-avatar').src = '';
    document.getElementById('chat-avatar').alt = customer?.name || '';
  }

  async function load(page, onCustomerList) {
    conversations = await GraphAPI.getConversations(page.id, page.access_token);
    let totalUnread = 0;
    conversations.forEach((c) => {
      totalUnread += c.unread_count || 0;
    });
    updateUnreadBadge(totalUnread);
    renderList(conversations, page.id, (conv, psid) => selectConversation(page, conv, psid));
    populateUtilityRecipients(conversations, page.id, onCustomerList);

    const savedConv = localStorage.getItem(FB_CONFIG.storageKeys.activeConvId);
    if (savedConv) {
      const conv = conversations.find((c) => c.id === savedConv);
      if (conv) {
        const cust = GraphAPI.extractCustomerFromConversation(conv, page.id);
        await selectConversation(page, conv, cust?.id);
      }
    }
  }

  async function selectConversation(page, conv, psid) {
    activeConv = conv;
    activeCustomer = GraphAPI.extractCustomerFromConversation(conv, page.id);
    const customerPsid = psid || activeCustomer?.id;
    localStorage.setItem(FB_CONFIG.storageKeys.activeConvId, conv.id);

    document.querySelectorAll('.conv-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.id === conv.id);
    });

    showChatHeader(activeCustomer, customerPsid);
    document.getElementById('reply-input').dataset.psid = customerPsid;

    const msgs = await GraphAPI.getConversationMessages(conv.id, page.access_token);
    renderMessages(msgs, page.id);
  }

  async function sendReply(page, text) {
    const psid = document.getElementById('reply-input').dataset.psid;
    if (!psid || !text.trim()) throw new Error('Select a conversation first');
    await GraphAPI.sendMessage(page.id, page.access_token, psid, text.trim(), {
      messaging_type: 'RESPONSE',
    });
    if (activeConv) {
      const msgs = await GraphAPI.getConversationMessages(activeConv.id, page.access_token);
      renderMessages(msgs, page.id);
    }
  }

  function populateUtilityRecipients(convs, pageId, callback) {
    const sel = document.getElementById('utility-recipient');
    const prev = sel.value;
    sel.innerHTML = '<option value="">— Select customer —</option>';
    const seen = new Set();
    convs.forEach((c) => {
      const cust = GraphAPI.extractCustomerFromConversation(c, pageId);
      if (!cust?.id || seen.has(cust.id)) return;
      seen.add(cust.id);
      const opt = document.createElement('option');
      opt.value = cust.id;
      opt.textContent = cust.name || cust.email || cust.id;
      opt.dataset.name = cust.name || '';
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
    if (callback) callback(seen);
  }

  function updateUnreadBadge(n) {
    const b = document.getElementById('unread-badge');
    if (n > 0) {
      b.textContent = n > 99 ? '99+' : n;
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  }

  function startPolling(page, intervalMs = 30000) {
    stopPolling();
    pollTimer = setInterval(() => load(page), intervalMs);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  function getConversations() {
    return conversations;
  }

  function formatTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  return {
    load,
    sendReply,
    startPolling,
    stopPolling,
    getConversations,
  };
})();
