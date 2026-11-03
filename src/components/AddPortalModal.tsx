import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { PortalPlatform } from '../types';
import { PortalLogo } from '../utils/portalLogos';
import { X, ExternalLink, Link2, Sparkles, Image as ImageIcon } from 'lucide-react';

interface AddPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

const PRESET_TEMPLATES: Record<
  PortalPlatform,
  { name: string; url: string; color: string; notes: string; logoUrl?: string }
> = {
  flipkart: {
    name: 'Flipkart',
    url: 'https://seller.flipkart.com',
    color: '#2874F0',
    notes: 'Official seller dashboard for orders, tier metrics, and dispatch manifests.'
  },
  amazon: {
    name: 'Amazon',
    url: 'https://sellercentral.amazon.in',
    color: '#FF9900',
    notes: 'Inventory management, FBA tracking, and Prime orders dashboard.'
  },
  meesho: {
    name: 'Meesho',
    url: 'https://supplier.meesho.com',
    color: '#8B1E5D',
    notes: '0% commission marketplace catalog updates and shipping label generation.'
  },
  swiggy: {
    name: 'Swiggy',
    url: 'https://partner.swiggy.com',
    color: '#FC8019',
    notes: 'Live restaurant & retail order flow, prep status, and settlement records.'
  },
  blinkit: {
    name: 'Blinkit',
    url: 'https://partner.blinkit.com',
    color: '#0C831F',
    notes: 'Dark store inventory dispatch, instant 10-minute order fulfillments.'
  },
  custom: {
    name: '',
    url: '',
    color: '#4F46E5',
    notes: ''
  }
};

export const AddPortalModal: React.FC<AddPortalModalProps> = ({ isOpen, onClose, onAdded }) => {
  const [platform, setPlatform] = useState<PortalPlatform>('custom');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState('#2874F0');
  const [logoUrl, setLogoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePlatformChange = (p: PortalPlatform) => {
    setPlatform(p);
    const preset = PRESET_TEMPLATES[p];
    if (preset && p !== 'custom') {
      setName(preset.name);
      setUrl(preset.url);
      setColor(preset.color);
      setNotes(preset.notes);
      setLogoUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'portals'), {
        name: name.trim(),
        platform,
        url: cleanUrl,
        color,
        logoUrl: logoUrl.trim(),
        notes: notes.trim(),
        ownerId: 'workspace_user',
        createdAt: new Date().toISOString()
      });

      onAdded?.();
      onClose();
      // Reset
      setName('');
      setUrl('');
      setNotes('');
      setLogoUrl('');
      setPlatform('custom');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'portals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Add Seller Portal Link</h3>
              <p className="text-xs text-slate-500">Connect Flipkart, Amazon, Meesho, Swiggy, Blinkit, etc.</p>
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
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Select Platform Preset</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['flipkart', 'amazon', 'meesho', 'swiggy', 'blinkit', 'custom'] as PortalPlatform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePlatformChange(p)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center capitalize transition-all ${
                    platform === p
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

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
              <span>Portal Logo URL (Optional)</span>
              <span className="text-[10px] text-slate-400 font-normal">Auto-detected if left empty</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Badge Color
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
                Category
              </label>
              <span className="inline-block py-2 text-xs text-slate-500 capitalize">
                {platform} marketplace
              </span>
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
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-60"
            >
              {loading ? 'Adding...' : 'Save Portal Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
