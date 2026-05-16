import React, { useState, useEffect, useCallback } from 'react';
import NewProjectModal from './NewProjectModal';
import { fetchProjects, deleteProject, fetchFiles } from '../services/api';
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
  const [loadingProjects, setLoading]   = useState(true);
  const [fetchError, setFetchError]     = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [openingId, setOpeningId]       = useState(null);

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

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its files? This cannot be undone.')) return;
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
    try {
      const data = await fetchFiles(project.id);
      const files = data.files || [];
      const firstFile = files[0] || null;
      onOpenProject({ project, file: firstFile, code: firstFile?.code || '', language: project.language });
    } catch (err) {
      alert(err.message || 'Failed to open project');
    } finally {
      setOpeningId(null);
    }
  };

  const handleCreated = ({ project, file, code, language }) => {
    setShowNewModal(false);
    onOpenProject({ project, file, code, language });
  };

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="material-symbols-outlined dash-brand-icon">terminal</span>
          <span className="dash-brand-name">Traceon</span>
        </div>

        <nav className="dash-nav">
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
                    ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                    : 'Create a project to get started'}
                </p>
              </div>
              <button className="dash-new-btn" onClick={() => setShowNewModal(true)}>
                <span className="material-symbols-outlined">add</span>
                New Project
              </button>
            </div>

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
            ) : projects.length === 0 ? (
              <div className="dash-empty-state">
                <span className="material-symbols-outlined dash-empty-icon">folder_open</span>
                <h3>No projects yet</h3>
                <p>Create a project to organise and save your code across sessions.</p>
                <button className="dash-new-btn" onClick={() => setShowNewModal(true)}>
                  <span className="material-symbols-outlined">add</span>
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="proj-grid">
                {projects.map(proj => (
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
                        title="Delete project"
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
          </>
        )}

        {activeNav === 'settings' && (
          <div className="dash-settings-placeholder">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>settings</span>
            <h3>Settings</h3>
            <p>Account and workspace settings — coming soon.</p>
          </div>
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
