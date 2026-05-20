/**
 * Facebook App Configuration
 * ─────────────────────────
 * 1. developers.facebook.com → Your App → Settings → Basic
 * 2. Copy "App ID" and paste below
 * 3. Add this site's URL in App Domains + Valid OAuth Redirect URIs
 */
const FB_CONFIG = {
  appId: '', // ← YOUR APP ID HERE (e.g. '1234567890123456')

  // All 5 permissions from your App Review screenshot
  scopes: [
    'public_profile',
    'pages_show_list',
    'pages_messaging',
    'pages_read_engagement',
    'pages_utility_messaging',
  ].join(','),

  version: 'v21.0',
};
