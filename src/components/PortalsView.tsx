import React, { useState } from 'react';
import { PortalLink } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import {
  Store,
  Plus,
  ExternalLink,
  Trash2,
  Edit2,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShoppingBag,
  Shield,
  Info,
  CheckCircle2,
  Laptop
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
  const [fullscreen, setFullscreen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} link?`)) return;
    try {
      await deleteDoc(doc(db, 'portals', id));
      if (selectedPortal?.id === id) {
        onSelectPortal(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `portals/${id}`);
    }
  };

  const startEdit = (p: PortalLink) => {
    setEditingId(p.id);
    setEditUrl(p.url);
    setEditNotes(p.notes || '');
  };

  const saveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'portals', id), {
        url: editUrl.trim(),
        notes: editNotes.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `portals/${id}`);
    }
  };

  return (
    <div className={`space-y-6 ${fullscreen ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : ''}`}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Seller Portals Hub</h1>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              Direct Software Run
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manually manage and launch Flipkart, Amazon, Meesho, Swiggy, and Blinkit seller links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {fullscreen && (
            <button
              onClick={() => setFullscreen(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          )}

          <button
            onClick={onOpenAddPortal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Portal Link</span>
          </button>
        </div>
      </div>

      {/* Quick Launch Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {portals.map((p) => {
          const isSelected = selectedPortal?.id === p.id;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPortal(p)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color || '#3B82F6' }}
                  />
                  <span className="font-bold text-xs text-slate-900 truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Launch external seller hub"
                    className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id, p.name);
                    }}
                    title="Delete link"
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[11px] font-mono text-slate-500 truncate">
                {p.url.replace(/^https?:\/\//, '')}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 capitalize">{p.platform}</span>
                <span className={`font-semibold ${isSelected ? 'text-blue-600' : 'text-slate-600 group-hover:text-slate-900'}`}>
                  {isSelected ? 'Active Now' : 'Click to Run →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-Software Live Workspace / Runner Frame */}
      {selectedPortal ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Workspace Action Toolbar */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selectedPortal.color || '#3B82F6' }}
              />
              <div>
                <span className="font-bold text-slate-900 text-sm">{selectedPortal.name}</span>
                <span className="text-xs text-slate-400 ml-2 font-mono">
                  {selectedPortal.url}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIframeKey((prev) => prev + 1)}
                title="Reload Session"
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reload</span>
              </button>

              <button
                onClick={onOpenAddOrder}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ Log Order from {selectedPortal.name}</span>
              </button>

              <a
                href={selectedPortal.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Pop-out Window</span>
              </a>

              <button
                onClick={() => setFullscreen(!fullscreen)}
                title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen Workspace'}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg text-xs transition-colors"
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Direct Software Running Area */}
          <div className="relative bg-slate-100 min-h-[560px] flex flex-col">
            {/* Embedded Iframe */}
            <iframe
              key={iframeKey}
              src={selectedPortal.url}
              title={selectedPortal.name}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              className="w-full flex-1 border-0 min-h-[560px] bg-white"
            />

            {/* Smart fallback banner if browser security policy limits embedding for e-commerce login pages */}
            <div className="p-3 bg-amber-50 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800">
              <div className="flex items-start sm:items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>Seller Portal Security Notice:</strong> E-commerce platforms like Flipkart and Amazon may restrict embedding their password login forms in third-party iframes for security. If the frame above displays a blank screen or connection refusal, click <strong>"Pop-out Window"</strong> to run directly while keeping this software open side-by-side!
                </span>
              </div>
              <a
                href={selectedPortal.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-center transition-colors"
              >
                Open Direct Seller Portal ↗
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Select a Seller Portal to Run</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Click on Flipkart, Amazon, Meesho, Swiggy, or Blinkit above to launch the seller dashboard directly in this workspace.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {portals.length > 0 && (
              <button
                onClick={() => onSelectPortal(portals[0])}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Launch {portals[0].name}
              </button>
            )}
            <button
              onClick={onOpenAddPortal}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              + Add Custom Seller Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
