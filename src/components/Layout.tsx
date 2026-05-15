import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart3, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Truck,
  FileText,
  Shield,
  Building2
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useState } from 'react';
import { cn, formatDate } from '../lib/utils';

export default function Layout() {
  const { user, profile, business, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/', roles: ['owner', 'manager'] },
    { name: 'POS Terminal', icon: ShoppingBag, path: '/pos', roles: ['owner', 'manager', 'cashier'] },
    { name: 'Branches', icon: Building2, path: '/branches', roles: ['owner', 'manager'] },
    { name: 'Inventory', icon: Package, path: '/inventory', roles: ['owner', 'manager', 'inventory'] },
    { name: 'Transactions', icon: FileText, path: '/transactions', roles: ['owner', 'manager', 'cashier', 'accountant'] },
    { name: 'Expenses', icon: CreditCard, path: '/expenses', roles: ['owner', 'manager', 'accountant'] },
    { name: 'Customers', icon: Users, path: '/customers', roles: ['owner', 'manager', 'cashier'] },
    { name: 'Stock Transfer', icon: Truck, path: '/transfers', roles: ['owner', 'manager', 'inventory'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['owner'] },
  ];

  const filteredNav = isAdmin 
    ? [{ name: 'Global Ops', icon: Shield, path: '/global-ops', roles: [] }]
    : navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <ShoppingBag size={18} />
          </div>
          <span className="font-bold text-slate-800 truncate max-w-[150px]">
            {business?.name || 'Biashara POS'}
          </span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-500">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              B
            </div>
            <span className="text-xl font-bold tracking-tight text-white truncate">
              {business?.name || 'Biashara POS'}
            </span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-indigo-600/20 text-indigo-400" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon size={20} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="p-6 border-t border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 font-bold">Nex-Ink Operations</div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-400/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 font-bold uppercase">
                {profile?.name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{profile?.name || user?.email}</p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">
                  {profile?.role || (isAdmin ? 'Super Admin' : '')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-all"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Placeholder/Induction for Desktop */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0">
           <div className="flex items-center gap-4">
             <h2 className="text-lg font-bold text-slate-800">Operations</h2>
             <div className="h-4 w-px bg-slate-200"></div>
             <p className="text-sm text-slate-500 font-medium">{formatDate(new Date())}</p>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-px h-6 bg-slate-200"></div>
             <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest">System Online</span>
             </div>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </div>

        {/* Footer Branding */}
        <footer className="px-8 py-4 bg-white border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-medium mt-auto">
          <p>© 2024 Biashara POS • Built by Jackson Mwaniki</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-800 cursor-pointer">KISWAHILI</span>
            <span className="text-indigo-600 underline cursor-pointer">ENGLISH</span>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        <NavLink to="/" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-indigo-600" : "text-slate-400")}>
          <BarChart3 size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>
        <NavLink to="/pos" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-indigo-600" : "text-slate-400")}>
          <ShoppingBag size={20} />
          <span className="text-[10px] font-medium">POS</span>
        </NavLink>
        <div className="w-12 h-12 bg-indigo-600 rounded-full -mt-10 flex items-center justify-center text-white shadow-lg border-4 border-gray-50">
           <ShoppingBag size={24} />
        </div>
        <NavLink to="/inventory" className={({ isActive }) => cn("flex flex-col items-center gap-1", isActive ? "text-indigo-600" : "text-slate-400")}>
          <Package size={20} />
          <span className="text-[10px] font-medium">Stock</span>
        </NavLink>
        <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1 text-slate-400">
          <Menu size={20} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>
    </div>
  );
}
