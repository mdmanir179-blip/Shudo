import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { PortalLink } from '../types';
import { PortalLogo } from '../utils/portalLogos';
import { X, ExternalLink, Link2, Image as ImageIcon, Check } from 'lucide-react';

interface EditPortalModalProps {
  portal: PortalLink | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditPortalModal: React.FC<EditPortalModalProps> = ({
  portal,
  isOpen,
  onClose,
  onUpdated
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState('#2874F0');
  const [logoUrl, setLogoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (portal) {
      setName(portal.name || '');
      setUrl(portal.url || '');
      setColor(portal.color || '#2874F0');
      setLogoUrl(portal.logoUrl || '');
      setNotes(portal.notes || '');
    }
  }, [portal]);

  if (!isOpen || !portal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setLoading(true);
    try {
      const portalRef = doc(db, 'portals', portal.id);
      await updateDoc(portalRef, {
        name: name.trim(),
        url: cleanUrl,
        color,
        logoUrl: logoUrl.trim(),
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
      });

      onUpdated?.();
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `portals/${portal.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PortalLogo name={name || portal.name} logoUrl={logoUrl} size="md" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Edit Seller Portal</h3>
              <p className="text-xs text-slate-500">Update logo, link, or credentials</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Portal Display Name *
            </label>
            <div className="flex items-center gap-2.5">
              <PortalLogo name={name || 'Portal'} logoUrl={logoUrl} size="md" />
              <input
                type="text"
                placeholder="e.g. Flipkart"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Portal Logo URL</span>
              <span className="text-[10px] text-slate-400 font-normal">Direct image link (PNG, JPG, SVG)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono text-[11px]"
              />
              <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
            {logoUrl && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[11px] text-slate-500 font-medium">Logo Preview:</span>
                <PortalLogo name={name} logoUrl={logoUrl} size="md" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Portal URL / Seller Dashboard Link *
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://seller.flipkart.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono text-[11px]"
                required
              />
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Badge Accent Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
              />
              <span className="text-xs font-mono text-slate-600">{color}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes or Credentials Reminder
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Registered with mobile +91-9876543210, Warehouse 1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Update Portal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
