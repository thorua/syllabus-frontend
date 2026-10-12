import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { cn, getRoleLabel } from '../../lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  Award,
  BookOpen,
  Download,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  X,
  FileCheck,
  Landmark,
  Network,
  PenLine,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Visibilidad según permisos efectivos; sin definir = visible para todos. */
  visible?: (can: (permission: string) => boolean) => boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Syllabus', href: '/syllabus', icon: <FileText size={20} /> },
  { label: 'Mis Asignaturas', href: '/my-subjects', icon: <GraduationCap size={20} />, visible: (can) => !can('syllabus:create') },
  { label: 'Usuarios', href: '/users', icon: <Users size={20} />, visible: (can) => can('user:read') },
  { label: 'Facultades', href: '/faculties', icon: <Landmark size={20} />, visible: (can) => can('faculty:create') },
  { label: 'Pregrado', href: '/pregrado', icon: <GraduationCap size={20} />, visible: (can) => can('department:create') },
  { label: 'Posgrado', href: '/posgrado', icon: <Award size={20} />, visible: (can) => can('program:create') },
  { label: 'Planes de estudio', href: '/study-plans', icon: <Network size={20} />, visible: (can) => can('program:read') },
  { label: 'Asignaturas', href: '/subjects', icon: <BookOpen size={20} />, visible: (can) => can('syllabus:create') },
  { label: 'Mi firma digital', href: '/firma-digital', icon: <PenLine size={20} />, visible: (can) => can('syllabus:sign') },
  { label: 'Exportar', href: '/export', icon: <Download size={20} />, visible: (can) => can('syllabus:export') },
  { label: 'Auditoría', href: '/audit', icon: <FileCheck size={20} />, visible: (can) => can('audit:read') },
  { label: 'Configuración', href: '/settings', icon: <Settings size={20} />, visible: (can) => can('config:update') },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile, collapsed, onToggleCollapsed }: SidebarProps) {
  const location = useLocation();
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();

  const filteredNavItems = navItems.filter((item) => !item.visible || item.visible(can));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300 flex flex-col',
          collapsed ? 'w-64 lg:w-[68px]' : 'w-64',
          'bg-uam-blue text-white',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center h-16 border-b border-white/10',
          collapsed ? 'lg:justify-center lg:px-2 justify-between px-4' : 'justify-between px-4'
        )}>
          <div className={cn('flex items-center gap-2.5 min-w-0', collapsed && 'lg:hidden')}>
            <div className="bg-white rounded p-1 flex items-center justify-center">
              <img
                src="/images/uam_acreditacion25_vertical_COLOR.jpg"
                alt="UAM"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">Syllabus</span>
              <span className="text-[10px] text-blue-200 leading-tight">UAM</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="lg:hidden rounded-md p-1.5 hover:bg-white/10 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
            <button
              onClick={onToggleCollapsed}
              className="hidden lg:inline-flex rounded-md p-1.5 hover:bg-white/10 transition-colors"
              aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
                  collapsed ? 'lg:justify-center lg:px-2 px-3 py-2.5' : 'px-3 py-2.5',
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className={cn(
                  'flex-shrink-0',
                  isActive ? 'text-uam-yellow' : 'text-blue-200'
                )}>
                  {item.icon}
                </span>
                <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-white/10 p-3">
          <div className={cn('mb-3 px-2 py-2 rounded-lg bg-white/5', collapsed && 'lg:hidden')}>
            {user && (
              <>
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-blue-200">{getRoleLabel(user.role)}</p>
              </>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-colors',
              collapsed ? 'lg:justify-center lg:px-2 px-3 py-2.5' : 'px-3 py-2.5',
              'text-red-300 hover:bg-red-500/15 hover:text-red-200'
            )}
            title={collapsed ? 'Cerrar Sesión' : undefined}
          >
            <LogOut size={20} />
            <span className={cn(collapsed && 'lg:hidden')}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}