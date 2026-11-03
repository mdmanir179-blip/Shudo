import React, { useState } from 'react';
import { Menu, Plus, ShoppingBag, Calendar, Search, X } from 'lucide-react';
import { ActiveTab } from './Navbar';
import { OrderRecord, PortalLink, DocSheetItem } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { HeaderSearch } from './HeaderSearch';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeTab: ActiveTab;
  orders?: OrderRecord[];
  portals?: PortalLink[];
  documents?: DocSheetItem[];
  onOpenAddOrder?: () => void;
  onSelectOrder?: (order: OrderRecord) => void;
  onSelectPortal?: (portal: PortalLink) => void;
  onSelectDoc?: (doc: DocSheetItem) => void;
  onViewAllOrders?: (query: string) => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; category: string }> = {
  dashboard: { title: 'Executive Overview', category: 'Dashboard' },
  orders: { title: 'Consignments & Purchase Orders', category: 'Orders Management' },
  analytics: { title: 'Performance Trends & Metrics', category: 'Analytics Center' },
  portals: { title: 'Seller Portals Command Center', category: 'E-Commerce Hub' },
  sheets: { title: 'Google Sheets & Docs', category: 'Workspaces' },
  logs: { title: 'Update History & Audit Logs', category: 'Activity Audit' }
};

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  activeTab,
  orders = [],
  portals = [],
  documents = [],
  onOpenAddOrder,
  onSelectOrder,
  onSelectPortal,
  onSelectDoc,
  onViewAllOrders
}) => {
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const currentTab = TAB_TITLES[activeTab] || { title: 'OmniSeller Workspace', category: 'Workspace' };
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between shrink-0 select-none gap-2 sm:gap-4 shadow-xs relative z-30">
      {/* MOBILE SEARCH OVERLAY (WHEN ACTIVATED ON SMALL SCREENS) */}
      {isMobileSearchActive ? (
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1">
            <HeaderSearch
              orders={orders}
              portals={portals}
              documents={documents}
              onSelectOrder={(ord) => {
                setIsMobileSearchActive(false);
                onSelectOrder?.(ord);
              }}
              onSelectPortal={(p) => {
                setIsMobileSearchActive(false);
                onSelectPortal?.(p);
              }}
              onSelectDoc={(d) => {
                setIsMobileSearchActive(false);
                onSelectDoc?.(d);
              }}
              onViewAllOrders={(q) => {
                setIsMobileSearchActive(false);
                onViewAllOrders?.(q);
              }}
              className="w-full"
            />
          </div>
          <button
            onClick={() => setIsMobileSearchActive(false)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Close Search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <>
          {/* Left: Sidebar toggle + Active Tab Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
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

            <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 hidden xl:inline">
                {currentTab.category} /
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {currentTab.title}
              </h1>
            </div>
          </div>

          {/* Center: Global Search Bar (Visible on md and larger) */}
          <div className="flex-1 max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl mx-1 sm:mx-2 hidden md:block">
            <HeaderSearch
              orders={orders}
              portals={portals}
              documents={documents}
              onSelectOrder={onSelectOrder}
              onSelectPortal={onSelectPortal}
              onSelectDoc={onSelectDoc}
              onViewAllOrders={onViewAllOrders}
              className="w-full"
            />
          </div>

          {/* Right: Quick actions (Mobile Search Button + Date + Notification Center + Quick Order) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile Search Icon Toggle */}
            <button
              onClick={() => setIsMobileSearchActive(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="Search POs & Portals"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Date Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>

            {/* Date Notifications Bell Dropdown */}
            <NotificationCenter orders={orders || []} />

            {/* New PO Consignment Action */}
            {onOpenAddOrder && (
              <button
                onClick={onOpenAddOrder}
                title="Log new consignment PO"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <ShoppingBag className="w-3.5 h-3.5 hidden sm:inline" />
                <span className="hidden xs:inline">New PO</span>
                <span className="hidden md:inline">Consignment</span>
              </button>
            )}
          </div>
        </>
      )}
    </header>
  );
};
