import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/CommandPalette.css';
import { useTheme } from '../theme';

export default function CommandPalette({
  isOpen,
  onClose,
  onRun,
  onDebug,
  onStepOver,
  onStepBack,
  onStepIn,
  onStepOut,
  onExplain,
  onSwitchView,
  onOpenShortcuts,
  currentView,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const { setTheme } = useTheme();

  // Focus input whenever opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // Global keydown listener for ⌘K / Ctrl+K and navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Commands definition
  const allCommands = useMemo(() => [
    // Execution & Debugger
    {
      id: 'run',
      group: 'Execution & Debugging',
      label: 'Run Program',
      desc: 'Compile and execute code',
      icon: 'play_arrow',
      shortcut: '⌘↵',
      action: () => { onRun?.(); onClose(); },
    },
    {
      id: 'debug',
      group: 'Execution & Debugging',
      label: 'Debug & Trace Execution',
      desc: 'Start step-by-step visual execution',
      icon: 'bug_report',
      shortcut: 'Debug',
      action: () => { onDebug?.(); onClose(); },
    },
    {
      id: 'step_over',
      group: 'Execution & Debugging',
      label: 'Step Over',
      desc: 'Execute next line (skip function body)',
      icon: 'redo',
      shortcut: '→',
      action: () => { onStepOver?.(); onClose(); },
    },
    {
      id: 'step_in',
      group: 'Execution & Debugging',
      label: 'Step Into',
      desc: 'Step into function call',
      icon: 'south',
      shortcut: '↓',
      action: () => { onStepIn?.(); onClose(); },
    },
    {
      id: 'step_out',
      group: 'Execution & Debugging',
      label: 'Step Out',
      desc: 'Step out of current function',
      icon: 'north',
      shortcut: '↑',
      action: () => { onStepOut?.(); onClose(); },
    },
    {
      id: 'step_back',
      group: 'Execution & Debugging',
      label: 'Step Back',
      desc: 'Rewind to previous execution step',
      icon: 'undo',
      shortcut: '←',
      action: () => { onStepBack?.(); onClose(); },
    },

    // AI & Intelligence
    {
      id: 'ai_explain',
      group: 'AI Assistant',
      label: 'Explain Code with AI',
      desc: 'Deep logic breakdown & Big-O complexity',
      icon: 'auto_awesome',
      shortcut: '⌘⇧E',
      action: () => { onExplain?.(); onClose(); },
    },

    // Navigation & Views
    {
      id: 'view_editor',
      group: 'Navigation & Views',
      label: 'Go to Code Editor',
      desc: 'Open the full-screen IDE workspace',
      icon: 'code',
      action: () => { onSwitchView?.('editor'); onClose(); },
    },
    {
      id: 'view_visualizer',
      group: 'Navigation & Views',
      label: 'Go to Execution Flow Visualizer',
      desc: 'Open step scrubber & call graph',
      icon: 'account_tree',
      action: () => { onSwitchView?.('visualizer'); onClose(); },
    },
    {
      id: 'view_dashboard',
      group: 'Navigation & Views',
      label: 'Go to Dashboard',
      desc: 'View projects and files',
      icon: 'dashboard',
      action: () => { onSwitchView?.('dashboard'); onClose(); },
    },
    {
      id: 'view_docs',
      group: 'Navigation & Views',
      label: 'Documentation & Guides',
      desc: 'Read Traceon architecture docs',
      icon: 'menu_book',
      action: () => { onSwitchView?.('docs'); onClose(); },
    },
    {
      id: 'view_pricing',
      group: 'Navigation & Views',
      label: 'Pricing & Plans',
      desc: 'View Free & Pro tiers',
      icon: 'sell',
      action: () => { onSwitchView?.('pricing'); onClose(); },
    },
    {
      id: 'view_news',
      group: 'Navigation & Views',
      label: 'Tech News & Insights',
      desc: 'Curated developer updates',
      icon: 'newspaper',
      action: () => { onSwitchView?.('news'); onClose(); },
    },
    {
      id: 'shortcuts',
      group: 'Navigation & Views',
      label: 'Keyboard Shortcuts Reference',
      desc: 'View all keyboard shortcuts',
      icon: 'keyboard',
      shortcut: '?',
      action: () => { onOpenShortcuts?.(); onClose(); },
    },

    // Themes
    {
      id: 'theme_dark',
      group: 'Appearance & Themes',
      label: 'Theme: Liquid Dark (Obsidian)',
      desc: 'Deep cosmic translucent glass',
      icon: 'dark_mode',
      action: () => { setTheme('dark'); onClose(); },
    },
    {
      id: 'theme_ocean',
      group: 'Appearance & Themes',
      label: 'Theme: Cyber Ocean',
      desc: 'Deep blue glassmorphism',
      icon: 'water_drop',
      action: () => { setTheme('ocean'); onClose(); },
    },
    {
      id: 'theme_forest',
      group: 'Appearance & Themes',
      label: 'Theme: Emerald Forest',
      desc: 'Futuristic green glass',
      icon: 'forest',
      action: () => { setTheme('forest'); onClose(); },
    },
    {
      id: 'theme_midnight',
      group: 'Appearance & Themes',
      label: 'Theme: Cyber Midnight',
      desc: 'Cyberpunk purple glass',
      icon: 'nightlight',
      action: () => { setTheme('midnight'); onClose(); },
    },
    {
      id: 'theme_light',
      group: 'Appearance & Themes',
      label: 'Theme: Frosted Crystal (Light)',
      desc: 'High-clarity frosted glass',
      icon: 'light_mode',
      action: () => { setTheme('light'); onClose(); },
    },
  ], [onRun, onDebug, onStepOver, onStepIn, onStepOut, onStepBack, onExplain, onSwitchView, onOpenShortcuts, onClose, setTheme]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  // Group filtered commands
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard navigation within list
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('.cmd-item.active');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="cmd-palette-backdrop" onClick={onClose}>
      <div className="cmd-palette-box" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="cmd-palette-search">
          <span className="material-symbols-outlined cmd-search-icon">search</span>
          <input
            ref={inputRef}
            className="cmd-palette-input"
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, actions, or views..."
            spellCheck="false"
          />
          <span className="cmd-esc-chip">ESC</span>
        </div>

        {/* List of Commands */}
        <div className="cmd-palette-list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="cmd-empty">
              No commands found for "{query}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([groupName, items]) => (
              <div key={groupName} className="cmd-group">
                <div className="cmd-group-title">{groupName}</div>
                {items.map(item => {
                  const currentIndex = flatIndex++;
                  const isActive = currentIndex === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      className={`cmd-item ${isActive ? 'active' : ''}`}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      onClick={item.action}
                    >
                      <div className="cmd-item-left">
                        <div className="cmd-item-icon-box">
                          <span className="material-symbols-outlined">{item.icon}</span>
                        </div>
                        <div>
                          <span className="cmd-item-label">{item.label}</span>
                          <span className="cmd-item-desc">{item.desc}</span>
                        </div>
                      </div>
                      {item.shortcut && (
                        <div className="cmd-item-right">
                          <span className="cmd-shortcut-key">{item.shortcut}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="cmd-palette-footer">
          <div className="cmd-footer-keys">
            <div className="cmd-footer-key-item">
              <span className="cmd-shortcut-key">↑</span>
              <span className="cmd-shortcut-key">↓</span>
              <span>Navigate</span>
            </div>
            <div className="cmd-footer-key-item">
              <span className="cmd-shortcut-key">↵</span>
              <span>Select</span>
            </div>
          </div>
          <div>
            <span>Liquid Glass Workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
}
