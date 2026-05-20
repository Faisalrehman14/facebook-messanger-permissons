# PageChat Hub

**Real Facebook Page Messenger manager** — not a permission demo. Businesses use it to handle customer inbox, reply on Messenger, track post engagement, and send utility updates.

Built for **Meta App Review** with clear, production use cases for all 5 permissions.

| Permission | Real feature in app |
|---|---|
| `public_profile` | Sign-in & user identity in sidebar |
| `pages_show_list` | Page picker — switch between managed Pages |
| `pages_messaging` | **Inbox** — read threads & reply to customers |
| `pages_read_engagement` | **Engagement** — posts, likes, comments, shares |
| `pages_utility_messaging` | **Utility Messages** — order/shipping/account alerts |

---

## Run locally

```bash
# Frontend
python3 -m http.server 8080
# → http://localhost:8080

# Webhook server (optional, real-time messages)
cd server && cp .env.example .env
npm install && npm start
# → http://localhost:3000/webhook
```

1. [Meta Developers](https://developers.facebook.com/apps/) → create **Business** app  
2. Add **Facebook Login** + **Messenger**  
3. Paste **App ID** on login screen  
4. OAuth redirect: `http://localhost:8080/`  
5. Connect your **Facebook Page** (Messenger settings)  
6. Add your account as **Admin/Developer** in App Roles  

---

## Meta App Review

### What to tell Meta

> PageChat Hub is a customer support inbox for Facebook Page owners. Users sign in, select their Page, read Messenger conversations, reply to customers, view post engagement metrics, and send transactional utility messages (order updates).

### Test flow for reviewers

1. Login with Facebook  
2. Select Page → **Inbox** loads real conversations  
3. Open thread → send reply (`pages_messaging`)  
4. **Engagement** → see posts & metrics (`pages_read_engagement`)  
5. **Utility Messages** → send order update (`pages_utility_messaging`)  

**Important:** A test user must message your Page on Messenger before inbox/reply works.

### URLs for submission

| Item | URL |
|---|---|
| App | `https://faisalrehman14.github.io/facebook-messanger-permissons/` |
| Privacy | `.../privacy.html` |
| Terms | `.../terms.html` |

Copy full test notes from **Settings** inside the app.

### Webhook (recommended for approval)

1. Deploy `server/` to Render/Railway/Fly.io  
2. Meta → Messenger → Webhooks  
3. Callback: `https://your-server.com/webhook`  
4. Verify token = `VERIFY_TOKEN` in `.env`  
5. Subscribe: `messages`, `messaging_postbacks`  

---

## Project structure

```
├── index.html          # Landing + full app UI
├── css/style.css
├── js/
│   ├── config.js
│   ├── api.js          # Graph API
│   ├── auth.js
│   ├── inbox.js        # Real Messenger inbox
│   ├── engagement.js
│   ├── utility.js
│   └── app.js
├── server/             # Webhook for live messages
├── privacy.html
└── terms.html
```

---

## Deploy

- **GitHub Pages:** already on `main` — enable Pages in repo settings  
- **Webhook:** deploy `server/` separately (needs HTTPS)  

Update email in `privacy.html` / `terms.html` before final App Review submit.
