import React, { useState, useMemo, useEffect } from 'react';
import { OrderRecord, PortalLink, OrderStatus } from '../types';
import { TrendChart } from './TrendChart';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  Plus,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  Calendar,
  Box,
  MapPin,
  Bell,
  Trash2,
  Check,
  Layers,
  ArrowRight,
  Edit2
} from 'lucide-react';
import { EditPOModal } from './EditPOModal';
import { PortalLogo } from '../utils/portalLogos';
import { ActiveTab } from './Navbar';
import {
  computePODateAlerts,
  getTodayDateString,
  getTomorrowDateString,
  isPOOpen,
  isPOInTransit,
  isPODelivered
} from '../utils/poNotifications';

interface DashboardViewProps {
  orders: OrderRecord[];
  portals: PortalLink[];
  onOpenAddOrder: () => void;
  onOpenAddPortal: () => void;
  onSelectPortal: (portal: PortalLink) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

const PORTAL_THEMES: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  'Flipkart': { bg: 'bg-blue-50/60', text: 'text-blue-700', border: 'border-blue-200', accent: '#2874F0' },
  'Amazon': { bg: 'bg-amber-50/60', text: 'text-amber-800', border: 'border-amber-200', accent: '#FF9900' },
  'Meesho': { bg: 'bg-pink-50/60', text: 'text-pink-800', border: 'border-pink-200', accent: '#8B1E5D' },
  'Swiggy': { bg: 'bg-orange-50/60', text: 'text-orange-800', border: 'border-orange-200', accent: '#FC8019' },
  'Blinkit': { bg: 'bg-emerald-50/60', text: 'text-emerald-800', border: 'border-emerald-200', accent: '#0C831F' }
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  portals,
  onOpenAddOrder,
  onOpenAddPortal,
  onSelectPortal,
  onNavigateTab
}) => {
  const [daysRange, setDaysRange] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortalFilter, setSelectedPortalFilter] = useState<string>('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | 'open' | 'in_transit' | 'appointments_due' | 'delivered'>('all');
  const [selectedPODetails, setSelectedPODetails] = useState<OrderRecord | null>(null);
  const [editingPO, setEditingPO] = useState<OrderRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

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

  // Compute live date alerts (Shipping due today/overdue, Appointment slots today/overdue)
  const dateAlerts = useMemo(() => computePODateAlerts(orders), [orders]);

  // Aggregate Key Consignment Metrics requested by user
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

  const totalConsignmentValue = useMemo(() => orders.reduce((sum, o) => sum + (o.amount || 0), 0), [orders]);
  const totalBoxes = useMemo(() => orders.reduce((sum, o) => sum + (o.boxesCount || 0), 0), [orders]);

  // Portal-wise stats
  const portalStats = useMemo(() => {
    const namesSet = new Set<string>(['Swiggy', 'Blinkit', 'Flipkart', 'Amazon', 'Meesho']);
    portals.forEach((p) => namesSet.add(p.name));
    orders.forEach((o) => namesSet.add(o.portalName));

    return Array.from(namesSet).map((name) => {
      const portalOrders = orders.filter((o) => o.portalName.toLowerCase() === name.toLowerCase());
      const totalCount = portalOrders.length;
      const openCount = portalOrders.filter((o) => isPOOpen(o.status)).length;
      const inTransitCount = portalOrders.filter((o) => isPOInTransit(o.status)).length;
      const deliveredCount = portalOrders.filter((o) => isPODelivered(o.status)).length;
      const totalBoxesCount = portalOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
      const revenue = portalOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

      // Find next upcoming appointment
      const upcomingAppt = portalOrders
        .filter((o) => !isPODelivered(o.status) && o.appointmentDate)
        .sort((a, b) => (a.appointmentDate || '').localeCompare(b.appointmentDate || ''))[0];

      const matchedPortal = portals.find(
        (p) => p.name.toLowerCase() === name.toLowerCase() || p.platform.toLowerCase() === name.toLowerCase()
      );

      return {
        name,
        totalCount,
        openCount,
        inTransitCount,
        deliveredCount,
        totalBoxesCount,
        revenue,
        upcomingAppt,
        matchedPortal
      };
    });
  }, [orders, portals]);

  // Filtered Orders / Consignments
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Portal filter
        if (selectedPortalFilter !== 'all' && o.portalName.toLowerCase() !== selectedPortalFilter.toLowerCase()) {
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
          const hasApptDue = !isPODelivered(o.status) && (o.appointmentDate === todayStr || (o.appointmentDate && o.appointmentDate < todayStr));
          const hasShipDue = isPOOpen(o.status) && (o.shippingDate === todayStr || (o.shippingDate && o.shippingDate < todayStr));
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
        // Prioritize today's appointments / overdue appointments
        const aAppt = a.appointmentDate || '';
        const bAppt = b.appointmentDate || '';
        return bAppt.localeCompare(aAppt);
      });
  }, [orders, selectedPortalFilter, selectedStatusTab, searchQuery, todayStr]);

  // Mark Delivered handler (Requested: "PO guli delivered hoy gale mark kora jabe")
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

  const showActionToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 2800);
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

  // Helper for Status Badge
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

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Top Banner & Quick Consignment Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Swiggy Instamart & Portal Consignments
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-orange-50 text-orange-700 rounded-md border border-orange-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              PO Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized consignment workflow for Swiggy Instamart, Blinkit, Flipkart, Amazon & Meesho POs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>Orders Hub</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('analytics')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              <span>Full Analytics</span>
            </button>
          )}

          <button
            onClick={onOpenAddPortal}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Portal Link</span>
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

      {/* PRIMARY SUMMARY METRICS REQUESTED BY USER:
          1. Open POs (kotogulo PO Open ache)
          2. In Transit POs (In trnasit koto guli PO ache)
          3. Delivered POs (Delivered mark kora)
          4. Date Alerts & Schedules
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Open POs Card */}
        <button
          onClick={() => setSelectedStatusTab(selectedStatusTab === 'open' ? 'all' : 'open')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatusTab === 'open'
              ? 'bg-amber-50/80 border-amber-400 shadow-md ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200/80 shadow-xs hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Open POs (Awaiting Dispatch)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-black text-amber-900 tracking-tight">{openPOCount}</div>
            <div className="text-[11px] text-amber-800 font-medium mt-0.5 flex items-center gap-1">
              <span>Awaiting dispatch / pack</span>
              {shippingTodayCount > 0 && (
                <span className="font-bold text-amber-700">({shippingTodayCount} ship today)</span>
              )}
            </div>
          </div>
        </button>

        {/* 2. In Transit POs Card */}
        <button
          onClick={() => setSelectedStatusTab(selectedStatusTab === 'in_transit' ? 'all' : 'in_transit')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatusTab === 'in_transit'
              ? 'bg-blue-50/80 border-blue-400 shadow-md ring-2 ring-blue-400/30'
              : 'bg-white border-slate-200/80 shadow-xs hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              In Transit (En Route)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-black text-blue-900 tracking-tight">{inTransitPOCount}</div>
            <div className="text-[11px] text-blue-700 font-medium mt-0.5">
              <span>Dispatched & en route to FC</span>
            </div>
          </div>
        </button>

        {/* 3. Delivered POs Card */}
        <button
          onClick={() => setSelectedStatusTab(selectedStatusTab === 'delivered' ? 'all' : 'delivered')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatusTab === 'delivered'
              ? 'bg-emerald-50/80 border-emerald-400 shadow-md ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200/80 shadow-xs hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Delivered (Completed)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-black text-emerald-900 tracking-tight">{deliveredPOCount}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              <span>Unloaded & confirmed at hub</span>
            </div>
          </div>
        </button>

        {/* 4. Date Schedule & Appointments Alerts Card */}
        <button
          onClick={() =>
            setSelectedStatusTab(selectedStatusTab === 'appointments_due' ? 'all' : 'appointments_due')
          }
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatusTab === 'appointments_due'
              ? 'bg-purple-50/80 border-purple-400 shadow-md ring-2 ring-purple-400/30'
              : 'bg-white border-slate-200/80 shadow-xs hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Date Alerts & Slots
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-black text-purple-900 tracking-tight">
              {appointmentTodayCount + shippingTodayCount}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5 flex items-center gap-1">
              <span>{appointmentTodayCount} appts • {shippingTodayCount} dispatches today</span>
            </div>
          </div>
        </button>
      </div>

      {/* DATE NOTIFICATION ALERT BANNER (If there are active alerts today or overdue) */}
      {dateAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                  <span>Consignment Schedule Notice ({dateAlerts.length} Date Alerts Active)</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    Action Due
                  </span>
                </h3>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  Follow Swiggy Instamart & portal delivery slots: You have{' '}
                  <strong className="text-amber-950">{shippingTodayCount} shipments due today</strong> and{' '}
                  <strong className="text-amber-950">{appointmentTodayCount} FC appointment slots today</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setSelectedStatusTab('appointments_due')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                View Due Dates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL-WISE CONSIGNMENT CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Portal Consignment Summary</span>
            <span className="text-xs text-slate-400 font-normal">
              (Swiggy Instamart, Blinkit, Flipkart, Amazon, Meesho)
            </span>
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            Total ₹{totalConsignmentValue.toLocaleString()} ({totalBoxes} Cartons)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {portalStats.map((item) => {
            const theme = PORTAL_THEMES[item.name] || {
              bg: 'bg-slate-50/70',
              text: 'text-slate-700',
              border: 'border-slate-200',
              accent: '#3B82F6'
            };

            return (
              <div
                key={item.name}
                className={`bg-white rounded-2xl border ${theme.border} p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden`}
              >
                {/* Brand color stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: theme.accent }}
                />

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PortalLogo name={item.name} logoUrl={item.matchedPortal?.logoUrl} size="md" />
                      <h3 className="font-extrabold text-slate-900 text-sm">{item.name}</h3>
                    </div>

                    {item.matchedPortal && (
                      <button
                        onClick={() => onSelectPortal(item.matchedPortal!)}
                        title="Open Portal Desk"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Consignment Count breakdown */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">{item.totalCount}</span>
                      <span className="text-xs text-slate-500 font-semibold ml-1.5">POs</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.totalBoxesCount} Boxes
                    </span>
                  </div>

                  {/* Open & In Transit counts */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Open POs:
                      </span>
                      <span className="font-bold text-amber-800">{item.openCount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> In Transit:
                      </span>
                      <span className="font-bold text-blue-800">{item.inTransitCount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Delivered:
                      </span>
                      <span className="font-bold text-emerald-800">{item.deliveredCount}</span>
                    </div>

                    {/* Next Appointment Slot */}
                    <div className="pt-2 border-t border-dashed border-slate-200">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Next FC Slot:</div>
                      {item.upcomingAppt?.appointmentDate ? (
                        <div className="text-[11px] font-bold text-purple-800 mt-0.5 flex items-center gap-1 truncate">
                          <Calendar className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate">{item.upcomingAppt.appointmentDate}</span>
                          {item.upcomingAppt.appointmentDate === todayStr && (
                            <span className="px-1 py-0.2 bg-purple-200 text-purple-900 rounded text-[9px] font-black">
                              Today
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">No slots booked</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Action */}
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedPortalFilter(item.name);
                    }}
                    className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Filter {item.name} POs</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONSIGNMENT POs TABLE & LEDGER (FOLLOWING SWIGGY INSTAMART CONSIGNMENT SHEET FORMAT) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Top Controls & Filter Tabs */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>Consignments & Purchase Orders Master Ledger</span>
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full">
                  {filteredOrders.length} POs
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Track Open and In Transit POs, Shipping & Appointment dates, and confirm deliveries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search PO#, Hub, Carrier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Portal Selector Filter */}
              <select
                value={selectedPortalFilter}
                onChange={(e) => setSelectedPortalFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold"
              >
                <option value="all">All Portals</option>
                <option value="Swiggy">Swiggy Instamart</option>
                <option value="Blinkit">Blinkit</option>
                <option value="Flipkart">Flipkart</option>
                <option value="Amazon">Amazon</option>
                <option value="Meesho">Meesho</option>
              </select>
            </div>
          </div>

          {/* Status Tabs Navigation */}
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
              <span>Appointments Today / Overdue ({appointmentTodayCount + shippingTodayCount})</span>
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

        {/* Consignments Table */}
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
                <th className="py-3 px-4 text-right">Delivery / Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Box className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-slate-700 text-sm">No Consignment POs Found</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Add a new PO or change filter to see your consignments.
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
                      {/* 1. Portal */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <PortalLogo name={order.portalName} size="sm" />
                          <span>{order.portalName}</span>
                        </div>
                      </td>

                      {/* 2. PO Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                          {poNum}
                        </span>
                      </td>

                      {/* 3. Destination Hub */}
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

                      {/* 4. Shipping Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderShippingDateBadge(order)}
                      </td>

                      {/* 5. Appointment Date (FC Slot) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderAppointmentDateBadge(order)}
                      </td>

                      {/* 6. Boxes & Units */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {order.boxesCount ? `${order.boxesCount} Boxes` : `${order.itemsCount} units`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {order.itemsCount} total units
                        </div>
                      </td>

                      {/* 7. PO Amount */}
                      <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                        ₹{order.amount?.toLocaleString()}
                      </td>

                      {/* 8. Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getConsignmentStatusBadge(order.status)}
                      </td>

                      {/* 9. CRITICAL ACTION: Mark Delivered / Status Switcher */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dedicated MARK AS DELIVERED button (Direct 1-click execution) */}
                          {!isPODelivered(order.status) ? (
                            <button
                              onClick={() => handleMarkDelivered(order.id, poNum)}
                              title="Confirm consignment delivered & GRN unloaded"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all hover:scale-105 active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Delivered</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Delivered
                            </span>
                          )}

                          {/* If Open, show Mark In Transit quick button */}
                          {isPOOpen(order.status) && (
                            <button
                              onClick={() => handleMarkInTransit(order.id, poNum)}
                              title="Mark as dispatched on the road"
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* Dedicated Edit PO Button */}
                          <button
                            onClick={() => setEditingPO(order)}
                            title="Edit Consignment Purchase Order"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            <Edit2 className="w-3 h-3 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          {/* Quick status dropdown for manual edits */}
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
            Tip: Click any row to view full consignment details and appointment verification.
          </span>
        </div>
      </div>

      {/* TREND CHART */}
      <TrendChart
        orders={orders}
        daysRange={daysRange}
        onRangeChange={setDaysRange}
      />

      {/* PO DETAILS MODAL (When clicking row) */}
      {selectedPODetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
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
                onClick={() => setSelectedPODetails(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
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

              {/* Dates Grid */}
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

              {/* Volume & Amount */}
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

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedPODetails(null)}
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

      {/* EDIT CONSIGNMENT PO MODAL */}
      <EditPOModal
        isOpen={!!editingPO}
        onClose={() => setEditingPO(null)}
        order={editingPO}
        portals={portals}
        onOrderUpdated={() => {
          setActionSuccessMessage('Purchase Order details updated successfully.');
          setTimeout(() => setActionSuccessMessage(null), 3000);
        }}
      />
    </div>
  );
};
