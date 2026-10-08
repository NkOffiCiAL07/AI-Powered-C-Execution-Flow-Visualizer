import React, { useEffect, useRef, useState } from "react";
import "../styles/Header.css";
import { useTheme } from "../theme";

const THEME_OPTIONS = [
  { value: "light",    label: "Light",    swatch: "#4F46E5" },
  { value: "dark",     label: "Dark",     swatch: "#6366F1" },
  { value: "ocean",    label: "Ocean",    swatch: "#58A6FF" },
  { value: "forest",   label: "Forest",   swatch: "#57C87A" },
  { value: "midnight", label: "Midnight", swatch: "#A855F7" },
];


const NAV_PAGES = [
  { value: "landing",   label: "Home",      icon: "home"       },
  { value: "docs",      label: "Docs",      icon: "menu_book"  },
  { value: "blog",      label: "Blog",      icon: "article"    },
  { value: "pricing",   label: "Pricing",   icon: "sell"       },
  { value: "community", label: "Community", icon: "groups"     },
  { value: "news",      label: "News",      icon: "newspaper"  },
];


function Dropdown({ trigger, children, align = "left" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="hdr-dropdown" ref={ref}>
      <div onClick={() => setOpen(o => !o)}>{trigger(open)}</div>
      {open && (
        <ul className={`hdr-dropdown-menu ${align === "right" ? "align-right" : ""}`} role="menu">
          {children(() => setOpen(false))}
        </ul>
      )}
    </div>
  );
}

