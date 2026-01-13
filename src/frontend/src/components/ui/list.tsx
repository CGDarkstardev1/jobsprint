import React from 'react';

export function List({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ul className={`space-y-2 ${className}`}>{children}</ul>;
}

export function ListItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={`p-3 border rounded ${className}`}>{children}</li>;
}
