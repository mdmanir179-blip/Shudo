import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { OrderRecord, OrderStatus, PortalLink } from '../types';
import {
  X,
  Edit,
  CheckCircle2,
  Calendar,
  Clock,
  Truck,
  Box,
  MapPin,
  Layers,
  Save,
  AlertCircle
} from 'lucide-react';
import { PortalLogo } from '../utils/portalLogos';

interface EditPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderRecord | null;
  portals: PortalLink[];
  onOrderUpdated?: () => void;
}

export const EditPOModal: React.FC<EditPOModalProps> = ({
  isOpen,
  onClose,
  order,
  portals,
  onOrderUpdated
}) => {
  const [portalName, setPortalName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [destinationHub, setDestinationHub] = useState('');
  const [amount, setAmount] = useState('');
  const [boxesCount, setBoxesCount] = useState('1');
  const [itemsCount, setItemsCount] = useState('1');
  const [status, setStatus] = useState<OrderStatus>('open');
  const [poDate, setPoDate] = useState('');
  const [shippingDate, setShippingDate] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [carrier, setCarrier] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever the selected order changes
  useEffect(() => {
    if (order) {
      setPortalName(order.portalName || 'Swiggy');
      setPoNumber(order.poNumber || order.orderNumber || '');
      setDestinationHub(order.destinationHub || '');
      setAmount(order.amount !== undefined ? String(order.amount) : '');
      setBoxesCount(order.boxesCount !== undefined ? String(order.boxesCount) : '1');
      setItemsCount(order.itemsCount !== undefined ? String(order.itemsCount) : '1');
      setStatus(order.status || 'open');
      setPoDate(order.date || new Date().toISOString().split('T')[0]);
      setShippingDate(order.shippingDate || order.date || new Date().toISOString().split('T')[0]);
      setAppointmentDate(order.appointmentDate || order.date || new Date().toISOString().split('T')[0]);
      setAppointmentTime(order.appointmentTime || '');
      setCarrier(order.carrier || '');
      setNotes(order.notes || '');
      setErrorMessage(null);
      setSuccess(false);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalName || !amount || !poNumber.trim()) {
      setErrorMessage('Please fill in required fields: Portal, PO Number, and Amount.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const parsedAmount = parseFloat(amount) || 0;
      const parsedBoxes = parseInt(boxesCount, 10) || 1;
      const parsedItems = parseInt(itemsCount, 10) || 1;
      const finalPoNum = poNumber.trim();

      const updateData: Partial<OrderRecord> & { updatedAt: string } = {
        portalName,
        orderNumber: finalPoNum,
        poNumber: finalPoNum,
        destinationHub: destinationHub.trim() || 'Fulfillment Center Hub',
        customerName: destinationHub.trim() || portalName,
        amount: parsedAmount,
        boxesCount: parsedBoxes,
        itemsCount: parsedItems,
        status,
        date: poDate || order.date,
        shippingDate: shippingDate || poDate,
        appointmentDate: appointmentDate || poDate,
        appointmentTime: appointmentTime.trim(),
        carrier: carrier.trim(),
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
      };

      if (status === 'delivered') {
        updateData.deliveredAt = order.deliveredAt || new Date().toISOString();
      }

      await updateDoc(doc(db, 'orders', order.id), updateData);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onOrderUpdated?.();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error updating PO:', err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      } catch (e: any) {
        setErrorMessage(e.message || 'Failed to update Purchase Order. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span>Edit Purchase Order (PO)</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  {order.poNumber || order.orderNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Modify consignment details, schedule dates, fulfillment hub, and delivery status
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
            <h4 className="font-black text-slate-900 text-base">Purchase Order Updated Successfully!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Changes to dates, status, and ledger records have been saved in real-time.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PO / Consignment No. *
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-SWG-9021"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-mono font-bold"
                  required
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

            {/* Row 3: SCHEDULE DATES: Shipping Date & Appointment Date */}
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Consignment Schedule Dates & Alerts</span>
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Goods dispatch date</span>
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">FC gate unloading slot</span>
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Time window</span>
                </div>
              </div>
            </div>

            {/* Row 4: Quantity, Value & Status */}
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

            {/* Row 5: Carrier / Transporter & PO Issue Date */}
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
              <textarea
                rows={2}
                placeholder="Optional invoice details, packaging notes, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                All edits immediately sync to dashboard KPI cards & alerts
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !amount || !poNumber.trim()}
                  className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
