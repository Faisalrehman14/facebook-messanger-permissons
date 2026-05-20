/**
 * Graph API wrapper for PageChat Hub
 */
const GraphAPI = (function () {
  'use strict';

  function userGet(path) {
    return new Promise((resolve, reject) => {
      FB.api(path, (res) => {
        if (res && !res.error) resolve(res);
        else reject(new Error(res?.error?.message || 'Request failed'));
      });
    });
  }

  function pageGet(pageToken, path) {
    return new Promise((resolve, reject) => {
      FB.api(path, { access_token: pageToken }, (res) => {
        if (res && !res.error) resolve(res);
        else reject(new Error(res?.error?.message || 'Request failed'));
      });
    });
  }

  function pagePost(pageToken, path, body) {
    return new Promise((resolve, reject) => {
      FB.api(path, 'POST', { ...body, access_token: pageToken }, (res) => {
        if (res && !res.error) resolve(res);
        else reject(new Error(res?.error?.message || JSON.stringify(res?.error)));
      });
    });
  }

  async function getMe() {
    return userGet('/me?fields=id,name,picture.type(large)');
  }

  async function getPages() {
    const res = await userGet('/me/accounts?fields=id,name,picture,access_token,category,unread_message_count');
    return res.data || [];
  }

  async function getConversations(pageId, pageToken) {
    const fields = [
      'id',
      'updated_time',
      'snippet',
      'unread_count',
      'message_count',
      'participants',
    ].join(',');
    const res = await pageGet(
      pageToken,
      `/${pageId}/conversations?fields=${fields}&limit=50`
    );
    return res.data || [];
  }

  async function getConversationMessages(conversationId, pageToken) {
    const res = await pageGet(
      pageToken,
      `/${conversationId}?fields=messages.limit(50){id,message,from,created_time}`
    );
    return (res.messages?.data || []).reverse();
  }

  async function sendMessage(pageId, pageToken, recipientPsid, text, options = {}) {
    const body = {
      recipient: { id: recipientPsid },
      message: { text },
      ...options,
    };
    return pagePost(pageToken, `/${pageId}/messages`, body);
  }

  async function getPagePosts(pageId, pageToken, limit = 15) {
    const fields = 'id,message,created_time,permalink_url,likes.summary(true),comments.summary(true),shares';
    const res = await pageGet(
      pageToken,
      `/${pageId}/posts?fields=${fields}&limit=${limit}`
    );
    return res.data || [];
  }

  function extractCustomerFromConversation(conv, pageId) {
    const parts = conv.participants?.data || [];
    const customer = parts.find((p) => p.id !== pageId);
    return customer || parts[0] || null;
  }

  return {
    getMe,
    getPages,
    getConversations,
    getConversationMessages,
    sendMessage,
    getPagePosts,
    extractCustomerFromConversation,
    pageGet,
    pagePost,
  };
})();
