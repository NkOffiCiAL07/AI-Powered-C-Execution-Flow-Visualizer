import React from 'react';
import './ui.css';

/**
 * Premium SaaS Card Component
 */
export function Card({
  children,
  className = '',
  hover = false,
  interactive = false,
  padding = 'default', // 'none' | 'sm' | 'default' | 'lg'
  onClick,
  ...props
}) {
  const classes = [
    'ui-card',
    hover ? 'ui-card--hover' : '',
    interactive ? 'ui-card--interactive' : '',
    `ui-card--pad-${padding}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return <div className={`ui-card__header ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', as = 'h3', ...props }) {
  const Tag = as;
  return <Tag className={`ui-card__title ${className}`} {...props}>{children}</Tag>;
}

export function CardDescription({ children, className = '', ...props }) {
  return <p className={`ui-card__desc ${className}`} {...props}>{children}</p>;
}

export function CardContent({ children, className = '', ...props }) {
  return <div className={`ui-card__content ${className}`} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }) {
  return <div className={`ui-card__footer ${className}`} {...props}>{children}</div>;
}

export default Card;
