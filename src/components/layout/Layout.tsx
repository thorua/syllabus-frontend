import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-uam-gray-light">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-uam-blue px-4 text-white lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-1.5 hover:bg-white/10 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded p-0.5 flex items-center justify-center">
            <img
              src="/images/uam_acreditacion25_vertical_COLOR.jpg"
              alt="UAM"
              className="h-6 w-auto object-contain"
            />
          </div>
          <span className="text-sm font-bold leading-tight">Syllabus UAM</span>
        </div>
        <span className="w-8" />
      </header>

      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(!collapsed)}
      />

      <main
        className={cn(
          'min-h-screen p-4 pt-[4.5rem] sm:p-6 sm:pt-[4.5rem] lg:p-8 lg:pt-8 transition-[margin] duration-300',
          collapsed ? 'lg:ml-[68px]' : 'lg:ml-64'
        )}
      >
        {children}
      </main>
    </div>
  );
}