/**
 * Production: set App ID in Railway → FACEBOOK_APP_ID (auto via /js/env.js)
 * Or paste your App ID below (replace empty string).
 */
const FB_CONFIG = {
  appId: (typeof window !== 'undefined' && window.__PAGECHAT__?.appId) || '',
  version: 'v21.0',
  scopes: [
    'public_profile',
    'pages_show_list',
    'pages_messaging',
    'pages_read_engagement',
    'pages_utility_messaging',
    'pages_manage_metadata',
  ].join(','),
  webhookFields: ['messages', 'messaging_postbacks', 'message_echoes'],
  storageKeys: {
    appId: 'pagechat_app_id',
    activePageId: 'pagechat_active_page',
    activeConvId: 'pagechat_active_conv',
  },
};
