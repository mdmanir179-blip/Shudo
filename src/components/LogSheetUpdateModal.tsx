import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { DocSheetItem } from '../types';
import { X, Clock, UserCheck, CheckCircle2, History } from 'lucide-react';

interface LogSheetUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocSheetItem | null;
  onLogged?: () => void;
}

export const LogSheetUpdateModal: React.FC<LogSheetUpdateModalProps> = ({
  isOpen,
  onClose,
  document,
  onLogged
}) => {
  const { currentUser } = useAuth();
  const [userName, setUserName] = useState(
    () => currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Team Member'
  );
  const [changeSummary, setChangeSummary] = useState('');
  const [affectedRange, setAffectedRange] = useState('');
  const [actionType, setActionType] = useState<
    'inventory_update' | 'order_sync' | 'price_change' | 'data_entry' | 'general_edit'
  >('data_entry');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !document) return null;

  const currentFormattedTime = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !changeSummary.trim()) return;

    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const effectiveName = userName.trim() || currentUser.displayName || 'Seller User';
      const userEmail = currentUser.email || 'user@example.com';

      // 1. Write to sheet_logs
      await addDoc(collection(db, 'sheet_logs'), {
        documentId: document.id,
        sheetTitle: document.title,
        userName: effectiveName,
        userEmail: userEmail,
        userId: currentUser.uid,
        changeSummary: changeSummary.trim(),
        actionType,
        affectedRange: affectedRange.trim() || 'General Sheet',
        timestamp: nowIso,
        createdAt: nowIso,
        ownerId: currentUser.uid
      });

      // 2. Update document metadata
      const docRef = doc(db, 'documents', document.id);
      await updateDoc(docRef, {
        lastUpdatedBy: effectiveName,
        lastUpdatedEmail: userEmail,
        lastUpdatedAt: nowIso
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setChangeSummary('');
        setAffectedRange('');
        onLogged?.();
        onClose();
      }, 700);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'sheet_logs');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Record Sheet Update</h3>
              <p className="text-xs text-slate-500">Log editor name, exact time, and changes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce mb-3" />
            <h4 className="font-bold text-slate-900">Update Logged in Audit Trail!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Recorded user name, time, and sheet changes successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Target Sheet Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Document</span>
              <div className="font-semibold text-xs text-slate-900 truncate mt-0.5">{document.title}</div>
            </div>

            {/* Auto-detected Time & User badge */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-blue-600 font-medium">Record Timestamp</div>
                  <div className="font-semibold text-slate-800 text-[11px] truncate">{currentFormattedTime}</div>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-emerald-600 font-medium">Verified Identity</div>
                  <div className="font-semibold text-slate-800 text-[11px] truncate">{currentUser?.email}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Updater / Member Name *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Update Category *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                >
                  <option value="data_entry">Data Entry / Rows Added</option>
                  <option value="order_sync">Orders / Dispatches Synced</option>
                  <option value="inventory_update">Inventory Stock Modified</option>
                  <option value="price_change">Prices / Margins Changed</option>
                  <option value="general_edit">General Edits & Notes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cell Range / Tab
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sheet1!B12:E30 or Col C"
                  value={affectedRange}
                  onChange={(e) => setAffectedRange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                What changes did you make in this sheet? *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Updated today's Flipkart and Amazon dispatch counts, verified stock in rack 4, marked 12 items shipped."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {submitting ? 'Saving...' : 'Record Timestamped Update'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
