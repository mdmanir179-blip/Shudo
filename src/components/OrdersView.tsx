import React, { useState, useMemo, useEffect } from 'react';
import { OrderRecord, PortalLink, OrderStatus } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  Calendar,
  Box,
  Trash2,
  Check,
  Edit2,
  Clock,
  Layers,
  Sparkles,
  Download,
  Filter
} from 'lucide-react';
import { EditPOModal } from './EditPOModal';
import { PortalLogo } from '../utils/portalLogos';
import {
  getTodayDateString,
  getTomorrowDateString,
  isPOOpen,
  isPOInTransit,
  isPODelivered
} from '../utils/poNotifications';

interface OrdersViewProps {
  orders: OrderRecord[];
  portals: PortalLink[];
  onOpenAddOrder: () => void;
  onSelectPortal?: (portal: PortalLink) => void;
  initialSearchQuery?: string;
  selectedOrderId?: string | null;
  onClearSelectedOrderId?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  portals,
  onOpenAddOrder,
  onSelectPortal,
  initialSearchQuery = '',
  selectedOrderId = null,
  onClearSelectedOrderId
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedPortalFilter, setSelectedPortalFilter] = useState<string>('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState<
    'all' | 'open' | 'in_transit' | 'appointments_due' | 'delivered'
  >('all');
  const [selectedPODetails, setSelectedPODetails] = useState<OrderRecord | null>(null);
  const [editingPO, setEditingPO] = useState<OrderRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Sync initialSearchQuery when passed from header
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Sync selectedOrderId when an order is clicked in header search
  useEffect(() => {
    if (selectedOrderId) {
      const match = orders.find((o) => o.id === selectedOrderId);
      if (match) {
        setSelectedPODetails(match);
      }
    }
  }, [selectedOrderId, orders]);

  // Keep details modal synchronized with live order updates
  useEffect(() => {
    if (selectedPODetails) {
      const livePO = orders.find((o) => o.id === selectedPODetails.id);
      if (livePO) {
        setSelectedPODetails(livePO);
      }
    }
  }, [orders]);

  const todayStr = useMemo(() => getTodayDateString(), []);
  const tomorrowStr = useMemo(() => getTomorrowDateString(), []);

  // Aggregate Key Consignment Metrics
  const openPOCount = useMemo(() => orders.filter((o) => isPOOpen(o.status)).length, [orders]);
  const inTransitPOCount = useMemo(() => orders.filter((o) => isPOInTransit(o.status)).length, [orders]);
  const deliveredPOCount = useMemo(() => orders.filter((o) => isPODelivered(o.status)).length, [orders]);

  const shippingTodayCount = useMemo(
    () => orders.filter((o) => isPOOpen(o.status) && o.shippingDate === todayStr).length,
    [orders, todayStr]
  );

  const appointmentTodayCount = useMemo(
    () => orders.filter((o) => !isPODelivered(o.status) && o.appointmentDate === todayStr).length,
    [orders, todayStr]
  );

  const totalConsignmentValue = useMemo(
    () => orders.reduce((sum, o) => sum + (o.amount || 0), 0),
    [orders]
  );
  const totalBoxes = useMemo(
    () => orders.reduce((sum, o) => sum + (o.boxesCount || 0), 0),
    [orders]
  );

  // Filtered Orders / Consignments
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Portal filter
        if (
          selectedPortalFilter !== 'all' &&
          o.portalName.toLowerCase() !== selectedPortalFilter.toLowerCase()
        ) {
          return false;
        }

        // Status tab filter
        if (selectedStatusTab === 'open' && !isPOOpen(o.status)) {
          return false;
        }
        if (selectedStatusTab === 'in_transit' && !isPOInTransit(o.status)) {
          return false;
        }
        if (selectedStatusTab === 'delivered' && !isPODelivered(o.status)) {
          return false;
        }
        if (selectedStatusTab === 'appointments_due') {
          const hasApptDue =
            !isPODelivered(o.status) &&
            (o.appointmentDate === todayStr || (o.appointmentDate && o.appointmentDate < todayStr));
          const hasShipDue =
            isPOOpen(o.status) &&
            (o.shippingDate === todayStr || (o.shippingDate && o.shippingDate < todayStr));
          if (!hasApptDue && !hasShipDue) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchPo = (o.poNumber || o.orderNumber || '').toLowerCase().includes(q);
          const matchHub = (o.destinationHub || '').toLowerCase().includes(q);
          const matchPortal = o.portalName?.toLowerCase().includes(q);
          const matchCarrier = (o.carrier || '').toLowerCase().includes(q);
          const matchNotes = (o.notes || '').toLowerCase().includes(q);
          if (!matchPo && !matchHub && !matchPortal && !matchCarrier && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aAppt = a.appointmentDate || a.date || '';
        const bAppt = b.appointmentDate || b.date || '';
        return bAppt.localeCompare(aAppt);
      });
  }, [orders, selectedPortalFilter, selectedStatusTab, searchQuery, todayStr]);

  const showActionToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 2800);
  };

  // Mark Delivered handler
  const handleMarkDelivered = async (orderId: string, poNum: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      showActionToast(`PO #${poNum} marked as Delivered!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Mark In Transit handler
  const handleMarkInTransit = async (orderId: string, poNum: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'in_transit',
        updatedAt: new Date().toISOString()
      });
      showActionToast(`PO #${poNum} marked as In Transit (Dispatched)!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updates: any = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      if (newStatus === 'delivered') {
        updates.deliveredAt = new Date().toISOString();
      }
      await updateDoc(orderRef, updates);
      showActionToast(`Status updated to ${newStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleDeletePO = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setDeleteConfirmId(null);
      if (selectedPODetails?.id === orderId) {
        setSelectedPODetails(null);
      }
      showActionToast('Consignment PO removed.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = [
      'Portal',
      'PO Number',
      'Destination Hub',
      'Shipping Date',
      'Appointment Date',
      'Time Slot',
      'Boxes',
      'Units',
      'Amount (INR)',
      'Status',
      'Carrier',
      'Notes'
    ];
    const rows = filteredOrders.map((o) => [
      `"${o.portalName || ''}"`,
      `"${o.poNumber || o.orderNumber || ''}"`,
      `"${(o.destinationHub || '').replace(/"/g, '""')}"`,
      `"${o.shippingDate || o.date || ''}"`,
      `"${o.appointmentDate || ''}"`,
      `"${o.appointmentTime || ''}"`,
      o.boxesCount || 1,
      o.itemsCount || 1,
      o.amount || 0,
      `"${o.status || ''}"`,
      `"${(o.carrier || '').replace(/"/g, '""')}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Consignments_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showActionToast('Exported CSV file successfully!');
  };

  // Helper for Shipping Date badge
  const renderShippingDateBadge = (order: OrderRecord) => {
    const sDate = order.shippingDate || order.date;
    if (!sDate) return <span className="text-slate-400">Not set</span>;

    const isToday = sDate === todayStr;
    const isPast = sDate < todayStr;
    const isTomorrow = sDate === tomorrowStr;

    if (isPODelivered(order.status) || isPOInTransit(order.status)) {
      return (
        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
          <Truck className="w-3 h-3 text-slate-400" />
          <span>{sDate}</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold">
            Shipped
          </span>
        </div>
      );
    }

    if (isToday) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
          <Clock className="w-3 h-3" />
          Today ({sDate})
        </span>
      );
    }

    if (isPast) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3 h-3" />
          Overdue ({sDate})
        </span>
      );
    }

    if (isTomorrow) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Tomorrow ({sDate})
        </span>
      );
    }

    return (
      <span className="text-slate-700 text-xs font-medium flex items-center gap-1">
        <Calendar className="w-3 h-3 text-slate-400" />
        <span>{sDate}</span>
      </span>
    );
  };

  // Helper for Appointment Date badge
  const renderAppointmentDateBadge = (order: OrderRecord) => {
    const aDate = order.appointmentDate;
    if (!aDate) return <span className="text-slate-400">No slot</span>;

    const isToday = aDate === todayStr;
    const isPast = aDate < todayStr;
    const isTomorrow = aDate === tomorrowStr;

    if (isPODelivered(order.status)) {
      return (
        <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Delivered ({aDate})</span>
        </div>
      );
    }

    if (isToday) {
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
            <Calendar className="w-3 h-3 text-purple-600" />
            Slot Today!
          </span>
          {order.appointmentTime && (
            <span className="text-[10px] text-purple-700 font-medium flex items-center gap-0.5 ml-1">
              <Clock className="w-2.5 h-2.5" />
              {order.appointmentTime}
            </span>
          )}
        </div>
      );
    }

    if (isPast) {
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            Slot Passed ({aDate})
          </span>
          <span className="text-[9px] text-slate-400 ml-1">Mark delivered if done</span>
        </div>
      );
    }

    if (isTomorrow) {
      return (
        <div className="flex flex-col items-start gap-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            Tomorrow ({aDate})
          </span>
          {order.appointmentTime && (
            <span className="text-[10px] text-slate-500 ml-1">{order.appointmentTime}</span>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-start">
        <span className="text-slate-800 text-xs font-semibold flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{aDate}</span>
        </span>
        {order.appointmentTime && (
          <span className="text-[10px] text-slate-400 ml-4">{order.appointmentTime}</span>
        )}
      </div>
    );
  };

  const getConsignmentStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'open':
      case 'pending':
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Box className="w-3 h-3 text-amber-600" />
            <span>Open PO</span>
          </span>
        );
      case 'in_transit':
      case 'dispatched':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
            <Truck className="w-3 h-3 text-blue-600" />
            <span>In Transit</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const handleClosePODetails = () => {
    setSelectedPODetails(null);
    onClearSelectedOrderId?.();
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Consignments & Purchase Orders Master
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                Active Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Swiggy Instamart, Blinkit, Flipkart, Amazon & Meesho POs with dates, transit tracking and fulfillment confirmations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddOrder}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shadow-blue-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Consignment PO</span>
          </button>
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setSelectedStatusTab('open')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedStatusTab === 'open'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase">Open POs</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{openPOCount}</div>
          <div className="text-[11px] text-amber-800 mt-0.5">{shippingTodayCount} ship today</div>
        </div>

        <div
          onClick={() => setSelectedStatusTab('in_transit')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedStatusTab === 'in_transit'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase">In Transit</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{inTransitPOCount}</div>
          <div className="text-[11px] text-blue-700 mt-0.5">En route to FCs</div>
        </div>

        <div
          onClick={() => setSelectedStatusTab('delivered')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedStatusTab === 'delivered'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase">Delivered POs</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{deliveredPOCount}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Confirmed at hub</div>
        </div>

        <div className="p-3.5 rounded-xl border bg-white border-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Value</div>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalConsignmentValue.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{totalBoxes} Total Cartons</div>
        </div>
      </div>

      {/* MAIN CONSIGNMENT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>Consignments Ledger</span>
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full">
                  {filteredOrders.length} records
                </span>
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search PO#, Hub, Transporter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <select
                value={selectedPortalFilter}
                onChange={(e) => setSelectedPortalFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold"
              >
                <option value="all">All Channels</option>
                <option value="Swiggy">Swiggy Instamart</option>
                <option value="Blinkit">Blinkit</option>
                <option value="Flipkart">Flipkart</option>
                <option value="Amazon">Amazon</option>
                <option value="Meesho">Meesho</option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setSelectedStatusTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                selectedStatusTab === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Consignments ({orders.length})
            </button>

            <button
              onClick={() => setSelectedStatusTab('open')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                selectedStatusTab === 'open'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Open POs ({openPOCount})</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('in_transit')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                selectedStatusTab === 'in_transit'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>In Transit ({inTransitPOCount})</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('appointments_due')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                selectedStatusTab === 'appointments_due'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Appointments Due ({appointmentTodayCount + shippingTodayCount})</span>
            </button>

            <button
              onClick={() => setSelectedStatusTab('delivered')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                selectedStatusTab === 'delivered'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Delivered ({deliveredPOCount})</span>
            </button>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Portal Channel</th>
                <th className="py-3 px-4">PO / Consignment No.</th>
                <th className="py-3 px-4">Destination FC / Hub</th>
                <th className="py-3 px-4">Shipping Date (Dispatch)</th>
                <th className="py-3 px-4">Appointment Date (FC Slot)</th>
                <th className="py-3 px-4">Boxes & Units</th>
                <th className="py-3 px-4">PO Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Box className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-slate-700 text-sm">No Consignments Found</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Add a new purchase order or change search filter.
                    </p>
                    <button
                      onClick={onOpenAddOrder}
                      className="mt-3 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Consignment PO</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const poNum = order.poNumber || order.orderNumber;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedPODetails(order)}
                    >
                      {/* Portal */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <PortalLogo name={order.portalName} size="sm" />
                          <span>{order.portalName}</span>
                        </div>
                      </td>

                      {/* PO Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                          {poNum}
                        </span>
                      </td>

                      {/* Destination Hub */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-semibold text-slate-800 truncate" title={order.destinationHub}>
                          {order.destinationHub || 'Standard Fulfillment Hub'}
                        </div>
                        {order.carrier && (
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Truck className="w-2.5 h-2.5" />
                            <span>{order.carrier}</span>
                          </div>
                        )}
                      </td>

                      {/* Shipping Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderShippingDateBadge(order)}
                      </td>

                      {/* Appointment Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderAppointmentDateBadge(order)}
                      </td>

                      {/* Boxes & Units */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {order.boxesCount ? `${order.boxesCount} Boxes` : `${order.itemsCount} units`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {order.itemsCount} total units
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                        ₹{order.amount?.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getConsignmentStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Mark Delivered button */}
                          {!isPODelivered(order.status) ? (
                            <button
                              onClick={() => handleMarkDelivered(order.id, poNum)}
                              title="Confirm consignment delivered"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all hover:scale-105 active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Delivered</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Done
                            </span>
                          )}

                          {/* Dispatch button */}
                          {isPOOpen(order.status) && (
                            <button
                              onClick={() => handleMarkInTransit(order.id, poNum)}
                              title="Mark as dispatched"
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            onClick={() => setEditingPO(order)}
                            title="Edit PO"
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3 h-3 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          {/* Quick status dropdown */}
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className="text-[10px] font-semibold bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 cursor-pointer hover:border-slate-300"
                          >
                            <option value="open">Open</option>
                            <option value="in_transit">In Transit</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          {/* Delete PO Button */}
                          {deleteConfirmId === order.id ? (
                            <button
                              onClick={() => handleDeletePO(order.id)}
                              className="px-2 py-0.5 text-[10px] bg-rose-600 text-white font-bold rounded"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(order.id)}
                              title="Delete PO"
                              className="p-1 rounded text-slate-300 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing {filteredOrders.length} of {orders.length} Consignment Purchase Orders
          </span>
          <span className="font-medium text-slate-600">
            Click any row to open full consignment details & delivery verification.
          </span>
        </div>
      </div>

      {/* PO DETAILS MODAL */}
      {selectedPODetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <PortalLogo name={selectedPODetails.portalName} size="md" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>{selectedPODetails.poNumber || selectedPODetails.orderNumber}</span>
                    {getConsignmentStatusBadge(selectedPODetails.status)}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedPODetails.portalName} Consignment Sheet</p>
                </div>
              </div>
              <button
                onClick={handleClosePODetails}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Destination Hub:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {selectedPODetails.destinationHub || 'General Warehouse'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Carrier / Transporter:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPODetails.carrier || 'Standard Transport'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Shipping Date
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    {selectedPODetails.shippingDate || selectedPODetails.date}
                  </div>
                  <div className="mt-1">{renderShippingDateBadge(selectedPODetails)}</div>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <div className="text-[10px] font-bold text-purple-700 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Appointment Slot Date
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    {selectedPODetails.appointmentDate || 'Not scheduled'}
                  </div>
                  {selectedPODetails.appointmentTime && (
                    <div className="text-[11px] font-semibold text-purple-800 mt-0.5">
                      Slot: {selectedPODetails.appointmentTime}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Boxes</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {selectedPODetails.boxesCount || 1} Cartons
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Units</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {selectedPODetails.itemsCount} Pcs
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">PO Value</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    ₹{selectedPODetails.amount?.toLocaleString()}
                  </div>
                </div>
              </div>

              {selectedPODetails.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Notes:</div>
                  <div className="text-slate-700">{selectedPODetails.notes}</div>
                </div>
              )}

              {selectedPODetails.deliveredAt && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Delivered on {new Date(selectedPODetails.deliveredAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleClosePODetails}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingPO(selectedPODetails);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit PO</span>
                </button>

                {!isPODelivered(selectedPODetails.status) && (
                  <button
                    onClick={() => {
                      handleMarkDelivered(
                        selectedPODetails.id,
                        selectedPODetails.poNumber || selectedPODetails.orderNumber
                      );
                      setSelectedPODetails(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Delivered</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      <EditPOModal
        isOpen={!!editingPO}
        onClose={() => setEditingPO(null)}
        order={editingPO}
        portals={portals}
        onOrderUpdated={() => {
          showActionToast('Purchase Order details updated successfully.');
        }}
      />
    </div>
  );
};
