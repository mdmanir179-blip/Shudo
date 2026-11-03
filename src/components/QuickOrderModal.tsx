import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { OrderStatus, PortalLink } from '../types';
import {
  X,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Truck,
  Box,
  MapPin,
  Sparkles,
  Layers
} from 'lucide-react';
import { PortalLogo } from '../utils/portalLogos';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  portals: PortalLink[];
  onOrderAdded?: () => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  portals,
  onOrderAdded
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [portalName, setPortalName] = useState('Swiggy');
  const [poNumber, setPoNumber] = useState('');
  const [destinationHub, setDestinationHub] = useState('Swiggy Instamart FC - Whitefield, Bangalore');
  const [amount, setAmount] = useState('');
  const [boxesCount, setBoxesCount] = useState('10');
  const [itemsCount, setItemsCount] = useState('350');
  const [status, setStatus] = useState<OrderStatus>('open');
  const [poDate, setPoDate] = useState(todayStr);
  const [shippingDate, setShippingDate] = useState(todayStr);
  const [appointmentDate, setAppointmentDate] = useState(tomorrowStr);
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM - 01:00 PM');
  const [carrier, setCarrier] = useState('Delhivery Surface Logistics');
  const [notes, setNotes] = useState('Swiggy Instamart Grocery & Daily Needs consignment.');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Preset templates
  const applyPreset = (portal: string, hub: string, sampleCarrier: string) => {
    setPortalName(portal);
    setDestinationHub(hub);
    setCarrier(sampleCarrier);
    const prefix = portal.toLowerCase().includes('swiggy')
      ? 'PO-SWG'
      : portal.toLowerCase().includes('blinkit')
      ? 'PO-BLNK'
      : portal.toLowerCase().includes('flipkart')
      ? 'PO-FLIP'
      : portal.toLowerCase().includes('amazon')
      ? 'PO-AMZ'
      : 'PO-CON';
    setPoNumber(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleGeneratePoNumber = () => {
    const prefix = portalName.toLowerCase().includes('swiggy')
      ? 'PO-SWG'
      : portalName.toLowerCase().includes('blinkit')
      ? 'PO-BLNK'
      : portalName.toLowerCase().includes('flipkart')
      ? 'PO-FLIP'
      : portalName.toLowerCase().includes('amazon')
      ? 'PO-AMZ'
      : 'PO-ORD';
    setPoNumber(`${prefix}-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalName || !amount) return;

    setSubmitting(true);
    try {
      const parsedAmount = parseFloat(amount) || 0;
      const parsedItems = parseInt(itemsCount, 10) || 1;
      const parsedBoxes = parseInt(boxesCount, 10) || 1;
      const finalPoNumber = poNumber.trim()
        ? poNumber.trim()
        : `${portalName.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;

      await addDoc(collection(db, 'orders'), {
        portalName,
        orderNumber: finalPoNumber,
        poNumber: finalPoNumber,
        destinationHub: destinationHub.trim() || 'Fulfillment Center Hub',
        customerName: destinationHub.trim() || portalName,
        amount: parsedAmount,
        boxesCount: parsedBoxes,
        itemsCount: parsedItems,
        status,
        date: poDate,
        shippingDate: shippingDate || poDate,
        appointmentDate: appointmentDate || tomorrowStr,
        appointmentTime: appointmentTime.trim(),
        carrier: carrier.trim(),
        notes: notes.trim(),
        ownerId: 'workspace_user',
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPoNumber('');
        setAmount('');
        setNotes('');
        onOrderAdded?.();
        onClose();
      }, 700);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                New Consignment Purchase Order (PO)
              </h3>
              <p className="text-xs text-slate-500">
                Track Swiggy Instamart and all portal consignments, shipping & appointment dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-bounce mb-3" />
            <h4 className="font-black text-slate-900 text-base">Consignment PO Successfully Added!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Open POs, In Transit counts, and date alerts are now updated in real-time.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Quick Format Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Quick Format Presets
                </span>
                <span className="text-[10px] text-slate-400">Click to autofill portal schema</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    applyPreset(
                      'Swiggy',
                      'Swiggy Instamart FC - Whitefield, Bangalore',
                      'Delhivery Surface Logistics'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 transition-colors flex items-center gap-1.5"
                >
                  <PortalLogo name="Swiggy" size="sm" />
                  <span>Swiggy Instamart</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset(
                      'Blinkit',
                      'Blinkit Dark Store Hub - Sector 62, Gurgaon',
                      'Shadowfax Quick Logistics'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                >
                  <PortalLogo name="Blinkit" size="sm" />
                  <span>Blinkit Consignment</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset(
                      'Flipkart',
                      'Flipkart Bilaspur Fulfillment Center',
                      'Ekart Logistics (MH12-TY-9081)'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                >
                  <PortalLogo name="Flipkart" size="sm" />
                  <span>Flipkart Hub</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset(
                      'Amazon',
                      'Amazon FC BLR8 - Devanahalli',
                      'ATS Logistics (Amazon Transportation)'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <PortalLogo name="Amazon" size="sm" />
                  <span>Amazon FBA</span>
                </button>
              </div>
            </div>

            {/* Row 1: Portal & PO Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Portal Channel *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={portalName}
                    onChange={(e) => setPortalName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-semibold"
                  >
                    <option value="Swiggy">Swiggy Instamart</option>
                    <option value="Blinkit">Blinkit</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Meesho">Meesho</option>
                    {portals
                      .filter(
                        (p) => !['Flipkart', 'Amazon', 'Meesho', 'Swiggy', 'Blinkit'].includes(p.name)
                      )
                      .map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    PO / Consignment No. *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePoNumber}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. PO-SWG-9021"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-mono font-bold"
                />
              </div>
            </div>

            {/* Row 2: Destination Hub / FC */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Destination FC / Warehouse Hub *</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy Instamart FC - Whitefield, Bangalore"
                value={destinationHub}
                onChange={(e) => setDestinationHub(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
                required
              />
            </div>

            {/* Row 3: CRITICAL DATES: Shipping Date & Appointment Date */}
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Consignment Schedule Dates & Notifications</span>
                </span>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                  Automated Date Alerts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-blue-600" /> Shipping Date (Dispatch) *
                  </label>
                  <input
                    type="date"
                    value={shippingDate}
                    onChange={(e) => setShippingDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">When goods leave factory</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-purple-600" /> Appointment Date (FC Slot) *
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">FC unloading date</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" /> Appointment Slot Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 01:00 PM"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Booked gate slot</span>
                </div>
              </div>
            </div>

            {/* Row 4: Quantity & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total PO Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="45000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Box className="w-3.5 h-3.5 text-slate-500" /> Total Boxes (Cartons)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={boxesCount}
                  onChange={(e) => setBoxesCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> Total Units (Pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="350"
                  value={itemsCount}
                  onChange={(e) => setItemsCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-bold"
                >
                  <option value="open">Open (Packed / Ready)</option>
                  <option value="in_transit">In Transit (Dispatched)</option>
                  <option value="delivered">Delivered (GRN Closed)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Row 5: Carrier / Transporter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-500" /> Carrier / Vehicle / AWB No
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delhivery Surface Logistics / KA01-MJ-8812"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PO Issue Date
                </label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>
            </div>

            {/* Row 6: Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consignment Notes / SKU Remarks
              </label>
              <input
                type="text"
                placeholder="Optional invoice details, packaging notes, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !amount}
                className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {submitting ? 'Saving Consignment...' : 'Save Consignment PO'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
