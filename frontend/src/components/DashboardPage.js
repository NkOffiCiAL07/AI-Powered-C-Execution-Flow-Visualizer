import React, { useState, useEffect, useCallback } from 'react';
import NewProjectModal from './NewProjectModal';
import { fetchProjects, deleteProject, fetchFiles, fetchTrash, restoreProject, emptyTrash } from '../services/api';
import '../styles/DashboardPage.css';

const LANG_LABELS = { cpp: 'C++', c: 'C', python: 'Python', java: 'Java' };

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

const DashboardPage = ({ user, onLogout, onOpenProject, onOpenPlayground, onSwitchView }) => {
  const [activeNav, setActiveNav]       = useState('projects');
  const [projects, setProjects]         = useState([]);
  const [trash, setTrash]               = useState([]);
  const [loadingProjects, setLoading]   = useState(true);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [fetchError, setFetchError]     = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [restoringId, setRestoringId]   = useState(null);
  const [openingId, setOpeningId]       = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [langFilter, setLangFilter]     = useState('all');
  const [sortBy, setSortBy]             = useState('accessed');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchProjects();
      setProjects(data.projects || []);
    } catch (err) {
      if (err.name !== 'AbortError') setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrash = useCallback(async () => {
    setLoadingTrash(true);
    try {
      const data = await fetchTrash();
      setTrash(data.projects || []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Failed to load trash:', err);
    } finally {
      setLoadingTrash(false);
    }
  }, []);

  useEffect(() => { 
    if (activeNav === 'projects') loadProjects();
    if (activeNav === 'trash') loadTrash();
  }, [activeNav, loadProjects, loadTrash]);

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Move this project to trash?')) return;
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      alert(err.message || 'Failed to move project to trash');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (e, projectId) => {
    e.stopPropagation();
    setRestoringId(projectId);
    try {
      await restoreProject(projectId);
      setTrash(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      alert(err.message || 'Failed to restore project');
    } finally {
      setRestoringId(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Permanently delete all projects in trash? This cannot be undone.')) return;
    try {
      await emptyTrash();
      setTrash([]);
    } catch (err) {
      alert(err.message || 'Failed to empty trash');
    }
  };

  const handleOpenProject = async (project) => {
    setOpeningId(project.id);
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

  const handleCreated = ({ project, file, code, language }) => {
    setShowNewModal(false);
    onOpenProject({ project, files: [file], activeFileId: file.id });
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
        <div className="dash-brand" onClick={() => onSwitchView('landing')} style={{ cursor: 'pointer' }}>
          <span className="material-symbols-outlined dash-brand-icon">terminal</span>
          <span className="dash-brand-name">Traceon</span>
        </div>

        <nav className="dash-nav">
          <button
            className="dash-nav-item"
            onClick={() => onSwitchView('landing')}
          >
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
          </button>
          <button
            className={`dash-nav-item ${activeNav === 'trash' ? 'active' : ''}`}
            onClick={() => setActiveNav('trash')}
          >
            <span className="material-symbols-outlined">delete</span>
            Trash
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
            <div className="dash-topbar">
              <div>
                <h1 className="dash-title">My Projects</h1>
                <p className="dash-subtitle">
                  {projects.length > 0
                    ? `${filteredProjects.length} of ${projects.length} project${projects.length !== 1 ? 's' : ''}`
                    : 'Create a project to get started'}
                </p>
              </div>
              <button className="dash-new-btn" onClick={() => setShowNewModal(true)}>
                <span className="material-symbols-outlined">add</span>
                New Project
              </button>
            </div>

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
              <div className="dash-loading">
                <div className="dash-spinner" />
                <span>Loading projects…</span>
              </div>
            ) : fetchError ? (
              <div className="dash-error-state">
                <span className="material-symbols-outlined">cloud_off</span>
                <p>{fetchError}</p>
                <button className="dash-retry-btn" onClick={loadProjects}>Retry</button>
              </div>
            ) : (
              <div className="dash-content-layout">
                <div className="dash-main-col">
                  {projects.length === 0 ? (
                    <div className="dash-empty-state">
                      <span className="material-symbols-outlined dash-empty-icon">folder_open</span>
                      <h3>No projects yet</h3>
                      <p>Create a project to organise and save your code across sessions.</p>
                      <button className="dash-new-btn" onClick={() => setShowNewModal(true)}>
                        <span className="material-symbols-outlined">add</span>
                        Create your first project
                      </button>
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="dash-empty-state">
                      <span className="material-symbols-outlined dash-empty-icon">search_off</span>
                      <h3>No projects match</h3>
                      <p>Try adjusting the search or filter.</p>
                    </div>
                  ) : (
                    <div className="proj-grid">
                      {filteredProjects.map(proj => (
                        <div
                          key={proj.id}
                          className={`proj-card ${openingId === proj.id ? 'proj-card-opening' : ''}`}
                          onClick={() => openingId ? null : handleOpenProject(proj)}
                        >
                          <div className="proj-card-header">
                            <span className={`lang-badge lang-${proj.language}`}>
                              {LANG_LABELS[proj.language] || proj.language}
                            </span>
                            <button
                              className="proj-delete-btn"
                              onClick={(e) => handleDelete(e, proj.id)}
                              disabled={deletingId === proj.id}
                              title="Move to trash"
                            >
                              <span className="material-symbols-outlined">
                                {deletingId === proj.id ? 'hourglass_empty' : 'delete'}
                              </span>
                            </button>
                          </div>
                          <div className="proj-card-name">{proj.name}</div>
                          <div className="proj-card-meta">
                            <span className="material-symbols-outlined proj-clock">schedule</span>
                            {relativeTime(proj.last_accessed)}
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
                  <h3>Activity</h3>
                  <div className="activity-heatmap">
                    {(() => {
                      const now = Date.now();
                      const day = 86400000;
                      const accessedDays = new Set(
                        projects
                          .filter(p => p.last_accessed)
                          .map(p => Math.floor((now - new Date(p.last_accessed).getTime()) / day))
                      );
                      return Array.from({ length: 35 }).map((_, i) => {
                        const daysAgo = 34 - i;
                        const active = accessedDays.has(daysAgo);
                        return (
                          <div
                            key={i}
                            className="heatmap-cell"
                            style={{ opacity: active ? 0.85 : 0.12 }}
                            title={active ? `Active ${daysAgo === 0 ? 'today' : `${daysAgo}d ago`}` : 'No activity'}
                          />
                        );
                      });
                    })()}
                  </div>
                  <div className="activity-meta">
                    <span>Less</span>
                    <span>More</span>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}

        {activeNav === 'trash' && (
          <>
            <div className="dash-topbar">
              <div>
                <h1 className="dash-title">Trash</h1>
                <p className="dash-subtitle">
                  {trash.length > 0
                    ? `${trash.length} project${trash.length !== 1 ? 's' : ''}`
                    : 'Trash is empty'}
                </p>
              </div>
              {trash.length > 0 && (
                <button className="dash-new-btn" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} onClick={handleEmptyTrash}>
                  <span className="material-symbols-outlined">delete_forever</span>
                  Empty Trash
                </button>
              )}
            </div>

            {loadingTrash ? (
              <div className="dash-loading">
                <div className="dash-spinner" />
                <span>Loading trash…</span>
              </div>
            ) : trash.length === 0 ? (
              <div className="dash-empty-state">
                <span className="material-symbols-outlined dash-empty-icon">delete</span>
                <h3>Trash is empty</h3>
                <p>Deleted projects will appear here.</p>
              </div>
            ) : (
              <div className="proj-grid">
                {trash.map(proj => (
                  <div key={proj.id} className="proj-card">
                    <div className="proj-card-header">
                      <span className={`lang-badge lang-${proj.language}`}>
                        {LANG_LABELS[proj.language] || proj.language}
                      </span>
                      <button
                        className="proj-delete-btn"
                        onClick={(e) => handleRestore(e, proj.id)}
                        disabled={restoringId === proj.id}
                        title="Restore project"
                        style={{ color: 'var(--primary)' }}
                      >
                        <span className="material-symbols-outlined">
                          {restoringId === proj.id ? 'hourglass_empty' : 'restore'}
                        </span>
                      </button>
                    </div>
                    <div className="proj-card-name">{proj.name}</div>
                    <div className="proj-card-meta">
                      <span className="material-symbols-outlined proj-clock">delete</span>
                      Deleted {relativeTime(proj.deleted_at || proj.last_accessed)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeNav === 'settings' && (
          <>
            <div className="dash-topbar">
              <div>
                <h1 className="dash-title">Settings</h1>
                <p className="dash-subtitle">Account and workspace preferences</p>
              </div>
            </div>
            <div className="settings-grid">
              {[
                { icon: 'person', title: 'Profile', desc: 'Avatar, display name, and email address', badge: true },
                { icon: 'palette', title: 'Appearance', desc: 'Theme, font size, and editor layout', badge: true },
                { icon: 'code', title: 'Editor', desc: 'Default language, tab size, and keybindings', badge: true },
                { icon: 'lock', title: 'Security', desc: 'Sign out of all devices and delete account', badge: true },
              ].map(s => (
                <div key={s.title} className="settings-card">
                  <div className="settings-card-icon">
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </div>
                  <div className="settings-card-body">
                    <div className="settings-card-title">{s.title}</div>
                    <div className="settings-card-desc">{s.desc}</div>
                  </div>
                  {s.badge && <span className="settings-soon-badge">Soon</span>}
                </div>
              ))}
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
