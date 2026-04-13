import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Anchor, BarChart2, GitCompare, PiggyBank, Users } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/routes', label: 'Routes', icon: Anchor },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/banking', label: 'Banking', icon: PiggyBank },
  { to: '/pooling', label: 'Pooling', icon: Users },
];

export function DashboardLayout() {
  const location = useLocation();
  const currentPage = NAV_ITEMS.find((n) => location.pathname.startsWith(n.to))?.label ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col h-full overflow-hidden" style={{ backgroundColor: '#0F172A' }}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-ocean rounded-lg flex items-center justify-center shrink-0">
              <BarChart2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">FuelEU</p>
              <p className="text-white/40 text-[10px] mt-0.5 tracking-widest uppercase">Maritime</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 pt-2 pb-1 text-white/30 text-[10px] uppercase tracking-widest font-semibold">Main Menu</p>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-400 border-l-2 border-sky-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{currentPage}</h1>
            <p className="text-xs text-gray-400 mt-0.5">FuelEU Maritime Compliance Platform</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs px-2.5 py-1 rounded-full gradient-ocean-subtle text-sky-700 font-medium border border-sky-100">
              Target GHG: 89.3368 g/MJ
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
