import React from 'react';
import './ui.css';

/**
 * Premium SaaS Badge Component
 * Variants: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
 * Sizes: 'sm' | 'md'
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon = null,
  className = '',
  ...props
}) {
  return (
    <span className={`ui-badge ui-badge--${variant} ui-badge--${size} ${className}`} {...props}>
      {dot && <span className="ui-badge__dot" aria-hidden="true" />}
      {icon && <span className="ui-badge__icon material-symbols-outlined" aria-hidden="true">{icon}</span>}
      <span className="ui-badge__text">{children}</span>
    </span>
  );
}

export default Badge;
