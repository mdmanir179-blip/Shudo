import React, { useState } from 'react';
import { PortalLink, OrderStatus } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, deleteDoc, collection, addDoc } from 'firebase/firestore';
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
  Sparkles,
  Zap,
  CheckCircle2,
  Laptop,
  Edit2
} from 'lucide-react';
import { PortalLogo } from '../utils/portalLogos';
import { EditPortalModal } from './EditPortalModal';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useIframeMode, setUseIframeMode] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [editingPortal, setEditingPortal] = useState<PortalLink | null>(null);

  // Quick in-desk order logger states
  const [quickOrderId, setQuickOrderId] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickStatus, setQuickStatus] = useState<OrderStatus>('pending');
  const [quickCustomer, setQuickCustomer] = useState('');
  const [quickLogging, setQuickLogging] = useState(false);
  const [quickLoggedSuccess, setQuickLoggedSuccess] = useState(false);

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
      `portal_window_${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      'width=1280,height=850,menubar=no,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes'
    );
    if (win) {
      win.focus();
    }
  };

  const handleDirectOrderSubmit = async (e: React.FormEvent, portalName: string) => {
    e.preventDefault();
    if (!quickAmount) return;

    setQuickLogging(true);
    try {
      const parsedAmount = parseFloat(quickAmount) || 0;
      const orderNum = quickOrderId.trim()
        ? quickOrderId.trim()
        : `${portalName.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      await addDoc(collection(db, 'orders'), {
        portalName,
        orderNumber: orderNum,
        customerName: quickCustomer.trim() || 'Direct Customer',
        amount: parsedAmount,
        itemsCount: 1,
        status: quickStatus,
        date: new Date().toISOString().split('T')[0],
        ownerId: 'workspace_user',
        createdAt: new Date().toISOString()
      });

      setQuickLoggedSuccess(true);
      setTimeout(() => {
        setQuickLoggedSuccess(false);
        setQuickOrderId('');
        setQuickAmount('');
        setQuickCustomer('');
      }, 900);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    } finally {
      setQuickLogging(false);
    }
  };

  // FULL SCREEN LIVE PORTAL DESK VIEW
  if (selectedPortal) {
    const cleanUrl = getCleanUrl(selectedPortal.url);
    const hostname = (() => {
      try {
        return new URL(cleanUrl).hostname;
      } catch {
        return cleanUrl;
      }
    })();

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-150">
        {/* Workspace Top Control Toolbar */}
        <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                onSelectPortal(null);
                setUseIframeMode(false);
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 text-xs font-semibold shrink-0"
              title="Return to Hub"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2.5 truncate">
              <PortalLogo name={selectedPortal.name} logoUrl={selectedPortal.logoUrl} size="md" />
              <span className="font-extrabold text-slate-900 text-sm truncate">
                {selectedPortal.name}
              </span>
              <span className="hidden md:inline text-xs font-mono text-slate-400 truncate">
                ({cleanUrl})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Primary Action: Launch Direct Live Portal Desk */}
            <button
              onClick={() => launchDedicatedWindow(cleanUrl, selectedPortal.name)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:shadow-blue-500/25"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Live Desk</span>
            </button>

            <button
              onClick={() => handleCopy(selectedPortal.id, cleanUrl)}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs transition-colors"
              title="Copy Portal URL"
            >
              {copiedId === selectedPortal.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                onSelectPortal(null);
                setUseIframeMode(false);
              }}
              title="Close Workspace"
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Workspace Body */}
        <div className="flex-1 bg-slate-50/60 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start">
          {useIframeMode ? (
            // User requested to test embedded iframe
            <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Testing In-App Embedded Frame for {selectedPortal.name}</span>
                <button
                  onClick={() => setUseIframeMode(false)}
                  className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  Switch back to Live Desk Command Center
                </button>
              </div>
              <iframe
                key={iframeKey}
                src={cleanUrl}
                title={selectedPortal.name}
                className="w-full flex-1 border-0 bg-white min-h-[500px]"
              />
            </div>
          ) : (
            // PROFESSIONAL LIVE COMMAND CENTER (ELIMINATES THE SAD BROKEN IFRAME ICON)
            <div className="w-full max-w-4xl space-y-6">
              {/* Main Launch Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 text-center relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ backgroundColor: selectedPortal.color || '#3B82F6' }}
                />

                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 shadow-xs border border-slate-200/80 p-2">
                  <PortalLogo name={selectedPortal.name} logoUrl={selectedPortal.logoUrl} size="lg" className="w-12 h-12" />
                </div>

                <div className="flex items-center justify-center gap-2.5 mb-1">
                  <PortalLogo name={selectedPortal.name} logoUrl={selectedPortal.logoUrl} size="md" />
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedPortal.name}
                  </h2>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mt-1 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Seller Desk Ready • Direct SSL Connection
                </div>

                <p className="text-xs text-slate-500 max-w-lg mx-auto font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 break-all mb-6">
                  {cleanUrl}
                </p>

                {/* BIG PRIMARY LAUNCH BUTTON */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => launchDedicatedWindow(cleanUrl, selectedPortal.name)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Run {selectedPortal.name} Live Desk Window</span>
                  </button>

                  <a
                    href={cleanUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span>Open in New Browser Tab</span>
                  </a>
                </div>

                {/* Explanation why Flipkart/Amazon run in direct windows */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    Secured by {hostname}: Direct window execution bypasses browser X-Frame restrictions for safe order packing & logins.
                  </span>
                </div>
              </div>

              {/* Side-by-side or below: Live Order Logging Console for this Portal */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2.5">
                    <PortalLogo name={selectedPortal.name} logoUrl={selectedPortal.logoUrl} size="sm" />
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Quick Order Entry for {selectedPortal.name}
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Log orders directly while viewing your seller dashboard
                  </span>
                </div>

                {quickLoggedSuccess ? (
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center animate-in fade-in">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1 animate-bounce" />
                    <div className="font-bold text-slate-900 text-xs">Order Saved into Hub!</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">Updated metrics and trend charts immediately.</div>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleDirectOrderSubmit(e, selectedPortal.name)} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Order ID / Ref</label>
                      <input
                        type="text"
                        placeholder="Auto-generated if blank"
                        value={quickOrderId}
                        onChange={(e) => setQuickOrderId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        placeholder="499"
                        value={quickAmount}
                        onChange={(e) => setQuickAmount(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-800 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                      <select
                        value={quickStatus}
                        onChange={(e) => setQuickStatus(e.target.value as OrderStatus)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={quickLogging || !quickAmount}
                        className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                      >
                        {quickLogging ? 'Saving...' : '+ Record Order'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Advanced option: Test Iframe if user wishes */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setUseIframeMode(true)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline transition-colors"
                >
                  Test In-App Embedded Frame Mode (May be blocked by {hostname})
                </button>
              </div>
            </div>
          )}
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
              Live Desktop Execution
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
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PortalLogo name={p.name} logoUrl={p.logoUrl} size="md" />
                    <span className="font-extrabold text-sm text-slate-900 truncate">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingPortal(p)}
                      title="Edit Portal Logo & Details"
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

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
                  <span>Open In-App Desk & Sync</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Portal Modal */}
      <EditPortalModal
        portal={editingPortal}
        isOpen={!!editingPortal}
        onClose={() => setEditingPortal(null)}
      />
    </div>
  );
};
