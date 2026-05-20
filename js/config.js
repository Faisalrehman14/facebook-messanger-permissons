const FB_CONFIG = {
  appId: '',
  version: 'v21.0',
  scopes: [
    'public_profile',
    'pages_show_list',
    'pages_messaging',
    'pages_read_engagement',
    'pages_utility_messaging',
  ].join(','),
  storageKeys: {
    appId: 'pagechat_app_id',
    activePageId: 'pagechat_active_page',
    activeConvId: 'pagechat_active_conv',
  },
};
