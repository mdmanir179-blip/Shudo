import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Package,
  Store,
  FileSpreadsheet,
  FileText,
  Clock,
  Truck,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';
import { OrderRecord, PortalLink, DocSheetItem } from '../types';
import { PortalLogo } from '../utils/portalLogos';
import { isPOOpen, isPOInTransit, isPODelivered } from '../utils/poNotifications';

interface HeaderSearchProps {
  orders: OrderRecord[];
  portals: PortalLink[];
  documents: DocSheetItem[];
  onSelectOrder?: (order: OrderRecord) => void;
  onSelectPortal?: (portal: PortalLink) => void;
  onSelectDoc?: (doc: DocSheetItem) => void;
  onViewAllOrders?: (query: string) => void;
  className?: string;
}

export const HeaderSearch: React.FC<HeaderSearchProps> = ({
  orders = [],
  portals = [],
  documents = [],
  onSelectOrder,
  onSelectPortal,
  onSelectDoc,
  onViewAllOrders,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd/Ctrl + K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea or select
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileSearchOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching results
  const trimmed = query.trim().toLowerCase();

  const matchingOrders = useMemo(() => {
    if (!trimmed) return [];
    return orders.filter((o) => {
      const po = (o.poNumber || o.orderNumber || '').toLowerCase();
      const hub = (o.destinationHub || '').toLowerCase();
      const carrier = (o.carrier || '').toLowerCase();
      const portal = (o.portalName || '').toLowerCase();
      const status = (o.status || '').toLowerCase();
      const notes = (o.notes || '').toLowerCase();
      const date = (o.appointmentDate || o.shippingDate || o.date || '').toLowerCase();

      return (
        po.includes(trimmed) ||
        hub.includes(trimmed) ||
        carrier.includes(trimmed) ||
        portal.includes(trimmed) ||
        status.includes(trimmed) ||
        notes.includes(trimmed) ||
        date.includes(trimmed)
      );
    });
  }, [orders, trimmed]);

  const matchingPortals = useMemo(() => {
    if (!trimmed) return [];
    return portals.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const platform = (p.platform || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      return (
        name.includes(trimmed) ||
        platform.includes(trimmed) ||
        notes.includes(trimmed) ||
        category.includes(trimmed)
      );
    });
  }, [portals, trimmed]);

  const matchingDocs = useMemo(() => {
    if (!trimmed) return [];
    return documents.filter((d) => {
      const title = (d.title || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      const type = (d.type || '').toLowerCase();
      return title.includes(trimmed) || desc.includes(trimmed) || type.includes(trimmed);
    });
  }, [documents, trimmed]);

  const totalResults = matchingOrders.length + matchingPortals.length + matchingDocs.length;

  const handleSelectOrder = (order: OrderRecord) => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    if (onSelectOrder) {
      onSelectOrder(order);
    }
  };

  const handleSelectPortal = (portal: PortalLink) => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    if (onSelectPortal) {
      onSelectPortal(portal);
    }
  };

  const handleSelectDoc = (doc: DocSheetItem) => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    if (onSelectDoc) {
      onSelectDoc(doc);
    }
  };

  const handleViewAllOrders = () => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    if (onViewAllOrders) {
      onViewAllOrders(query);
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* DESKTOP SEARCH BAR INPUT */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search PO #, FC hub, carrier, portal, sheet..."
          className="w-full pl-9 pr-20 py-1.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/90 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 outline-none transition-all shadow-2xs"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd
              onClick={() => {
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs cursor-pointer select-none"
            >
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </div>
      </div>

      {/* DROPDOWN FLYOUT POPOVER */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-50 overflow-hidden max-h-[82vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* HEADER / QUICK FILTER CHIPS (WHEN QUERY IS EMPTY) */}
          {!trimmed ? (
            <div className="p-3 sm:p-4 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick Suggestions & Searches
                </span>
                <span className="text-[11px] text-slate-400">Press Esc to exit</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { label: 'Open Consignments', q: 'open' },
                  { label: 'In Transit POs', q: 'in_transit' },
                  { label: 'Swiggy Instamart', q: 'Swiggy' },
                  { label: 'Blinkit Quick', q: 'Blinkit' },
                  { label: 'Flipkart Hub', q: 'Flipkart' },
                  { label: 'Amazon Central', q: 'Amazon' },
                  { label: 'Meesho Orders', q: 'Meesho' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setQuery(item.q);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-medium transition-colors border border-slate-200/60"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* RECENT / SAMPLE ACTIVE POS */}
              {orders.length > 0 && (
                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                    Active Consignments ({orders.slice(0, 3).length} of {orders.length}):
                  </span>
                  <div className="space-y-1">
                    {orders.slice(0, 3).map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => handleSelectOrder(ord)}
                        className="p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PortalLogo name={ord.portalName} size="sm" />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate">
                              {ord.poNumber || ord.orderNumber}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {ord.destinationHub || ord.carrier || 'Consignment'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            isPOOpen(ord.status)
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isPOInTransit(ord.status)
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {ord.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* RESULTS LIST WHEN QUERY IS PRESENT */
            <div className="overflow-y-auto divide-y divide-slate-100 text-xs">
              {/* SUMMARY BAR */}
              <div className="px-3.5 py-2 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Found <strong className="text-slate-800">{totalResults}</strong> match
                  {totalResults === 1 ? '' : 'es'} for &quot;{query}&quot;
                </span>
                {matchingOrders.length > 0 && (
                  <button
                    onClick={handleViewAllOrders}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    View in Orders <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* 1. CONSIGNMENT POS SECTION */}
              {matchingOrders.length > 0 && (
                <div className="p-2 sm:p-2.5">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <Package className="w-3.5 h-3.5" />
                      Consignments / Purchase Orders ({matchingOrders.length})
                    </span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingOrders.slice(0, 5).map((ord) => {
                      const isOpenState = isPOOpen(ord.status);
                      const isInTransitState = isPOInTransit(ord.status);
                      const isDeliveredState = isPODelivered(ord.status);

                      return (
                        <div
                          key={ord.id}
                          onClick={() => handleSelectOrder(ord)}
                          className="p-2 sm:p-2.5 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-200 cursor-pointer transition-all group flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <PortalLogo name={ord.portalName} size="sm" className="mt-0.5" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {ord.poNumber || ord.orderNumber}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400">
                                  • {ord.portalName}
                                </span>
                              </div>

                              {ord.destinationHub && (
                                <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{ord.destinationHub}</span>
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-500">
                                {ord.carrier && (
                                  <span className="flex items-center gap-1">
                                    <Truck className="w-3 h-3 text-slate-400" />
                                    {ord.carrier}
                                  </span>
                                )}
                                {ord.appointmentDate && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    Appt: {ord.appointmentDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                                isOpenState
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : isInTransitState
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : isDeliveredState
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {ord.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {ord.amount ? (
                              <div className="font-bold text-xs text-slate-900 mt-1">
                                ₹{ord.amount.toLocaleString('en-IN')}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. SELLER PORTALS SECTION */}
              {matchingPortals.length > 0 && (
                <div className="p-2 sm:p-2.5">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 text-purple-600">
                    <Store className="w-3.5 h-3.5" />
                    Seller Portals ({matchingPortals.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingPortals.slice(0, 4).map((portal) => (
                      <div
                        key={portal.id}
                        onClick={() => handleSelectPortal(portal)}
                        className="p-2 rounded-xl hover:bg-purple-50/50 border border-transparent hover:border-purple-200 cursor-pointer transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PortalLogo
                            name={portal.name}
                            logoUrl={portal.logoUrl}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-purple-700">
                              {portal.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {portal.notes || portal.url}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Open Portal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. GOOGLE WORKSPACE SHEETS & DOCS SECTION */}
              {matchingDocs.length > 0 && (
                <div className="p-2 sm:p-2.5">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Google Sheets & Documents ({matchingDocs.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingDocs.slice(0, 4).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc)}
                        className="p-2 rounded-xl hover:bg-emerald-50/50 border border-transparent hover:border-emerald-200 cursor-pointer transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              doc.type === 'sheet'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {doc.type === 'sheet' ? (
                              <FileSpreadsheet className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 block truncate">
                              {doc.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {doc.description || (doc.type === 'sheet' ? 'Google Sheet Tracker' : 'Google Doc')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          View Sheet
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {totalResults === 0 && (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-700 text-xs">
                    No results found for &quot;{query}&quot;
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Try searching by PO number (e.g. PO-SWG), FC hub name, carrier, portal, or sheet title.
                  </p>
                  <button
                    onClick={clearSearch}
                    className="mt-3 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {/* FOOTER ACTION */}
              {matchingOrders.length > 5 && (
                <div className="p-2.5 bg-slate-50 text-center">
                  <button
                    onClick={handleViewAllOrders}
                    className="w-full py-1.5 px-3 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-300 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View all {matchingOrders.length} matching POs in Orders tab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
