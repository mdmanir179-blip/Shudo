import React from 'react';
import { ActiveTab } from './Navbar';
import {
  LayoutDashboard,
  Store,
  FileSpreadsheet,
  History,
  Plus,
  Maximize2,
  Minimize2,
  Trash2,
  PanelLeftClose,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddPortal: () => void;
  onOpenAddDoc: () => void;
  onOpenAddOrder: () => void;
  onOpenClearData: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddPortal,
  onOpenAddDoc,
  onOpenAddOrder,
  onOpenClearData,
  isFullscreen,
  onToggleFullscreen,
  isOpen,
  onToggleOpen
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-60 h-full bg-white border-r border-slate-200 flex flex-col shrink-0 select-none z-30 transition-all duration-200 ease-in-out">
      {/* Top Header with ONLY LOGO IMAGE and Hide Menu button */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
        <button
          onClick={() => setActiveTab('dashboard')}
          title="OmniSeller Desktop Workspace"
          className="flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <img
            src="/logo.svg"
            alt="Logo"
            className="w-9 h-9 object-contain drop-shadow-sm hover:scale-105 transition-transform"
          />
        </button>

        {/* Hide menu button */}
        <button
          onClick={onToggleOpen}
          title="Hide Sidebar Menu"
          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Menu Links */}
      <div className="flex-1 px-3 py-3.5 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Workspace Menu
        </div>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'logs'
              ? 'bg-purple-600 text-white shadow-xs shadow-purple-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>Audit & Update Logs</span>
        </button>

        {/* Quick Actions in Sidebar */}
        <div className="pt-3 mt-2 border-t border-slate-100 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Quick Actions
          </div>

          <button
            onClick={onOpenAddOrder}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Record Order</span>
          </button>

          <button
            onClick={onOpenAddDoc}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Add Google Sheet</span>
          </button>

          <button
            onClick={onOpenAddPortal}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Add Portal Link</span>
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
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

        {/* Clear Data Button (opens ClearDataModal) */}
        <button
          onClick={onOpenClearData}
          title="Wipe demo orders and sample sheets"
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span>Clear Workspace Data</span>
        </button>

        {/* Direct Workspace Status */}
        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Direct Mode Active
          </span>
          <span className="text-slate-400">v2.1</span>
        </div>
      </div>
    </aside>
  );
};
