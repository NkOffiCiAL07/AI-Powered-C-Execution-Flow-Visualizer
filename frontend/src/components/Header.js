import React, { useEffect, useRef, useState } from "react";
import "../styles/Header.css";
import { useTheme } from "../theme";

const THEME_OPTIONS = [
  { value: "light",    label: "Light",    swatch: "#C96A48" },
  { value: "dark",     label: "Dark",     swatch: "#D97757" },
  { value: "ocean",    label: "Ocean",    swatch: "#58A6FF" },
  { value: "forest",   label: "Forest",   swatch: "#57C87A" },
  { value: "midnight", label: "Midnight", swatch: "#A855F7" },
];

const VIEW_OPTIONS = [
  { value: "visualizer", label: "Debugger", icon: "bug_report" },
  { value: "editor",     label: "Editor",   icon: "code"       },
];

const NAV_PAGES = [
  { value: "landing",   label: "Home",      icon: "home"       },
  { value: "docs",      label: "Docs",      icon: "menu_book"  },
  { value: "pricing",   label: "Pricing",   icon: "sell"       },
  { value: "community", label: "Community", icon: "groups"     },
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

export default function Header({ view, onSwitchView, user, onLogout, onSignIn, language, onLanguageChange, currentProject }) {
  const { theme, setTheme } = useTheme();
  const inApp = view === "editor" || view === "visualizer";
  const currentView = VIEW_OPTIONS.find(o => o.value === view);

  return (
    <header className="header">

      {/* ── Left: brand + breadcrumb ── */}
      <div className="header-left">
        <div className="header-brand" onClick={() => onSwitchView("landing")}>
          <span className="material-symbols-outlined header-brand-icon">terminal</span>
          <span className="brand-text">Traceon</span>
        </div>

        {currentProject && (
          <div className="header-breadcrumb">
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item" onClick={() => onSwitchView("dashboard")}>
              {currentProject.project?.name}
            </span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item file-crumb">
              {currentProject.file?.name ?? "Loading…"}
            </span>
          </div>
        )}

        {/* Pages dropdown — only in app view */}
        {inApp && (
          <Dropdown
            trigger={(open) => (
              <button className="hdr-pages-trigger" aria-expanded={open}>
                <span className="material-symbols-outlined">apps</span>
                <span className={`material-symbols-outlined hdr-chevron ${open ? "open" : ""}`}>expand_more</span>
              </button>
            )}
          >
            {(close) => NAV_PAGES.map(p => (
              <li key={p.value} className="hdr-dropdown-item" role="menuitem"
                onClick={() => { onSwitchView(p.value); close(); }}>
                <span className="material-symbols-outlined">{p.icon}</span>
                {p.label}
              </li>
            ))}
          </Dropdown>
        )}
      </div>

      {/* ── Center: nav links (non-app views only) ── */}
      {!inApp && (
        <nav className="header-nav" aria-label="Main navigation">
          <button className={`nav-link ${view === "landing"   ? "active" : ""}`} onClick={() => onSwitchView("landing")}>Home</button>
          <button className={`nav-link ${view === "docs"      ? "active" : ""}`} onClick={() => onSwitchView("docs")}>Docs</button>
          <button className={`nav-link ${view === "pricing"   ? "active" : ""}`} onClick={() => onSwitchView("pricing")}>Pricing</button>
          <button className={`nav-link ${view === "community" ? "active" : ""}`} onClick={() => onSwitchView("community")}>Community</button>
        </nav>
      )}

      {/* ── Right: app controls + theme + user ── */}
      <div className="header-right">

        {/* View switcher dropdown */}
        {inApp && currentView && (
          <Dropdown
            trigger={(open) => (
              <button className="view-dropdown-trigger" aria-expanded={open}>
                <span className="material-symbols-outlined">{currentView.icon}</span>
                <span>{currentView.label}</span>
                <span className={`material-symbols-outlined hdr-chevron ${open ? "open" : ""}`}>expand_more</span>
              </button>
            )}
          >
            {(close) => VIEW_OPTIONS.map(opt => (
              <li key={opt.value}
                className={`hdr-dropdown-item ${opt.value === view ? "active" : ""}`}
                role="menuitem"
                onClick={() => { onSwitchView(opt.value); close(); }}>
                <span className="material-symbols-outlined">{opt.icon}</span>
                {opt.label}
                {opt.value === view && <span className="material-symbols-outlined hdr-check">check</span>}
              </li>
            ))}
          </Dropdown>
        )}

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
    </header>
  );
}
