# FB Messenger Demo — Meta App Review Website

Yeh website aapki **5 Facebook permissions** ke liye App Review demo ke taur par kaam karti hai:

| Permission | Demo |
|---|---|
| `public_profile` | User profile (name, photo) |
| `pages_show_list` | Managed Pages list |
| `pages_read_engagement` | Page posts + likes/comments |
| `pages_messaging` | Send Page Messenger message |
| `pages_utility_messaging` | Send utility/tag message |

---

## Quick Start (5 minute setup)

### 1. Website chalayein

```bash
cd "fb messanger demo website"
python3 -m http.server 8080
```

Browser: `http://localhost:8080`

> **Important:** Facebook Login localhost par kaam karta hai, lekin App Review ke liye **public HTTPS URL** chahiye (ngrok ya hosting use karein).

### 2. Meta Developer App banayein

1. [developers.facebook.com/apps](https://developers.facebook.com/apps/) → **Create App** → Type: **Business**
2. Products add karein: **Facebook Login** + **Messenger**
3. **Settings → Basic** se App ID copy karein
4. Website par **Setup** section mein App ID paste karein

### 3. Facebook Login configure karein

**Facebook Login → Settings:**

- Valid OAuth Redirect URIs: `http://localhost:8080/` (aur production URL)
- **Settings → Basic → App Domains:** `localhost` (dev) ya apna domain

**Messenger → Settings:**

- Apni Facebook **Page** connect karein

### 4. Permissions request karein

**App Review → Permissions and Features** — screenshot wali 5 permissions add karein (jo aapne already ki hain).

### 5. Test users add karein

**App Roles → Roles:** Apna Facebook account Admin/Developer banayein.

---

## App Review Submit kaise karein

### Zaroori cheezein

1. **Live demo URL** (HTTPS) — ngrok example:
   ```bash
   ngrok http 8080
   ```
2. **Privacy Policy URL** — `https://your-domain/privacy.html`
3. **2-5 min screencast** — har permission ka demo
4. **Test instructions** — website par "App Review" section se copy karein

### Screencast mein yeh dikhayen

1. Login with Facebook (sari permissions allow)
2. `public_profile` → profile dikhe
3. `pages_show_list` → Pages list load ho
4. `pages_read_engagement` → posts + engagement
5. `pages_messaging` → test user ko message bhejein
6. `pages_utility_messaging` → utility message bhejein

### PSID (Recipient ID) kaise milega

Test user ko apni **Facebook Page** par Messenger se message karein. Phir:

- Graph API Explorer: `GET /{page-id}/conversations`
- Ya Messenger Webhooks setup karein

---

## Public hosting (App Review ke liye)

Free options:
- **GitHub Pages** — repo push karein
- **Netlify / Vercel** — drag & drop folder
- **ngrok** — temporary HTTPS tunnel for testing

`privacy.html` aur `terms.html` mein apna **email** zaroor update karein before submission.

---

## Files

```
├── index.html          # Main demo app
├── privacy.html        # Privacy policy (Meta required)
├── terms.html          # Terms of service
├── css/style.css
├── js/config.js        # App ID + scopes
├── js/app.js           # Facebook SDK logic
└── README.md
```

---

## Common errors

| Error | Fix |
|---|---|
| "App ID not configured" | Setup section mein App ID save karein |
| "URL Blocked" | OAuth Redirect URI add karein |
| No pages listed | Page create karein + Messenger se connect |
| Message send fail | Test user ne Page ko pehle message kiya ho |
| Permission denied | Development mode — App Role wala account use karein |

---

**Note:** Permissions automatically approve nahi hoti — Meta **App Review** process se approve karti hai. Yeh website sirf demo + testing ke liye hai taake review easy ho.
