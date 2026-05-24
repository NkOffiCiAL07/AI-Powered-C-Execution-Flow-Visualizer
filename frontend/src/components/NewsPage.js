import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchNews, fetchComments, postComment } from '../services/api';
import '../styles/NewsPage.css';

const CATEGORIES = ['All', 'Agentic AI', 'Machine Learning', 'Companies', 'Coding'];

const CATEGORY_META = {
  'Agentic AI':      { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', icon: 'smart_toy' },
  'Machine Learning':{ color: '#0891B2', bg: 'rgba(8,145,178,0.10)',  icon: 'model_training' },
  'Companies':       { color: '#C96A48', bg: 'rgba(201,106,72,0.10)', icon: 'business' },
  'Coding':          { color: '#059669', bg: 'rgba(5,150,105,0.10)',  icon: 'code' },
};

const SOURCE_LABEL = {
  Research:   { icon: 'science',     label: 'Research'    },
  Industry:   { icon: 'trending_up', label: 'Industry'    },
  'Open Source': { icon: 'hub',      label: 'Open Source' },
  Community:  { icon: 'groups',      label: 'Community'   },
};

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts * 1000) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Discussion Panel ──────────────────────────────────────────────────────────
function DiscussionPanel({ articleId, user }) {
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [posting, setPosting]     = useState(false);
  const [error, setError]         = useState(null);
  const bottomRef                 = useRef(null);

  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    setComments([]);
    const ctrl = new AbortController();
    fetchComments(articleId, ctrl.signal)
      .then(d => setComments(d.comments || []))
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [articleId]);

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const { comment } = await postComment(articleId, text.trim());
      setComments(prev => [...prev, comment]);
      setText('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="news-discussion">
      <div className="news-disc-header">
        <span className="material-symbols-outlined">forum</span>
        Discussion
        <span className="news-disc-count">{comments.length}</span>
      </div>

      {error && <div className="news-disc-error">{error}</div>}

      <div className="news-disc-list">
        {loading ? (
          <div className="news-disc-loading">
            <div className="news-spinner" />
          </div>
        ) : comments.length === 0 ? (
          <div className="news-disc-empty">
            <span className="material-symbols-outlined">chat_bubble_outline</span>
            Be the first to comment
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="news-comment">
              <div className="news-comment-avatar">
                {c.user_avatar
                  ? <img src={c.user_avatar} alt="" referrerPolicy="no-referrer" />
                  : <span className="material-symbols-outlined">person</span>
                }
              </div>
              <div className="news-comment-body">
                <div className="news-comment-meta">
                  <span className="news-comment-name">{c.user_name}</span>
                  <span className="news-comment-time">{formatRelative(c.created_at)}</span>
                </div>
                <p className="news-comment-text">{c.text}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="news-disc-compose">
        <div className="news-compose-avatar">
          {user?.avatar
            ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" />
            : <span className="material-symbols-outlined">person</span>
          }
        </div>
        <div className="news-compose-input-wrap">
          <textarea
            className="news-compose-input"
            placeholder="Share your thoughts…"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={1}
            maxLength={1000}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(); }}
          />
          <div className="news-compose-actions">
            <button
              className="news-compose-btn"
              onClick={handlePost}
              disabled={!text.trim() || posting}
              title="Post comment (⌘↵)"
            >
              {posting
                ? <div className="news-spinner-sm" />
                : <span className="material-symbols-outlined">send</span>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Article Detail Panel ──────────────────────────────────────────────────────
function ArticlePanel({ article, user, onClose }) {
  const meta = CATEGORY_META[article.category] || CATEGORY_META['Coding'];
  const src  = SOURCE_LABEL[article.source_type] || SOURCE_LABEL['Industry'];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="news-detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="news-detail-panel news-panel-enter">

        {/* ── Topbar ── */}
        <div className="news-detail-topbar">
          <button className="news-back-btn" onClick={onClose}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <span className="news-category-badge" style={{ color: meta.color, background: meta.bg }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{meta.icon}</span>
            {article.category}
          </span>
        </div>

        {/* ── Article body (scrollable) ── */}
        <div className="news-detail-scroll">
          <div className="news-detail-content">
            <div className="news-detail-source-row">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-muted)' }}>{src.icon}</span>
              <span className="news-detail-source">{src.label}</span>
              <span className="news-detail-dot">·</span>
              <span className="news-detail-read">{article.read_minutes} min read</span>
            </div>

            <h2 className="news-detail-title">{article.title}</h2>
            <p className="news-detail-summary">{article.summary}</p>

            <div className="news-detail-keypoints">
              <div className="news-keypoints-label">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>lightbulb</span>
                Key Takeaways
              </div>
              <ul className="news-keypoints-list">
                {article.key_points.map((pt, i) => (
                  <li key={i} className="news-keypoint-item">
                    <span className="news-keypoint-dot" style={{ background: meta.color }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Discussion (pinned to bottom) ── */}
        <div className="news-detail-discussion-pane">
          <DiscussionPanel articleId={article.id} user={user} />
        </div>

      </div>
    </div>
  );
}

// ── News Card ─────────────────────────────────────────────────────────────────
function NewsCard({ article, commentCount, onClick }) {
  const meta = CATEGORY_META[article.category] || CATEGORY_META['Coding'];
  const src  = SOURCE_LABEL[article.source_type] || SOURCE_LABEL['Industry'];

  return (
    <button className="news-card" onClick={onClick}>
      <div className="news-card-top">
        <span className="news-category-badge" style={{ color: meta.color, background: meta.bg }}>
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{meta.icon}</span>
          {article.category}
        </span>
        <span className="news-source-chip">
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{src.icon}</span>
          {src.label}
        </span>
      </div>

      <h3 className="news-card-title">{article.title}</h3>
      <p className="news-card-summary">{article.summary}</p>

      <ul className="news-card-points">
        {article.key_points.slice(0, 2).map((pt, i) => (
          <li key={i}>
            <span className="news-card-point-dot" style={{ background: meta.color }} />
            {pt}
          </li>
        ))}
      </ul>

      <div className="news-card-footer">
        <span className="news-card-read">
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
          {article.read_minutes} min
        </span>
        <span className="news-card-comments">
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>chat_bubble_outline</span>
          {commentCount ?? 0}
        </span>
      </div>
    </button>
  );
}

// ── Main NewsPage ─────────────────────────────────────────────────────────────
export default function NewsPage({ user }) {
  const [news, setNews]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [category, setCategory]       = useState('All');
  const [selected, setSelected]       = useState(null);
  const [commentCounts, setCommentCounts] = useState({});

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNews();
      setNews(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  // Load comment counts for visible articles
  useEffect(() => {
    if (!news?.articles) return;
    news.articles.forEach(a => {
      fetchComments(a.id)
        .then(d => setCommentCounts(prev => ({ ...prev, [a.id]: d.comments?.length ?? 0 })))
        .catch(() => {});
    });
  }, [news]);

  const filtered = news?.articles?.filter(
    a => category === 'All' || a.category === category
  ) ?? [];

  if (loading) {
    return (
      <div className="news-page-loading">
        <div className="news-loading-inner">
          <div className="news-spinner-lg" />
          <div className="news-loading-text">
            <strong>Generating weekly digest…</strong>
            <span>Traceon AI is curating your tech news</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-page-error">
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--accent-red)' }}>wifi_off</span>
        <h3>Could not load news</h3>
        <p>{error}</p>
        <button className="news-retry-btn" onClick={() => loadNews()}>
          <span className="material-symbols-outlined">refresh</span>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="news-page">
      {/* ── Header ── */}
      <div className="news-page-header">
        <div className="news-header-left">
          <h1 className="news-page-title">Daily Tech Digest</h1>
          <div className="news-page-meta">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>
            Updated {formatDate(news?.generated_at)}
            <span className="news-meta-sep">·</span>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
            Next refresh {formatDate(news?.next_refresh)}
          </div>
        </div>
      </div>

      {/* ── Category filter ── */}
      <div className="news-filter-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`news-filter-tab ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
            style={category === cat && cat !== 'All'
              ? { color: CATEGORY_META[cat]?.color, borderColor: CATEGORY_META[cat]?.color, background: CATEGORY_META[cat]?.bg }
              : {}}
          >
            {cat !== 'All' && (
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{CATEGORY_META[cat]?.icon}</span>
            )}
            {cat}
            <span className="news-filter-count">
              {cat === 'All'
                ? news?.articles?.length ?? 0
                : news?.articles?.filter(a => a.category === cat).length ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="news-empty">
          <span className="material-symbols-outlined">article</span>
          No articles in this category
        </div>
      ) : (
        <div className="news-grid">
          {filtered.map(article => (
            <NewsCard
              key={article.id}
              article={article}
              commentCount={commentCounts[article.id]}
              onClick={() => setSelected(article)}
            />
          ))}
        </div>
      )}

      {/* ── Detail panel ── */}
      {selected && (
        <ArticlePanel
          article={selected}
          user={user}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
