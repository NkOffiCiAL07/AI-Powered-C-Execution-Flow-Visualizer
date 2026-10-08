import React from 'react';
import './ui.css';
import Button from './Button';

/**
 * Premium SaaS Empty State Component
 */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  actionIcon = 'add',
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  children,
}) {
  return (
    <div className={`ui-empty-state ${className}`}>
      <div className="ui-empty-state__icon-box">
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      {title && <h3 className="ui-empty-state__title">{title}</h3>}
      {description && <p className="ui-empty-state__desc">{description}</p>}

      {children && <div className="ui-empty-state__extra">{children}</div>}

      {(actionLabel || secondaryActionLabel) && (
        <div className="ui-empty-state__actions">
          {actionLabel && (
            <Button
              variant="primary"
              size="md"
              icon={actionIcon}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && (
            <Button
              variant="ghost"
              size="md"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
