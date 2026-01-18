import React from 'react';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

/**
 * Skip link for keyboard users to bypass navigation
 */
export function SkipLink({ 
  href = '#main-content', 
  children = 'Pular para o conteúdo principal' 
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {children}
    </a>
  );
}
