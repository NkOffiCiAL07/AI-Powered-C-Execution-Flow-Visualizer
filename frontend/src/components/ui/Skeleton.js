import React from 'react';
import './ui.css';

/**
 * Premium Skeleton Loader Component
 */
export function Skeleton({
  width,
  height,
  borderRadius,
  className = '',
  circle = false,
  style = {},
  ...props
}) {
  const customStyle = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(circle ? { borderRadius: '50%', width: width || height, height: height || width } : {}),
    ...(borderRadius && !circle ? { borderRadius } : {}),
    ...style,
  };

  return (
    <div
      className={`ui-skeleton ${circle ? 'ui-skeleton--circle' : ''} ${className}`}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`ui-skeleton-text ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="12px"
          width={i === lines - 1 ? '65%' : i === 0 ? '100%' : '90%'}
          style={{ marginBottom: i < lines - 1 ? '8px' : '0' }}
        />
      ))}
    </div>
  );
}

export default Skeleton;
