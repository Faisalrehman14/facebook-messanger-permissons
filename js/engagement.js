const Engagement = (function () {
  'use strict';

  async function load(page) {
    const feed = document.getElementById('posts-feed');
    const stats = document.getElementById('engagement-stats');
    if (feed) feed.innerHTML = '<p class="empty-state">Loading posts from Facebook…</p>';

    try {
      const result = await GraphAPI.getPagePosts(page.id, page.access_token);
      renderStats(result.posts);
      renderPosts(result.posts, result.source, result.debug);
      return { ok: true };
    } catch (e) {
      if (stats) stats.innerHTML = '';
      if (e.code === 'NO_POSTS' && e.debug) {
        showNoPostsDebug(page, e.debug);
      } else {
        showPermissionError(e.message);
      }
      return { ok: false, error: e.message };
    }
  }

  function showNoPostsDebug(page, debugLines) {
    const feed = document.getElementById('posts-feed');
    if (feed) {
      feed.innerHTML = `
        <div class="empty-inbox-guide">
          <h4>⚠️ Facebook API: 0 posts returned</h4>
          <p>Page: <strong>${escape(page.name)}</strong> (ID: ${page.id})</p>
          <p>Posts Facebook app par dikh sakti hain lekin API ne koi post nahi di. Usually <code>pages_read_engagement</code> allow nahi ya post type alag hai (Reel/Story).</p>
          <p><strong>API debug:</strong></p>
          <pre class="api-debug">${debugLines.map(escape).join('\n')}</pre>
          <p><strong>Fix:</strong></p>
          <ol>
            <li><strong>Sign out</strong> → Connect with Facebook → <strong>Allow ALL</strong> permissions</li>
            <li>Meta App → Permissions → <code>pages_read_engagement</code> added in Messenger use case</li>
            <li>Facebook Page par ek normal <strong>text/photo post</strong> karein (Reel/Story only kabhi empty hota)</li>
            <li>Graph API Explorer: <code>GET ${page.id}/posts?fields=id,message</code> with Page token</li>
          </ol>
          <button type="button" class="btn-primary" id="btn-retry-engagement">Retry</button>
        </div>`;
      document.getElementById('btn-retry-engagement')?.addEventListener('click', () => {
        if (typeof refreshEngagement === 'function') refreshEngagement();
      });
    }
    if (typeof Readiness !== 'undefined') Readiness.setPosts(false);
  }

  function showPermissionError(msg) {
    const feed = document.getElementById('posts-feed');
    const stats = document.getElementById('engagement-stats');
    if (stats) stats.innerHTML = '';
    if (feed) {
      feed.innerHTML = `
        <div class="empty-inbox-guide">
          <h4>⚠️ Permission error</h4>
          <p>${escape(msg)}</p>
          <p><strong>Fix:</strong> Sign out → login again → Allow <code>pages_read_engagement</code></p>
        </div>`;
    }
    if (typeof Readiness !== 'undefined') Readiness.setPosts(false);
  }

  function renderStats(posts) {
    let likes = 0;
    let comments = 0;
    let shares = 0;
    posts.forEach((p) => {
      likes += p.likes?.summary?.total_count || 0;
      comments += p.comments?.summary?.total_count || 0;
      shares += p.shares?.count || 0;
    });
    const el = document.getElementById('engagement-stats');
    el.innerHTML = `
      <div class="stat-card"><span class="stat-val">${posts.length}</span><span class="stat-label">Recent posts</span></div>
      <div class="stat-card"><span class="stat-val">${likes}</span><span class="stat-label">Total likes</span></div>
      <div class="stat-card"><span class="stat-val">${comments}</span><span class="stat-label">Total comments</span></div>
      <div class="stat-card"><span class="stat-val">${shares}</span><span class="stat-label">Shares</span></div>`;
  }

  function renderPosts(posts, source, debug) {
    const feed = document.getElementById('posts-feed');
    if (typeof Readiness !== 'undefined') {
      Readiness.setPosts(true);
      Readiness.markDemo('pages_read_engagement');
    }

    const srcNote = source ? `<p class="meta-muted">Loaded via: ${escape(source)}</p>` : '';
    feed.innerHTML =
      srcNote +
      posts
        .map((p) => {
          const likes = p.likes?.summary?.total_count ?? 0;
          const comments = p.comments?.summary?.total_count ?? 0;
          const shares = p.shares?.count ?? 0;
          const date = p.created_time ? new Date(p.created_time).toLocaleString() : '';
          const link = p.permalink_url
            ? `<a href="${p.permalink_url}" target="_blank" rel="noopener">View on Facebook</a>`
            : '';
          return `
          <article class="post-card">
            <p class="post-text">${escape(p.message || '(Media post)')}</p>
            <div class="post-metrics">
              <span>❤️ ${likes}</span>
              <span>💬 ${comments}</span>
              <span>↗️ ${shares}</span>
            </div>
            <footer class="post-footer"><time>${date}</time> ${link}</footer>
          </article>`;
        })
        .join('');
    if (typeof AppReview !== 'undefined') AppReview.markPermissionUsed('pages_read_engagement');
  }

  function escape(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  return { load };
})();
