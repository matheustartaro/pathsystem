import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Visually hidden component for screen readers
 * Content is hidden visually but accessible to assistive technologies
 */
export function VisuallyHidden({ 
  children, 
  as: Component = 'span' 
}: VisuallyHiddenProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}
