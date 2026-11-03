import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { DocType } from '../types';
import { convertToEmbedUrl } from '../utils/googleEmbed';
import { X, FileSpreadsheet, FileText, Info } from 'lucide-react';

interface AddDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

export const AddDocModal: React.FC<AddDocModalProps> = ({ isOpen, onClose, onAdded }) => {
  const { currentUser } = useAuth();
  const [docType, setDocType] = useState<DocType>('sheet');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !url.trim()) return;

    setLoading(true);
    try {
      const { embedUrl, detectedType } = convertToEmbedUrl(url, docType);
      const effectiveType = detectedType || docType;

      const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Seller Admin';
      const userEmail = currentUser.email || '';

      const docRef = await addDoc(collection(db, 'documents'), {
        title: title.trim(),
        type: effectiveType,
        url: url.trim(),
        embedUrl,
        description: description.trim(),
        ownerId: currentUser.uid,
        lastUpdatedBy: userName,
        lastUpdatedEmail: userEmail,
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      // Record an initial audit log entry for this sheet/doc
      await addDoc(collection(db, 'sheet_logs'), {
        documentId: docRef.id,
        sheetTitle: title.trim(),
        userName: userName,
        userEmail: userEmail,
        userId: currentUser.uid,
        changeSummary: `Document linked to workspace: "${title.trim()}". Ready for live in-software editing.`,
        actionType: 'general_edit',
        affectedRange: 'Initial Link',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ownerId: currentUser.uid
      });

      onAdded?.();
      onClose();
      setTitle('');
      setUrl('');
      setDescription('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              docType === 'sheet' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {docType === 'sheet' ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Add Google Sheet or Doc</h3>
              <p className="text-xs text-slate-500">Run and edit directly inside the software</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDocType('sheet')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                docType === 'sheet' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Google Sheet (Audit Tracked)
            </button>
            <button
              type="button"
              onClick={() => setDocType('doc')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                docType === 'doc' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Google Doc
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document / Sheet Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Daily Dispatch & Stock Sheet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Docs or Sheets Shareable Link *
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono text-[11px]"
              required
            />
            <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Tip: Set sheet sharing permission to <strong>"Anyone with link can view/edit"</strong> for seamless embedded real-time editing.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purpose / Department Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Multi-portal daily stock count, Flipkart returns, and Blinkit dark store dispatches"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
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
              disabled={loading}
              className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-60"
            >
              {loading ? 'Embedding...' : 'Add & Embed Sheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
