import React, { forwardRef } from 'react';
import './ui.css';

/**
 * Premium SaaS Button Component
 * Variants: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'icon'
 * Sizes: 'xs' | 'sm' | 'md' | 'lg'
 */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'secondary',
    size = 'md',
    loading = false,
    disabled = false,
    icon = null,
    iconRight = null,
    className = '',
    type = 'button',
    onClick,
    title,
    'aria-label': ariaLabel,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      title={title}
      aria-label={ariaLabel || (typeof children === 'string' ? children : title)}
      aria-busy={loading}
      className={`ui-btn ui-btn--${variant} ui-btn--${size} ${loading ? 'ui-btn--loading' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="ui-btn__spinner material-symbols-outlined spin" aria-hidden="true">
          sync
        </span>
      ) : icon ? (
        <span className="ui-btn__icon material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      {children && <span className="ui-btn__label">{children}</span>}

      {!loading && iconRight && (
        <span className="ui-btn__icon ui-btn__icon--right material-symbols-outlined" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  );
});

export default Button;
