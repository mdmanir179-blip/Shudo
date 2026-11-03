import React from 'react';
import { PortalLink, OrderRecord } from '../types';
import { Plus, Menu, PanelLeft } from 'lucide-react';

interface HeaderProps {
  portals: PortalLink[];
  selectedPortal: PortalLink | null;
  onSelectPortal: (portal: PortalLink) => void;
  onOpenAddPortal: () => void;
  orders: OrderRecord[];
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const PORTAL_COLORS: Record<string, string> = {
  'Flipkart': '#2874F0',
  'Amazon': '#FF9900',
  'Meesho': '#8B1E5D',
  'Swiggy': '#FC8019',
  'Blinkit': '#0C831F'
};

export const Header: React.FC<HeaderProps> = ({
  portals,
  selectedPortal,
  onSelectPortal,
  onOpenAddPortal,
  orders,
  isSidebarOpen,
  onToggleSidebar
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between shrink-0 overflow-x-auto select-none gap-2">
      {/* Menu Hide/Show Toggle Button (as requested: "menu hide/show button add koro") */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Hide Menu' : 'Show Menu'}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200/80"
        >
          <Menu className="w-4 h-4" />
          {!isSidebarOpen && (
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Menu</span>
          )}
        </button>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
      </div>

      {/* Portals list (SHOW ONLY PORTALS IN HEADER: "hedder a sudhu portal guli show koro") */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1">
        {portals.map((p) => {
          const isSelected = selectedPortal?.id === p.id;
          const portalOrdersCount = orders.filter((o) => o.portalName.toLowerCase() === p.name.toLowerCase()).length;
          const color = p.color || PORTAL_COLORS[p.name] || '#3B82F6';

          return (
            <button
              key={p.id}
              onClick={() => onSelectPortal(p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="truncate">{p.name}</span>

              {portalOrdersCount > 0 ? (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {portalOrdersCount}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* Quick Add Portal link button right beside portals */}
        <button
          onClick={onOpenAddPortal}
          title="Add New Seller Portal Link"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 bg-white transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Portal</span>
        </button>
      </div>
    </header>
  );
};
