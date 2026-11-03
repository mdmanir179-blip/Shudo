import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Truck, AlertTriangle, Calendar, Clock, X, ChevronRight, ShieldAlert } from 'lucide-react';
import { OrderRecord } from '../types';
import { computePODateAlerts, DateAlert } from '../utils/poNotifications';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { PortalLogo } from '../utils/portalLogos';

interface NotificationCenterProps {
  orders: OrderRecord[];
  onSelectPO?: (order: OrderRecord) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ orders, onSelectPO }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'appointment' | 'shipping'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute live alerts based on current date
  const allAlerts = computePODateAlerts(orders);
  const visibleAlerts = allAlerts.filter((a) => !dismissedIds.includes(a.id));

  const filteredAlerts = visibleAlerts.filter((alert) => {
    if (activeFilter === 'appointment') return alert.type.startsWith('appointment');
    if (activeFilter === 'shipping') return alert.type.startsWith('shipping');
    return true;
  });

  const criticalCount = visibleAlerts.filter((a) => a.urgency === 'critical').length;
  const warningCount = visibleAlerts.filter((a) => a.urgency === 'warning').length;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark Delivered action directly from notification
  const handleMarkDelivered = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Mark In Transit action directly from notification
  const handleMarkInTransit = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'in_transit',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, alertId]);
  };

  const handleClearAll = () => {
    setDismissedIds(allAlerts.map((a) => a.id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Date & PO Consignment Notifications"
        className={`relative p-2 rounded-xl transition-all border flex items-center justify-center ${
          isOpen
            ? 'bg-blue-50 text-blue-600 border-blue-300 shadow-xs'
            : visibleAlerts.length > 0
            ? 'bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Badge count */}
        {visibleAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs animate-pulse">
            {visibleAlerts.length}
          </span>
        )}
      </button>

      {/* Popover Notification Center */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900">PO Date & Slot Alerts</h3>
                <p className="text-[10px] text-slate-500">Shipping dates & FC appointments</p>
              </div>
            </div>

            {visibleAlerts.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-50/50 border-b border-slate-100 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({visibleAlerts.length})
            </button>
            <button
              onClick={() => setActiveFilter('appointment')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                activeFilter === 'appointment'
                  ? 'bg-white text-purple-700 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3 h-3 text-purple-500" />
              <span>Appointments</span>
            </button>
            <button
              onClick={() => setActiveFilter('shipping')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                activeFilter === 'shipping'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className="w-3 h-3 text-blue-500" />
              <span>Shipping</span>
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">All Dates On Schedule</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No overdue or urgent shipping dates or FC appointment slots today.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isAppt = alert.type.startsWith('appointment');
                const isCritical = alert.urgency === 'critical';

                return (
                  <div
                    key={alert.id}
                    className={`p-3 transition-colors ${
                      isCritical ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <PortalLogo name={alert.portalName} size="sm" className="mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{alert.poNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold bg-slate-100 text-slate-700">
                              {alert.portalName}
                            </span>
                            {isCritical && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                                Urgent
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-semibold text-slate-800 mt-0.5">
                            {alert.title}
                          </div>

                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {alert.message}
                          </p>

                          {/* Date and slot badge */}
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-medium text-slate-600">
                            <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{alert.targetDate}</span>
                            </span>
                            {alert.timeSlot && (
                              <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{alert.timeSlot}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDismiss(alert.id, e)}
                        className="text-slate-300 hover:text-slate-600 p-0.5"
                        title="Dismiss alert"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Action Buttons inside notification */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                      {alert.currentStatus !== 'delivered' && (
                        <button
                          onClick={(e) => handleMarkDelivered(alert.orderId, e)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {(alert.currentStatus === 'open' || alert.currentStatus === 'pending') && (
                        <button
                          onClick={(e) => handleMarkInTransit(alert.orderId, e)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Mark In Transit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50/90 border-t border-slate-100 text-center text-[10px] text-slate-500">
            Automated alerts based on Shipping Dates & Appointment Slots
          </div>
        </div>
      )}
    </div>
  );
};
