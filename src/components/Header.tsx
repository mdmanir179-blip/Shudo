import React from 'react';
import { Menu, Plus, ShoppingBag, Calendar } from 'lucide-react';
import { ActiveTab } from './Navbar';
import { OrderRecord } from '../types';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeTab: ActiveTab;
  orders?: OrderRecord[];
  onOpenAddOrder?: () => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; category: string }> = {
  dashboard: { title: 'Dashboard Overview', category: 'Analytics & Orders' },
  portals: { title: 'Seller Portals', category: 'E-Commerce Hub' },
  sheets: { title: 'Google Sheets & Docs', category: 'Workspaces' },
  logs: { title: 'Update History & Logs', category: 'Activity Audit' }
};

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  activeTab,
  orders = [],
  onOpenAddOrder
}) => {
  const currentTab = TAB_TITLES[activeTab] || { title: 'OmniSeller Workspace', category: 'Workspace' };
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between shrink-0 select-none gap-3 shadow-xs">
      {/* Left: Sidebar toggle + Active Tab Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Hide Menu' : 'Show Menu'}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 shrink-0"
        >
          <Menu className="w-4 h-4" />
          {!isSidebarOpen && (
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Menu</span>
          )}
        </button>

        <div className="h-5 w-px bg-slate-200 shrink-0" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 hidden md:inline">
            {currentTab.category} /
          </span>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {currentTab.title}
          </h1>
        </div>
      </div>

      {/* Right: Quick actions (Date + Notification Center + Quick Order) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Date Notifications Bell Dropdown */}
        <NotificationCenter orders={orders || []} />

        {onOpenAddOrder && (
          <button
            onClick={onOpenAddOrder}
            title="Log new consignment PO"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <ShoppingBag className="w-3.5 h-3.5 hidden sm:inline" />
            <span>New PO Consignment</span>
          </button>
        )}
      </div>
    </header>
  );
};
