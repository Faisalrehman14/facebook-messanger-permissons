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

  /**
   * Load Page content — tries multiple Graph endpoints, returns debug log on failure
   */
  async function getPagePosts(pageId, pageToken, limit = 25) {
    const attempts = [
      {
        name: 'posts (basic)',
        path: `/${pageId}/posts?fields=id,message,created_time,permalink_url&limit=${limit}`,
      },
      {
        name: 'posts + engagement',
        path: `/${pageId}/posts?fields=id,message,created_time,permalink_url,likes.summary(true),comments.summary(true),shares&limit=${limit}`,
      },
      {
        name: 'feed',
        path: `/${pageId}/feed?fields=id,message,created_time,permalink_url,likes.summary(true),comments.summary(true)&limit=${limit}`,
      },
      {
        name: 'published_posts',
        path: `/${pageId}/published_posts?fields=id,message,created_time&limit=${limit}`,
      },
      {
        name: 'videos',
        path: `/${pageId}/videos?fields=id,title,description,created_time,permalink_url&limit=${limit}`,
      },
    ];

    const debug = [];

    for (const a of attempts) {
      try {
        const res = await pageGet(pageToken, a.path);
        const items = (res.data || []).map(normalizePostItem);
        if (items.length) {
          return { posts: items, source: a.name, debug: [...debug, `${a.name}: ✓ ${items.length} item(s)`] };
        }
        debug.push(`${a.name}: 0 results (API OK but empty)`);
      } catch (e) {
        debug.push(`${a.name}: ✗ ${e.message}`);
      }
    }

    const err = new Error(
      'Facebook returned no posts for this Page. See debug details below — usually pages_read_engagement is missing on login token.'
    );
    err.debug = debug;
    err.code = 'NO_POSTS';
    throw err;
  }

  function normalizePostItem(item) {
    return {
      id: item.id,
      message: item.message || item.title || item.description || '(Media post)',
      created_time: item.created_time,
      permalink_url: item.permalink_url,
      likes: item.likes,
      comments: item.comments,
      shares: item.shares,
    };
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
