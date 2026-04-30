/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Warehouse, 
  Package, 
  Search, 
  Droplets, 
  Menu,
  User,
  BarChart2,
  Layers,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useTheme, ThemeMode } from './hooks/useTheme';

// Real Page Components
import Dashboard from './pages/Dashboard';
import WarehouseView from './pages/Warehouse';
import Inventory from './pages/Inventory';
import AdvancedSearch from './pages/AdvancedSearch';
import WashTracker from './pages/WashTracker';
import ItemDetail from './pages/ItemDetail';
import Analytics from './pages/Analytics';
import Outfits from './pages/Outfits';

const NavItem = ({ to, icon: Icon, label, collapsed }: { to: string, icon: any, label: string, collapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
        isActive 
          ? "bg-zinc-900 text-white shadow-lg shadow-black/10 dark:bg-zinc-100 dark:text-zinc-900" 
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
      )}
    >
      <Icon size={20} className={cn("shrink-0", isActive ? "text-white dark:text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300")} />
      {!collapsed && (
        <span className="font-medium text-sm overflow-hidden whitespace-nowrap">{label}</span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 dark:bg-zinc-100 dark:text-zinc-900">
          {label}
        </div>
      )}
    </Link>
  );
};

const themeOptions: { mode: ThemeMode; icon: any; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'system', icon: Monitor, label: 'System' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
];

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { mode, setMode } = useTheme();

  return (
    <div className={cn(
      "flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700",
      collapsed ? "flex-col" : "flex-row"
    )}>
      {themeOptions.map(({ mode: m, icon: Icon, label }) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          title={label}
          className={cn(
            "flex items-center justify-center p-1.5 transition-colors text-xs gap-1",
            mode === m
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          )}
        >
          <Icon size={13} />
          {!collapsed && <span className="font-medium">{label}</span>}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex text-zinc-900 dark:text-zinc-50 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-700">
        {/* Desktop Sidebar */}
        <aside 
          className={cn(
            "hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 bg-white dark:bg-zinc-900 z-40 sticky top-0 h-screen",
            isSidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="p-4 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-zinc-900 dark:to-zinc-100">
                HeyCloset
              </span>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <Menu size={18} />
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-1.5 mt-4">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={isSidebarCollapsed} />
            <NavItem to="/warehouse" icon={Warehouse} label="Warehouse" collapsed={isSidebarCollapsed} />
            <NavItem to="/inventory" icon={Package} label="Inventory" collapsed={isSidebarCollapsed} />
            <NavItem to="/search" icon={Search} label="Search" collapsed={isSidebarCollapsed} />
            <NavItem to="/washes" icon={Droplets} label="Wash Tracker" collapsed={isSidebarCollapsed} />
          </nav>

          <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <ThemeToggle collapsed={isSidebarCollapsed} />
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700",
              isSidebarCollapsed && "justify-center"
            )}>
              <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shrink-0">
                <User size={16} />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold truncate">User Profile</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Premium Member</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Nav Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-around p-2 z-50">
          <Link to="/" className="p-2 text-zinc-500 dark:text-zinc-400"><LayoutDashboard size={24} /></Link>
          <Link to="/warehouse" className="p-2 text-zinc-500 dark:text-zinc-400"><Warehouse size={24} /></Link>
          <Link to="/inventory" className="p-2 text-zinc-500 dark:text-zinc-400"><Package size={24} /></Link>
          <Link to="/search" className="p-2 text-zinc-500 dark:text-zinc-400"><Search size={24} /></Link>
          <Link to="/washes" className="p-2 text-zinc-500 dark:text-zinc-400"><Droplets size={24} /></Link>
        </div>

        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 h-14 flex items-center justify-between px-4 z-40">
           <span className="font-bold text-lg tracking-tight text-indigo-600">
            HeyCloset
          </span>
          <MobileThemeToggle />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pt-14 pb-20 md:pt-0 md:pb-0">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/warehouse" element={<WarehouseView />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/outfits" element={<Outfits />} />
              <Route path="/search" element={<AdvancedSearch />} />
              <Route path="/washes" element={<WashTracker />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/item/:id" element={<ItemDetail />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}

function MobileThemeToggle() {
  const { mode, setMode } = useTheme();
  const next: Record<ThemeMode, ThemeMode> = { system: 'dark', dark: 'light', light: 'system' };
  const icons: Record<ThemeMode, any> = { system: Monitor, dark: Moon, light: Sun };
  const Icon = icons[mode];
  return (
    <button
      onClick={() => setMode(next[mode])}
      className="p-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      title={`Theme: ${mode}`}
    >
      <Icon size={20} />
    </button>
  );
}
