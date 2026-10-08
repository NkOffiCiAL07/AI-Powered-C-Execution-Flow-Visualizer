import React from 'react';
import './ui.css';

/**
 * Premium SaaS Segmented Tabs Component
 */
export function Tabs({
  items = [], // { id, label, icon, badge, disabled }
  activeId,
  onChange,
  className = '',
  size = 'md', // 'sm' | 'md'
}) {
  return (
    <div
      className={`ui-tabs ui-tabs--${size} ${className}`}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            className={`ui-tab-btn ${isActive ? 'ui-tab-btn--active' : ''} ${item.disabled ? 'ui-tab-btn--disabled' : ''}`}
            onClick={() => !item.disabled && onChange(item.id)}
          >
            {item.icon && (
              <span className="ui-tab-btn__icon material-symbols-outlined" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span className="ui-tab-btn__label">{item.label}</span>
            {item.badge !== undefined && item.badge !== null && (
              <span className={`ui-tab-btn__badge ${isActive ? 'ui-tab-btn__badge--active' : ''}`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
