import React, { forwardRef } from 'react';
import './ui.css';

/**
 * Liquid Glass Panel Primitive
 * Variants: 'default' | 'elevated' | 'subtle' | 'dock' | 'card'
 * Glow: 'none' | 'indigo' | 'cyan' | 'purple'
 */
export const GlassPanel = forwardRef(function GlassPanel(
  {
    children,
    as: Component = 'div',
    variant = 'default',
    glow = 'none',
    hoverable = false,
    className = '',
    style = {},
    ...props
  },
  ref
) {
  const variantClass =
    variant === 'elevated' ? 'liquid-glass-elevated' :
    variant === 'subtle'   ? 'liquid-glass-subtle' :
    variant === 'dock'     ? 'liquid-glass-dock' :
    variant === 'card'     ? 'liquid-glass-card' :
    'liquid-glass';

  const glowClass =
    glow === 'indigo' ? 'liquid-glass-glow' :
    glow === 'cyan'   ? 'liquid-glass-glow-cyan' :
    glow === 'purple' ? 'liquid-glass-glow-purple' : '';

  const hoverClass = hoverable && variant !== 'card' ? 'liquid-glass-hoverable' : '';

  return (
    <Component
      ref={ref}
      className={`${variantClass} ${glowClass} ${hoverClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
});

export default GlassPanel;
