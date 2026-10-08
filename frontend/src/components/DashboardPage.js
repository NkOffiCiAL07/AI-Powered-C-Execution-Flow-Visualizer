import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NewProjectModal from './NewProjectModal';
import NewsPage from './NewsPage';
import { fetchProjects, deleteProject, fetchFiles } from '../services/api';
import { useTheme } from '../theme';
import { EmptyState, Skeleton } from './ui';
import '../styles/DashboardPage.css';

// ── Activity helpers ──────────────────────────────────────────────────────────

const ACTIVITY_KEY = 'traceon_activity';

function getStoredActivity() {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}'); }
  catch { return {}; }
}

function recordActivity(count = 1) {
  const today = new Date().toISOString().split('T')[0];
  const sessionKey = `traceon_sess_${today}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, '1');
  const stored = getStoredActivity();
  stored[today] = (stored[today] || 0) + count;
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(stored)); } catch {}
}

function recordProjectOpen() {
  const today = new Date().toISOString().split('T')[0];
  const stored = getStoredActivity();
  stored[today] = (stored[today] || 0) + 1;
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(stored)); } catch {}
}

function buildActivityMap(projects) {
  const map = { ...getStoredActivity() };
  projects.forEach(p => {
    [p.created_at, p.last_accessed].forEach(iso => {
      if (!iso) return;
      const d = new Date(iso).toISOString().split('T')[0];
      map[d] = (map[d] || 0) + 1;
    });
  });
  return map;
}

const WEEKS = 10;

function buildGrid() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - dayOfWeek - (WEEKS - 1) * 7);
  return Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      return date;
    })
  );
}

function intensityLevel(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}

const DAY_LABELS = ['M', '', 'W', '', 'F', '', ''];

const LANG_LABELS = { cpp: 'C++', c: 'C', python: 'Python', java: 'Java' };
const LANG_COLORS = { cpp: '#D97757', c: '#4ade80', python: '#60a5fa', java: '#f59e0b' };
const LANG_ICONS  = { cpp: 'data_object', c: 'terminal', python: 'integration_instructions', java: 'code' };

function LangDonut({ counts, total }) {
  const R = 22, CX = 32, CY = 32;
  const circumference = 2 * Math.PI * R;
  let cumulativeDash = 0;
  const slices = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([lang, count]) => {
      const dash = (count / total) * circumference;
      const offset = circumference * 0.25 - cumulativeDash;
      cumulativeDash += dash;
      return { lang, count, dash, offset };
    });
  if (!total) return <div className="donut-empty">No data</div>;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="lang-donut">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="9" />
      {slices.map(({ lang, dash, offset }) => (
        <circle key={lang} cx={CX} cy={CY} r={R} fill="none"
          stroke={LANG_COLORS[lang] || '#888'}
          strokeWidth="9"
          strokeDasharray={`${dash.toFixed(2)} ${circumference.toFixed(2)}`}
          strokeDashoffset={offset.toFixed(2)}
        />
      ))}
    </svg>
  );
}

const THEME_OPTIONS = [
  { value: 'light',    label: 'Light',    swatch: '#4F46E5' },
  { value: 'dark',     label: 'Dark',     swatch: '#6366F1' },
  { value: 'ocean',    label: 'Ocean',    swatch: '#58A6FF' },
  { value: 'forest',   label: 'Forest',   swatch: '#57C87A' },
  { value: 'midnight', label: 'Midnight', swatch: '#A855F7' },
];

const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'N'],     desc: 'New project' },
  { keys: ['⌘', 'K'],     desc: 'Command palette' },
  { keys: ['⌘', '/'],     desc: 'Toggle comment' },
  { keys: ['⌘', 'Enter'], desc: 'Run code' },
  { keys: ['F5'],          desc: 'Step through execution' },
  { keys: ['Esc'],         desc: 'Close modal / cancel' },
];

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const DashboardPage = ({ user, onLogout, onOpenProject, onOpenPlayground, onSwitchView, onBack }) => {
  const { theme, setTheme } = useTheme();
  const [activeNav, setActiveNav]       = useState('projects');
  const [projects, setProjects]         = useState([]);
  const [loadingProjects, setLoading]   = useState(true);
  const [fetchError, setFetchError]     = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [openingId, setOpeningId]       = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [langFilter, setLangFilter]     = useState('all');
  const [sortBy, setSortBy]             = useState('accessed');
  const [defaultLang, setDefaultLang]   = useState(() => localStorage.getItem('traceon_default_lang') || 'cpp');
  const [tabSize, setTabSize]           = useState(() => parseInt(localStorage.getItem('traceon_tab_size') || '4'));

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = useMemo(() => {
    const name = user?.name || '';
    return name.split(' ')[0] || 'there';
  }, [user]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchProjects();
      setProjects(data.projects || []);
      recordActivity();
    } catch (err) {
      if (err.name !== 'AbortError') setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeNav === 'projects') loadProjects();
  }, [activeNav, loadProjects]);

  const activityMap = useMemo(() => buildActivityMap(projects), [projects]);
  const heatmapGrid = useMemo(() => buildGrid(), []);

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (true) {
      const iso = d.toISOString().split('T')[0];
      if (!activityMap[iso]) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [activityMap]);

  const langCounts = useMemo(() => {
    const c = {};
    projects.forEach(p => { c[p.language] = (c[p.language] || 0) + 1; });
    return c;
  }, [projects]);

  const totalFiles = useMemo(() =>
    projects.reduce((sum, p) => sum + (p.file_count || 0), 0), [projects]);

  const lastActiveStr = useMemo(() => {
    const best = projects.reduce((t, p) => {
      const v = new Date(p.last_accessed || p.created_at).getTime();
      return v > t ? v : t;
    }, 0);
    return best ? relativeTime(new Date(best).toISOString()) : '—';
  }, [projects]);

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Permanently delete this project? This cannot be undone.')) return;
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      alert(err.message || 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenProject = async (project) => {
    setOpeningId(project.id);
    recordProjectOpen();
    try {
      const data = await fetchFiles(project.id);
      const files = data.files || [];
      onOpenProject({ project, files, activeFileId: files[0]?.id });
    } catch (err) {
      alert(err.message || 'Failed to open project');
    } finally {
      setOpeningId(null);
    }
  };

  const handleCreated = ({ project, file }) => {
    setShowNewModal(false);
    onOpenProject({ project, files: [file], activeFileId: file.id });
  };

  const handleDefaultLangChange = (lang) => {
    setDefaultLang(lang);
    localStorage.setItem('traceon_default_lang', lang);
  };

  const handleTabSizeChange = (size) => {
    setTabSize(size);
    localStorage.setItem('traceon_tab_size', String(size));
  };

  const filteredProjects = projects
    .filter(p => langFilter === 'all' || p.language === langFilter)
    .filter(p => !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.created_at) - new Date(a.created_at);
      return new Date(b.last_accessed || b.created_at) - new Date(a.last_accessed || a.created_at);
    });

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-brand-row">
          <button className="dash-back-btn" onClick={onBack} title="Go back">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <div className="dash-brand" onClick={() => onSwitchView('landing')} style={{ cursor: 'pointer', flex: 1 }}>
            <span className="material-symbols-outlined dash-brand-icon">terminal</span>
            <span className="dash-brand-name">Traceon</span>
          </div>
        </div>

        <nav className="dash-nav">
          <button className="dash-nav-item" onClick={() => onSwitchView('landing')}>
            <span className="material-symbols-outlined">home</span>
            Home
          </button>
          <button
            className={`dash-nav-item ${activeNav === 'playground' ? 'active' : ''}`}
            onClick={onOpenPlayground}
          >
            <span className="material-symbols-outlined">play_circle</span>
            Playground
          </button>
          <button
            className={`dash-nav-item ${activeNav === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveNav('projects')}
          >
            <span className="material-symbols-outlined">folder_open</span>
            My Projects
            {projects.length > 0 && (
              <span className="dash-nav-badge">{projects.length}</span>
            )}
          </button>
          <button
            className={`dash-nav-item ${activeNav === 'news' ? 'active' : ''}`}
            onClick={() => setActiveNav('news')}
          >
            <span className="material-symbols-outlined">newspaper</span>
            Weekly Digest
          </button>
          <button
            className={`dash-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveNav('settings')}
          >
            <span className="material-symbols-outlined">settings</span>
            Settings
          </button>
        </nav>

        <div className="dash-divider" />

        {/* ── Theme picker ── */}
        <div className="dash-theme-section">
          <div className="dash-theme-label">Theme</div>
          <div className="dash-theme-swatches">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`dash-theme-swatch ${theme === opt.value ? 'active' : ''}`}
                style={{ '--swatch': opt.swatch }}
                onClick={() => setTheme(opt.value)}
                title={opt.label}
                aria-label={opt.label}
              />
            ))}
          </div>
          <div className="dash-theme-name">{THEME_OPTIONS.find(o => o.value === theme)?.label}</div>
        </div>

        <div className="dash-divider" />

        <div className="dash-user-section">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="dash-avatar" referrerPolicy="no-referrer" />
            : <div className="dash-avatar dash-avatar-placeholder">
                <span className="material-symbols-outlined">person</span>
              </div>
          }
          <div className="dash-user-info">
            <div className="dash-user-name">{user?.name || 'User'}</div>
            <div className="dash-user-email">{user?.email || ''}</div>
          </div>
          <button className="dash-logout-btn" onClick={onLogout} title="Sign out">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main">
        {activeNav === 'projects' && (
          <>
            {/* Welcome banner */}
            <div className="dash-welcome">
              <div className="dash-welcome-left">
                <div className="dash-welcome-greeting">{greeting}, {firstName}!</div>
                <div className="dash-welcome-meta">
                  {loadingProjects
                    ? 'Loading your workspace…'
                    : projects.length === 0
                      ? 'Create your first project to get started'
                      : `${projects.length} project${projects.length !== 1 ? 's' : ''} · ${totalFiles} file${totalFiles !== 1 ? 's' : ''} · Last active ${lastActiveStr}`
                  }
                </div>
              </div>
              {!loadingProjects && (
                <div className="dash-quick-stats">
                  <div className="dash-stat-chip">
                    <span className="material-symbols-outlined">folder_open</span>
                    <div>
                      <div className="dash-stat-chip-num">{projects.length}</div>
                      <div className="dash-stat-chip-lbl">Projects</div>
                    </div>
                  </div>
                  <div className="dash-stat-chip">
                    <span className="material-symbols-outlined">description</span>
                    <div>
                      <div className="dash-stat-chip-num">{totalFiles}</div>
                      <div className="dash-stat-chip-lbl">Files</div>
                    </div>
                  </div>
                  <div className="dash-stat-chip dash-stat-chip-streak">
                    <span className="material-symbols-outlined">local_fire_department</span>
                    <div>
                      <div className="dash-stat-chip-num">{streak}</div>
                      <div className="dash-stat-chip-lbl">Day streak</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="dash-quick-actions">
              <button className="dash-qa-btn dash-qa-primary" onClick={() => setShowNewModal(true)}>
                <span className="material-symbols-outlined">add</span>
                New Project
              </button>
              <button className="dash-qa-btn" onClick={onOpenPlayground}>
                <span className="material-symbols-outlined">play_circle</span>
                Open Playground
              </button>
              <button className="dash-qa-btn" onClick={() => setActiveNav('news')}>
                <span className="material-symbols-outlined">newspaper</span>
                Weekly Digest
              </button>
              <button className="dash-qa-btn" onClick={() => setActiveNav('settings')}>
                <span className="material-symbols-outlined">settings</span>
                Settings
              </button>
            </div>

            {/* Search / filter row — only when projects exist */}
            {projects.length > 0 && (
              <div className="dash-search-row">
                <div className="dash-search-wrap">
                  <span className="material-symbols-outlined dash-search-icon">search</span>
                  <input
                    className="dash-search-input"
                    type="text"
                    placeholder="Search projects…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="dash-search-clear" onClick={() => setSearchQuery('')}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  )}
                </div>
                <div className="dash-filter-chips">
                  {['all', 'cpp', 'c', 'python', 'java'].map(lang => (
                    <button
                      key={lang}
                      className={`dash-chip ${langFilter === lang ? 'active' : ''}`}
                      onClick={() => setLangFilter(lang)}
                    >
                      {lang === 'all' ? 'All' : LANG_LABELS[lang]}
                    </button>
                  ))}
                </div>
                <div className="dash-sort-wrap">
                  <span className="material-symbols-outlined dash-sort-icon">sort</span>
                  <select
                    className="dash-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="accessed">Last Opened</option>
                    <option value="created">Created</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </div>
              </div>
            )}

            {loadingProjects ? (
              <div className="proj-grid" style={{ padding: '8px 0' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} height="124px" borderRadius="12px" />
                ))}
              </div>
            ) : fetchError ? (
              <EmptyState
                icon="cloud_off"
                title="Could not load projects"
                description={fetchError}
                actionLabel="Retry"
                actionIcon="sync"
                onAction={loadProjects}
              />
            ) : (
              <div className="dash-content-layout">
                <div className="dash-main-col">
                  {projects.length === 0 ? (
                    <EmptyState
                      icon="folder_open"
                      title="No projects yet"
                      description="Create a project to organise, write, and trace your code across sessions."
                      actionLabel="Create First Project"
                      actionIcon="add"
                      onAction={() => setShowNewModal(true)}
                      secondaryActionLabel="Open Playground"
                      onSecondaryAction={onOpenPlayground}
                    />
                  ) : filteredProjects.length === 0 ? (
                    <EmptyState
                      icon="search_off"
                      title="No projects match your filter"
                      description="Try adjusting your search terms or language filter."
                      actionLabel="Clear Filters"
                      actionIcon="close"
                      onAction={() => { setSearchQuery(''); setLangFilter('all'); }}
                    />
                  ) : (
                    <div className="proj-grid">
                      {filteredProjects.map((proj, idx) => (
                        <div
                          key={proj.id}
                          className={`proj-card ${openingId === proj.id ? 'proj-card-opening' : ''}`}
                          style={{ '--card-idx': idx }}
                          onClick={() => openingId ? null : handleOpenProject(proj)}
                        >
                          {/* Faded background language icon */}
                          <div className="proj-card-bg-icon">
                            <span className="material-symbols-outlined">
                              {LANG_ICONS[proj.language] || 'code'}
                            </span>
                          </div>

                          <div className="proj-card-header">
                            <span className={`lang-badge lang-${proj.language}`}>
                              {LANG_LABELS[proj.language] || proj.language}
                            </span>
                            <div className="proj-card-header-right">
                              {proj.file_count > 0 && (
                                <span className="proj-file-count">
                                  <span className="material-symbols-outlined">description</span>
                                  {proj.file_count}
                                </span>
                              )}
                              <button
                                className="proj-delete-btn"
                                onClick={(e) => handleDelete(e, proj.id)}
                                disabled={deletingId === proj.id}
                                title="Delete project"
                              >
                                <span className="material-symbols-outlined">
                                  {deletingId === proj.id ? 'hourglass_empty' : 'delete'}
                                </span>
                              </button>
                            </div>
                          </div>

                          <div className="proj-card-name">{proj.name}</div>

                          <div className="proj-card-footer">
                            <div className="proj-card-meta">
                              <span className="material-symbols-outlined proj-clock">schedule</span>
                              {relativeTime(proj.last_accessed)}
                            </div>
                            <div className="proj-open-hint">
                              Open
                              <span className="material-symbols-outlined">arrow_forward</span>
                            </div>
                          </div>

                          {openingId === proj.id && (
                            <div className="proj-card-opening-overlay">
                              <div className="dash-spinner" />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Inline new-project card */}
                      <div className="proj-card proj-card-add" onClick={() => setShowNewModal(true)}>
                        <span className="material-symbols-outlined proj-add-icon">add_circle</span>
                        <span className="proj-add-label">New Project</span>
                      </div>
                    </div>
                  )}
                </div>

                <aside className="dash-activity-sidebar">
                  {/* Portfolio stats card */}
                  {projects.length > 0 && (
                    <div className="dash-stats-card">
                      <h3 className="activity-title">Portfolio</h3>
                      <div className="dash-stats-body">
                        <LangDonut counts={langCounts} total={projects.length} />
                        <div className="dash-stats-list">
                          {Object.entries(langCounts).filter(([, v]) => v > 0).map(([lang, count]) => (
                            <div key={lang} className="dash-stat-row">
                              <div className="dash-stat-dot" style={{ background: LANG_COLORS[lang] || '#888' }} />
                              <span className="dash-stat-lang">{LANG_LABELS[lang] || lang}</span>
                              <span className="dash-stat-count">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="dash-stats-meta">
                        <div className="dash-stat-meta-item">
                          <span className="dash-stat-meta-num">{projects.length}</span>
                          <span className="dash-stat-meta-lbl">Projects</span>
                        </div>
                        {totalFiles > 0 && (
                          <div className="dash-stat-meta-item">
                            <span className="dash-stat-meta-num">{totalFiles}</span>
                            <span className="dash-stat-meta-lbl">Files</span>
                          </div>
                        )}
                        <div className="dash-stat-meta-item">
                          <span className="dash-stat-meta-num">{lastActiveStr}</span>
                          <span className="dash-stat-meta-lbl">Last active</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 className="activity-title">Activity</h3>

                  {/* Month labels */}
                  <div className="activity-month-row">
                    {heatmapGrid.map((week, wi) => {
                      const firstDay = week[0];
                      const prevWeek = wi > 0 ? heatmapGrid[wi - 1][0] : null;
                      const showMonth = !prevWeek || firstDay.getMonth() !== prevWeek.getMonth();
                      return (
                        <div key={wi} className="activity-month-cell">
                          {showMonth && firstDay.toLocaleDateString(undefined, { month: 'short' })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid: day-labels + week columns */}
                  <div className="activity-grid-wrap">
                    <div className="activity-day-labels">
                      {DAY_LABELS.map((label, i) => (
                        <div key={i} className="activity-day-label">{label}</div>
                      ))}
                    </div>
                    <div className="activity-grid">
                      {heatmapGrid.map((week, wi) => (
                        <div key={wi} className="activity-week-col">
                          {week.map((date, di) => {
                            const iso = date.toISOString().split('T')[0];
                            const count = activityMap[iso] || 0;
                            const level = intensityLevel(count);
                            const isToday = iso === new Date().toISOString().split('T')[0];
                            const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            return (
                              <div
                                key={di}
                                className={`heatmap-cell level-${level}${isToday ? ' heatmap-today' : ''}`}
                                title={`${label}: ${count} event${count !== 1 ? 's' : ''}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="activity-legend">
                    <span className="activity-legend-label">Less</span>
                    {[0, 1, 2, 3].map(l => (
                      <div key={l} className={`heatmap-cell level-${l}`} style={{ flexShrink: 0 }} />
                    ))}
                    <span className="activity-legend-label">More</span>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}

        {activeNav === 'news' && (
          <NewsPage user={user} />
        )}

        {activeNav === 'settings' && (
          <>
            <div className="dash-topbar">
              <div>
                <h1 className="dash-title">Settings</h1>
                <p className="dash-subtitle">Account and workspace preferences</p>
              </div>
            </div>
            <div className="settings-sections">

              {/* Profile */}
              <div className="settings-section">
                <div className="settings-section-hdr">
                  <div className="settings-section-icon"><span className="material-symbols-outlined">person</span></div>
                  <div>
                    <div className="settings-section-title">Profile</div>
                    <div className="settings-section-desc">Your account information</div>
                  </div>
                </div>
                <div className="settings-section-body">
                  <div className="settings-profile-row">
                    {user?.avatar
                      ? <img src={user.avatar} alt="" className="settings-avatar" referrerPolicy="no-referrer" />
                      : <div className="settings-avatar settings-avatar-ph">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                    }
                    <div>
                      <div className="settings-field-label">Display name</div>
                      <div className="settings-field-value">{user?.name || '—'}</div>
                      <div className="settings-field-label" style={{ marginTop: 10 }}>Email</div>
                      <div className="settings-field-value">{user?.email || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="settings-section">
                <div className="settings-section-hdr">
                  <div className="settings-section-icon"><span className="material-symbols-outlined">palette</span></div>
                  <div>
                    <div className="settings-section-title">Appearance</div>
                    <div className="settings-section-desc">Theme and visual preferences</div>
                  </div>
                </div>
                <div className="settings-section-body">
                  <div className="settings-field-label">Color theme</div>
                  <div className="settings-theme-grid">
                    {THEME_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        className={`settings-theme-btn ${theme === opt.value ? 'active' : ''}`}
                        onClick={() => setTheme(opt.value)}
                        title={opt.label}
                      >
                        <div className="settings-theme-swatch" style={{ background: opt.swatch }} />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className="settings-section">
                <div className="settings-section-hdr">
                  <div className="settings-section-icon"><span className="material-symbols-outlined">code</span></div>
                  <div>
                    <div className="settings-section-title">Editor</div>
                    <div className="settings-section-desc">Default language and editor behavior</div>
                  </div>
                </div>
                <div className="settings-section-body">
                  <div className="settings-field-label">Default language</div>
                  <div className="settings-chips-row">
                    {['cpp', 'c', 'python', 'java'].map(lang => (
                      <button
                        key={lang}
                        className={`dash-chip ${defaultLang === lang ? 'active' : ''}`}
                        onClick={() => handleDefaultLangChange(lang)}
                      >
                        {LANG_LABELS[lang]}
                      </button>
                    ))}
                  </div>
                  <div className="settings-field-label" style={{ marginTop: 16 }}>Indentation</div>
                  <div className="settings-chips-row">
                    {[2, 4, 8].map(n => (
                      <button
                        key={n}
                        className={`dash-chip ${tabSize === n ? 'active' : ''}`}
                        onClick={() => handleTabSizeChange(n)}
                      >
                        {n} spaces
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keyboard shortcuts */}
              <div className="settings-section">
                <div className="settings-section-hdr">
                  <div className="settings-section-icon"><span className="material-symbols-outlined">keyboard</span></div>
                  <div>
                    <div className="settings-section-title">Keyboard Shortcuts</div>
                    <div className="settings-section-desc">Quick reference for common actions</div>
                  </div>
                </div>
                <div className="settings-section-body">
                  <div className="settings-shortcuts-grid">
                    {KEYBOARD_SHORTCUTS.map(({ keys, desc }) => (
                      <div key={desc} className="settings-shortcut-row">
                        <span className="settings-shortcut-desc">{desc}</span>
                        <div className="settings-shortcut-keys">
                          {keys.map((k, i) => (
                            <React.Fragment key={i}>
                              <kbd className="settings-kbd">{k}</kbd>
                              {i < keys.length - 1 && <span className="settings-kbd-plus">+</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="settings-section">
                <div className="settings-section-hdr">
                  <div className="settings-section-icon"><span className="material-symbols-outlined">lock</span></div>
                  <div>
                    <div className="settings-section-title">Security</div>
                    <div className="settings-section-desc">Session and account actions</div>
                  </div>
                </div>
                <div className="settings-section-body">
                  <p className="settings-security-note">
                    Signed in as <strong>{user?.email}</strong> via Google OAuth.
                  </p>
                  <button className="settings-danger-btn" onClick={onLogout}>
                    <span className="material-symbols-outlined">logout</span>
                    Sign out of all devices
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      <NewProjectModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreated}
      />
    </div>
  );
};

export default DashboardPage;
