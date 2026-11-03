import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';
import {
  LayoutDashboard,
  Store,
  FileSpreadsheet,
  History,
  Plus,
  LogOut,
  Maximize2,
  Minimize2,
  Trash2,
  User,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddPortal: () => void;
  onOpenAddDoc: () => void;
  onOpenAddOrder: () => void;
  onOpenAuth: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddPortal,
  onOpenAddDoc,
  onOpenAddOrder,
  onOpenAuth,
  isFullscreen,
  onToggleFullscreen
}) => {
  const { currentUser, logout, clearAllDemoData } = useAuth();

  const handleClearDemo = async () => {
    if (window.confirm('Are you sure you want to remove all demo data? This will clear all test orders, sheets, and logs.')) {
      await clearAllDemoData();
    }
  };

  return (
    <aside className="w-60 h-full bg-white border-r border-slate-200 flex flex-col shrink-0 select-none z-30 transition-all">
      {/* Top: ONLY LOGO IMAGE (No logo text as requested: "logo text guli remove koro. sudhu logo image rakho") */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <button
          onClick={() => setActiveTab('dashboard')}
          title="OmniSeller Desktop Workspace"
          className="flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <img
            src="/logo.svg"
            alt="Logo"
            className="w-10 h-10 object-contain drop-shadow-sm hover:scale-105 transition-transform"
          />
        </button>
      </div>

      {/* Navigation Menu Links */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Navigation
        </div>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Orders & Trends</span>
        </button>

        <button
          onClick={() => setActiveTab('portals')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'portals'
              ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4 shrink-0" />
          <span>Seller Portals</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'sheets'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span>Sheets & Docs</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'logs'
              ? 'bg-purple-600 text-white shadow-xs shadow-purple-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>Audit & Update Logs</span>
        </button>

        {/* Quick Actions in Sidebar */}
        <div className="pt-4 mt-3 border-t border-slate-100 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Quick Actions
          </div>

          <button
            onClick={onOpenAddOrder}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Record Order</span>
          </button>

          <button
            onClick={onOpenAddDoc}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Add Google Sheet</span>
          </button>
        </div>
      </div>

      {/* Bottom User Profile & Desktop App Controls */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/60">
        {/* Fullscreen Computer Mode Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen App'}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">F11</span>
        </button>

        {/* Clear Demo Data Button */}
        {currentUser && (
          <button
            onClick={handleClearDemo}
            title="Wipe demo orders and sample sheets"
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Demo Data</span>
          </button>
        )}

        {/* User Session Bar */}
        {currentUser ? (
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
            <div className="flex items-center gap-2 min-w-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentUser.email}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
};
