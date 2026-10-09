import * as React from 'react';
import { Link } from 'react-router-dom';

export interface PageContainerProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  children: React.ReactNode;
}

export function PageContainer({
  title,
  description,
  action,
  breadcrumbs,
  children,
}: PageContainerProps) {
  return (
    <div className="space-y-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-gray-700">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words">{title}</h1>
          {description && (
            <p className="mt-1 text-gray-500">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
