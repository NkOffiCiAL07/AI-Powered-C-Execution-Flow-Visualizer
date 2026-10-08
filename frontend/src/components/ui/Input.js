import React, { forwardRef } from 'react';
import './ui.css';

/**
 * Premium SaaS Input Component
 */
export const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    icon = null,
    iconRight = null,
    className = '',
    containerClassName = '',
    id,
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`ui-input-group ${error ? 'ui-input-group--error' : ''} ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label}
        </label>
      )}

      <div className={`ui-input-wrap ${disabled ? 'ui-input-wrap--disabled' : ''}`}>
        {icon && (
          <span className="ui-input-icon ui-input-icon--left material-symbols-outlined" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`ui-input ${icon ? 'ui-input--has-icon-left' : ''} ${iconRight ? 'ui-input--has-icon-right' : ''} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          {...props}
        />

        {iconRight && (
          <span className="ui-input-icon ui-input-icon--right material-symbols-outlined" aria-hidden="true">
            {iconRight}
          </span>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="ui-input-error" role="alert">
          <span className="material-symbols-outlined">error</span>
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="ui-input-helper">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
