import { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Handshake,
  Ticket,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Contacts',
    items: [
      { label: 'People', to: '/contacts', icon: <Users className="h-5 w-5" /> },
      { label: 'Companies', to: '/companies', icon: <Building2 className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Pipeline', to: '/crm/pipeline', icon: <Kanban className="h-5 w-5" /> },
      { label: 'Deals', to: '/crm/deals', icon: <Handshake className="h-5 w-5" /> },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Tickets', to: '/helpdesk/tickets', icon: <Ticket className="h-5 w-5" /> },
      { label: 'Board', to: '/helpdesk/kanban', icon: <LayoutGrid className="h-5 w-5" /> },
    ],
  },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/contacts': 'People',
  '/companies': 'Companies',
  '/crm/pipeline': 'Pipeline',
  '/crm/deals': 'Deals',
  '/helpdesk/tickets': 'Tickets',
  '/helpdesk/kanban': 'Board',
};

export default function MainLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const pageTitle = pageTitles[location.pathname] ?? '';

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            C
          </div>
          {!collapsed && <span className="text-lg font-bold text-gray-900">CRM</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, si) => (
          <div key={si} className={clsx(si > 0 && 'mt-5')}>
            {section.title && !collapsed && (
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>
            )}
            {collapsed && si > 0 && <div className="mx-2 my-2 border-t border-gray-200" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                        collapsed && 'justify-center',
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden border-t border-gray-200 p-3 lg:block">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-2 top-3 rounded-md p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Sidebar - desktop */}
      <aside
        className={clsx(
          'hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 lg:flex',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>

            {/* User dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {user ? user.first_name.charAt(0) + user.last_name.charAt(0) : '?'}
                </div>
                <span className="hidden text-sm font-medium text-gray-700 md:block">
                  {user ? `${user.first_name} ${user.last_name}` : ''}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {user ? `${user.first_name} ${user.last_name}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
