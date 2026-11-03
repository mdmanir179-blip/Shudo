import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { X, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataCleared?: () => void;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({ isOpen, onClose, onDataCleared }) => {
  const { currentUser } = useAuth();
  const [clearOrders, setClearOrders] = useState(true);
  const [clearLogs, setClearLogs] = useState(true);
  const [clearDocs, setClearDocs] = useState(true);
  const [resetPortals, setResetPortals] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteClear = async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const uid = currentUser.uid;

    try {
      let deletedCount = 0;

      // 1. Clear Orders if checked
      if (clearOrders) {
        const ordersQ = query(collection(db, 'orders'), where('ownerId', '==', uid));
        const ordersSnap = await getDocs(ordersQ);
        for (const d of ordersSnap.docs) {
          await deleteDoc(doc(db, 'orders', d.id));
          deletedCount++;
        }
      }

      // 2. Clear Sheet Logs if checked
      if (clearLogs) {
        const logsQ = query(collection(db, 'sheet_logs'), where('ownerId', '==', uid));
        const logsSnap = await getDocs(logsQ);
        for (const d of logsSnap.docs) {
          await deleteDoc(doc(db, 'sheet_logs', d.id));
          deletedCount++;
        }
      }

      // 3. Clear Google Docs/Sheets if checked
      if (clearDocs) {
        const docsQ = query(collection(db, 'documents'), where('ownerId', '==', uid));
        const docsSnap = await getDocs(docsQ);
        for (const d of docsSnap.docs) {
          await deleteDoc(doc(db, 'documents', d.id));
          deletedCount++;
        }
      }

      // 4. Reset Portals if checked
      if (resetPortals) {
        const portalsQ = query(collection(db, 'portals'), where('ownerId', '==', uid));
        const portalsSnap = await getDocs(portalsQ);
        for (const d of portalsSnap.docs) {
          await deleteDoc(doc(db, 'portals', d.id));
          deletedCount++;
        }
      }

      setSuccessMessage(`Successfully cleared ${deletedCount} records.`);
      setTimeout(() => {
        setSuccessMessage(null);
        onDataCleared?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to clear data:', err);
      setErrorMessage(err.message || 'Error occurred while clearing data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Clear Workspace Data</h3>
              <p className="text-xs text-slate-500">Remove demo orders, sheets, and logs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce mb-3" />
            <h4 className="font-bold text-slate-900">Data Cleared Successfully!</h4>
            <p className="text-xs text-slate-500 mt-1">{successMessage}</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
                {errorMessage}
              </div>
            )}

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> This permanently wipes the selected data from your database so you can start with a 100% clean dashboard.
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={clearOrders}
                  onChange={(e) => setClearOrders(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">Clear All Orders & Trend Data</div>
                  <div className="text-[11px] text-slate-400">Resets order count cards and daily charts to zero</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={clearLogs}
                  onChange={(e) => setClearLogs(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">Clear Sheet Audit Logs</div>
                  <div className="text-[11px] text-slate-400">Removes historical update and timestamp records</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={clearDocs}
                  onChange={(e) => setClearDocs(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">Clear Saved Google Sheets & Docs</div>
                  <div className="text-[11px] text-slate-400">Removes sample and saved sheet links</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={resetPortals}
                  onChange={(e) => setResetPortals(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">Remove Custom Portal Links</div>
                  <div className="text-[11px] text-slate-400">Clears custom seller links (Optional)</div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                disabled={loading || (!clearOrders && !clearLogs && !clearDocs && !resetPortals)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Clear Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
