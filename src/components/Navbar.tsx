import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Store,
  FileSpreadsheet,
  History,
  Plus,
  LogOut,
  ShoppingBag,
  ExternalLink,
  User,
  ShieldCheck
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'portals' | 'sheets' | 'logs';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddPortal: () => void;
  onOpenAddDoc: () => void;
  onOpenAddOrder: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddPortal,
  onOpenAddDoc,
  onOpenAddOrder,
  onOpenAuth
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Platform Pills */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg flex items-center gap-1.5">
                  OmniSeller<span className="text-blue-600">Hub</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-400 font-medium">
                  Multi-Channel & Sheets Workspace
                </span>
              </div>
            </div>

            {/* Quick mini-pills for key platforms */}
            <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Flipkart
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Amazon
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                Meesho
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                Swiggy
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Blinkit
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Orders & Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('portals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'portals'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Seller Portals</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'sheets'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Sheets & Docs</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'logs'
                  ? 'bg-white text-purple-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Sheet Audit Logs</span>
            </button>
          </nav>

          {/* Right Action Buttons & User Menu */}
          <div className="flex items-center gap-2">
            {/* Quick Record Order button */}
            <button
              onClick={onOpenAddOrder}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all hover:shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Order</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="text-left hidden lg:block leading-tight">
                    <div className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-[11px] font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2 ${
              activeTab === 'dashboard' ? 'text-blue-600 font-bold' : ''
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('portals')}
            className={`flex flex-col items-center py-1 px-2 ${
              activeTab === 'portals' ? 'text-blue-600 font-bold' : ''
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Portals</span>
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex flex-col items-center py-1 px-2 ${
              activeTab === 'sheets' ? 'text-emerald-600 font-bold' : ''
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sheets</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center py-1 px-2 ${
              activeTab === 'logs' ? 'text-purple-600 font-bold' : ''
            }`}
          >
            <History className="w-4 h-4" />
            <span>Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