export default function Header({
  view,
  onSwitchView,
  user,
  onLogout,
  onSignIn,
  language,
  onLanguageChange,
  currentProject,
  onOpenCommandPalette,
}) {
  const { theme, setTheme } = useTheme();
  const inApp = view === "editor" || view === "visualizer";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="header">

      {/* ── Left: brand + breadcrumb ── */}
      <div className="header-left">
        <div className="header-brand" onClick={() => onSwitchView("landing")}>
          <div className="brand-logo-icon">
            <span className="material-symbols-outlined header-brand-icon">auto_awesome</span>
          </div>
          <span className="brand-text">TRACEON</span>
          <span className="brand-pill-badge">2.0</span>
        </div>

        {currentProject && (
          <div className="header-breadcrumb">
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item" onClick={() => onSwitchView("dashboard")}>
              {currentProject.project?.name}
            </span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item file-crumb">
              {currentProject.files?.find(f => f.id === currentProject.activeFileId)?.name ?? "Loading…"}
            </span>
          </div>
        )}

        {/* Pages dropdown — in app view */}
        {inApp && (
          <Dropdown
            trigger={(open) => (
              <button className="hdr-pages-trigger" aria-expanded={open} title="More Views">
                <span className="material-symbols-outlined">apps</span>
                <span className={`material-symbols-outlined hdr-chevron ${open ? "open" : ""}`}>expand_more</span>
              </button>
            )}
          >
            {(close) => (
              <>
                {user && user.role !== "guest" && (
                  <>
                    <li className="hdr-dropdown-item" role="menuitem"
                      onClick={() => { onSwitchView("dashboard"); close(); }}>
                      <span className="material-symbols-outlined">dashboard</span>
                      Dashboard
                    </li>
                    <li className="hdr-dropdown-divider" role="separator" />
                  </>
                )}
                {NAV_PAGES.map(p => (
                  <li key={p.value} className="hdr-dropdown-item" role="menuitem"
                    onClick={() => { onSwitchView(p.value); close(); }}>
                    <span className="material-symbols-outlined">{p.icon}</span>
                    {p.label}
                  </li>
                ))}
              </>
            )}
          </Dropdown>
        )}
      </div>

      {/* Mobile hamburger */}
      {!inApp && (
        <button
          className="header-mobile-menu-btn"
          onClick={() => setMobileNavOpen(o => !o)}
          aria-label="Toggle navigation"
        >
          <span className="material-symbols-outlined">{mobileNavOpen ? 'close' : 'menu'}</span>
        </button>
      )}

      {/* ── Center col: Floating Liquid Glass Dock ── */}
      <div className="header-center">
        {inApp ? (
          <div className="hdr-app-dock" role="navigation" aria-label="IDE View Switcher">
            <button
              className={`hdr-dock-btn ${view === "editor" ? "active" : ""}`}
              onClick={() => onSwitchView("editor")}
              title="Code Editor"
            >
              <span className="material-symbols-outlined">code</span>
              <span>Editor</span>
            </button>
            <button
              className={`hdr-dock-btn ${view === "visualizer" ? "active" : ""}`}
              onClick={() => onSwitchView("visualizer")}
              title="Execution Flow Visualizer"
            >
              <span className="material-symbols-outlined">bug_report</span>
              <span>Debugger</span>
            </button>
            {user && user.role !== "guest" && (
              <button
                className="hdr-dock-btn"
                onClick={() => onSwitchView("dashboard")}
                title="Projects Dashboard"
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </button>
            )}
          </div>
        ) : (
          <nav className="header-nav" aria-label="Main navigation">
            <a className={`nav-link ${view === "landing"   ? "active" : ""}`} href="?v=landing"   onClick={(e) => { e.preventDefault(); onSwitchView("landing"); }}>Home</a>
            <a className={`nav-link ${view === "docs"      ? "active" : ""}`} href="?v=docs"      onClick={(e) => { e.preventDefault(); onSwitchView("docs"); }}>Docs</a>
            <a className={`nav-link ${view === "blog"      ? "active" : ""}`} href="?v=blog"      onClick={(e) => { e.preventDefault(); onSwitchView("blog"); }}>Blog</a>
            <a className={`nav-link ${view === "pricing"   ? "active" : ""}`} href="?v=pricing"   onClick={(e) => { e.preventDefault(); onSwitchView("pricing"); }}>Pricing</a>
            <a className={`nav-link ${view === "community" ? "active" : ""}`} href="?v=community" onClick={(e) => { e.preventDefault(); onSwitchView("community"); }}>Community</a>
            <a className={`nav-link ${view === "news"      ? "active" : ""}`} href="?v=news"      onClick={(e) => { e.preventDefault(); onSwitchView("news"); }}>News</a>
          </nav>
        )}
      </div>

      {/* ── Right: ⌘K + theme + user ── */}
      <div className="header-right">

        {/* ⌘K Command Palette Quick Launcher */}
        <button
          className="hdr-cmd-trigger"
          onClick={onOpenCommandPalette}
          title="Open Command Palette (⌘K)"
          aria-label="Open Command Palette"
        >
          <span className="material-symbols-outlined hdr-cmd-icon">search</span>
          <span className="hdr-cmd-label">Commands</span>
          <kbd className="hdr-cmd-kbd">⌘K</kbd>
        </button>

        {/* Theme picker */}
        <Dropdown
          align="right"
          trigger={(open) => (
            <button className="theme-toggle-btn" title="Change theme" aria-label="Change theme" aria-expanded={open}>
              <span className="material-symbols-outlined">palette</span>
            </button>
          )}
        >
          {(close) => THEME_OPTIONS.map(opt => (
            <li key={opt.value}
              className={`hdr-dropdown-item ${opt.value === theme ? "active" : ""}`}
              role="menuitem"
              onClick={() => { setTheme(opt.value); close(); }}
            >
              <span className="theme-swatch" style={{ background: opt.swatch }} />
              {opt.label}
              {opt.value === theme && <span className="material-symbols-outlined hdr-check">check</span>}
            </li>
          ))}
        </Dropdown>

        {/* User */}
        {user ? (
          <div className="user-pill">
            {user.avatar
              ? <img className="user-avatar" src={user.avatar} alt={user.name} />
              : <span className="user-avatar-placeholder material-symbols-outlined">person</span>
            }
            <span className="user-name">{user.name || "Guest"}</span>
            <button className="signout-btn" onClick={onLogout} title="Sign out">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        ) : (
          <button className="sign-in-link" onClick={onSignIn}>Sign In</button>
        )}
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && !inApp && (
        <nav className="mobile-nav-drawer" aria-label="Mobile navigation">
          {NAV_PAGES.map(p => (
            <button
              key={p.value}
              className={`mobile-nav-link ${view === p.value ? 'active' : ''}`}
              onClick={() => { onSwitchView(p.value); setMobileNavOpen(false); }}
            >
              <span className="material-symbols-outlined">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
