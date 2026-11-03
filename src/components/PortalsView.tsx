import React, { useState } from 'react';
import { PortalLink } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, deleteDoc } from 'firebase/firestore';
import {
  Store,
  Plus,
  ExternalLink,
  Trash2,
  RefreshCw,
  ShoppingBag,
  Info,
  X,
  ArrowLeft,
  Copy,
  Check,
  Globe,
  Monitor,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';

interface PortalsViewProps {
  portals: PortalLink[];
  selectedPortal: PortalLink | null;
  onSelectPortal: (portal: PortalLink | null) => void;
  onOpenAddPortal: () => void;
  onOpenAddOrder: () => void;
}

export const PortalsView: React.FC<PortalsViewProps> = ({
  portals,
  selectedPortal,
  onSelectPortal,
  onOpenAddPortal,
  onOpenAddOrder
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [runnerMode, setRunnerMode] = useState<'split' | 'frame'>('split');

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'portals', id));
      if (selectedPortal?.id === id) {
        onSelectPortal(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `portals/${id}`);
    }
  };

  const getCleanUrl = (url: string) => {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return 'https://' + trimmed;
    }
    return trimmed;
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(getCleanUrl(url));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const launchDedicatedWindow = (url: string, name: string) => {
    const clean = getCleanUrl(url);
    const win = window.open(
      clean,
      `portal_${name.replace(/\s+/g, '_')}`,
      'width=1280,height=850,menubar=no,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes'
    );
    if (win) {
      win.focus();
    }
  };

  // FULL-SCREEN PORTAL RUNNER WORKSPACE VIEW
  if (selectedPortal) {
    const cleanUrl = getCleanUrl(selectedPortal.url);

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-150">
        {/* Workspace Top Control Toolbar */}
        <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onSelectPortal(null)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 text-xs font-semibold shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2 truncate">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selectedPortal.color || '#3B82F6' }}
              />
              <span className="font-extrabold text-slate-900 text-sm truncate">
                {selectedPortal.name}
              </span>
              <span className="hidden md:inline text-xs font-mono text-slate-400 truncate">
                ({cleanUrl})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Window Launch Button (100% bypasses X-Frame-Options) */}
            <button
              onClick={() => launchDedicatedWindow(cleanUrl, selectedPortal.name)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shadow-blue-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Live Portal Desk</span>
            </button>

            <button
              onClick={onOpenAddOrder}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Record Order</span>
            </button>

            <button
              onClick={() => handleCopy(selectedPortal.id, cleanUrl)}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs transition-colors"
              title="Copy URL"
            >
              {copiedId === selectedPortal.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => onSelectPortal(null)}
              title="Close Workspace"
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Workspace Container */}
        <div className="flex-1 relative bg-slate-100 flex flex-col overflow-hidden">
          {/* Top Session Status Banner */}
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">Live Seller Session Active:</span>
              <span className="text-blue-700">{selectedPortal.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">
                Flipkart, Amazon, Meesho, Swiggy, & Blinkit require direct window execution.
              </span>
              <button
                onClick={() => launchDedicatedWindow(cleanUrl, selectedPortal.name)}
                className="px-2.5 py-0.5 bg-blue-600 text-white font-bold rounded-lg text-[11px] hover:bg-blue-700 transition-colors"
              >
                Open Direct Desk ↗
              </button>
            </div>
          </div>

          {/* Embedded Frame + Helper Panel */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Embedded Web View */}
            <div className="flex-1 flex flex-col relative bg-white border-r border-slate-200">
              <iframe
                key={iframeKey}
                src={cleanUrl}
                title={selectedPortal.name}
                className="w-full flex-1 border-0 bg-white min-h-[400px]"
              />

              {/* In-Frame Helper Notification in case browser blocks iframe cross-origin headers */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    If the frame above displays <strong>"{new URL(cleanUrl).hostname} refused to connect"</strong>, this is because major e-commerce platforms block 3rd-party browser iframes for security. Click <strong>"Launch Live Portal Desk"</strong> above to run it in a dedicated window!
                  </span>
                </div>
                <button
                  onClick={() => launchDedicatedWindow(cleanUrl, selectedPortal.name)}
                  className="shrink-0 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-center"
                >
                  Run in Dedicated Desk Window ↗
                </button>
              </div>
            </div>

            {/* Side-by-Side Quick Management Desk */}
            <div className="w-full md:w-80 bg-white p-4 overflow-y-auto shrink-0 flex flex-col justify-between border-t md:border-t-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Portal Actions & Sync
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="font-bold text-slate-900">{selectedPortal.name}</div>
                  <div className="font-mono text-[11px] text-slate-500 break-all">{cleanUrl}</div>
                  {selectedPortal.notes && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      {selectedPortal.notes}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => launchDedicatedWindow(cleanUrl, selectedPortal.name)}
                    className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch in Dedicated Window</span>
                  </button>

                  <a
                    href={cleanUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span>Open in Standard New Tab</span>
                  </a>

                  <button
                    onClick={onOpenAddOrder}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>+ Log Order from this Portal</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                Connected to OmniSeller Centralized Hub
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT PORTALS GRID
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Seller Portals Hub</h1>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              Direct Software Run
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manually add and run seller portals for Flipkart, Amazon, Meesho, Swiggy, and Blinkit.
          </p>
        </div>

        <button
          onClick={onOpenAddPortal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Portal Link</span>
        </button>
      </div>

      {/* Portals Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {portals.map((p) => {
          const cleanUrl = getCleanUrl(p.url);

          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group relative"
            >
              {/* Top brand color stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                style={{ backgroundColor: p.color || '#3B82F6' }}
              />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color || '#3B82F6' }}
                    />
                    <span className="font-extrabold text-sm text-slate-900 truncate">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(p.id, cleanUrl)}
                      title="Copy URL"
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    >
                      {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {deleteConfirmId === p.id ? (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-2 py-0.5 text-[10px] bg-rose-600 text-white font-bold rounded"
                      >
                        Confirm
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(p.id)}
                        title="Delete link"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-xs font-mono text-slate-500 truncate">
                  {cleanUrl.replace(/^https?:\/\//, '')}
                </div>

                {p.notes && (
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                    {p.notes}
                  </p>
                )}
              </div>

              {/* Action buttons on portal card */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                {/* One-Click Direct Launch Desk */}
                <button
                  onClick={() => launchDedicatedWindow(cleanUrl, p.name)}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Run Live Portal Desk</span>
                </button>

                <button
                  onClick={() => onSelectPortal(p)}
                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Open In-App Workspace</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
