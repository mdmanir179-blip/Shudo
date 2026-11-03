import React, { useState } from 'react';
import { PortalLink } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import {
  Store,
  Plus,
  ExternalLink,
  Trash2,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShoppingBag,
  Info,
  X,
  ArrowLeft
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

  // FULL SCREEN PORTAL RUNNER VIEW (as requested: "jokhon kono portal click korbo setike full screen a sho koro")
  if (selectedPortal) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-150">
        {/* Fullscreen Workspace Top Control Bar */}
        <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back / Exit Fullscreen button */}
            <button
              onClick={() => onSelectPortal(null)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 text-xs font-semibold shrink-0"
              title="Exit Fullscreen Portal View"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Full Screen</span>
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
                ({selectedPortal.url})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIframeKey((prev) => prev + 1)}
              title="Reload Portal Session"
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reload</span>
            </button>

            <button
              onClick={onOpenAddOrder}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>+ Log Order</span>
            </button>

            <a
              href={selectedPortal.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Pop-out Tab</span>
            </a>

            <button
              onClick={() => onSelectPortal(null)}
              title="Close Portal"
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Portal Embedded Frame filling remainder of the full screen */}
        <div className="flex-1 relative bg-slate-100 flex flex-col overflow-hidden">
          <iframe
            key={iframeKey}
            src={selectedPortal.url}
            title={selectedPortal.name}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            className="w-full flex-1 border-0 bg-white"
          />

          {/* Fallback info bar */}
          <div className="p-2.5 bg-amber-50 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 shrink-0">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                If <strong>{selectedPortal.name}</strong> displays a blank screen due to portal login security headers, click <strong>"Pop-out Tab"</strong> to run directly side-by-side!
              </span>
            </div>
            <a
              href={selectedPortal.url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-center transition-colors"
            >
              Direct Link ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT PORTALS GRID (shown when no portal is currently launched in full screen)
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Seller Portals Hub</h1>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              Click to Run Full Screen
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click on any portal below or from the top header to launch it immediately in full screen.
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
          return (
            <div
              key={p.id}
              onClick={() => onSelectPortal(p)}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group relative"
            >
              {/* Top color indicator */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
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

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in new window"
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

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
                  {p.url.replace(/^https?:\/\//, '')}
                </div>

                {p.notes && (
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                    {p.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 capitalize">{p.platform}</span>
                <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Launch Full Screen</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
