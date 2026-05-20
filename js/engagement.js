const Engagement = (function () {
  'use strict';

  async function load(page) {
    const posts = await GraphAPI.getPagePosts(page.id, page.access_token);
    renderStats(posts);
    renderPosts(posts);
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

  function renderPosts(posts) {
    const feed = document.getElementById('posts-feed');
    if (!posts.length) {
      feed.innerHTML = `
        <div class="empty-inbox-guide">
          <h4>⚠️ No posts on this Page</h4>
          <p>Meta reviewers need to see engagement data. Create at least one post on Facebook, then Refresh.</p>
        </div>`;
      if (typeof Readiness !== 'undefined') Readiness.setPosts(false);
      return;
    }
    if (typeof Readiness !== 'undefined') Readiness.setPosts(true);

    feed.innerHTML = posts
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
