import React, { useState, useMemo } from 'react';
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
  Sparkles
} from 'lucide-react';
import { PortalLogo } from '../utils/portalLogos';

interface DashboardViewProps {
  orders: OrderRecord[];
  portals: PortalLink[];
  onOpenAddOrder: () => void;
  onOpenAddPortal: () => void;
  onSelectPortal: (portal: PortalLink) => void;
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
  onSelectPortal
}) => {
  const [daysRange, setDaysRange] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortalFilter, setSelectedPortalFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute portal metrics
  const portalStats = useMemo(() => {
    // Unique list of all portal names from portals list and orders
    const namesSet = new Set<string>(['Flipkart', 'Amazon', 'Meesho', 'Swiggy', 'Blinkit']);
    portals.forEach((p) => namesSet.add(p.name));
    orders.forEach((o) => namesSet.add(o.portalName));

    return Array.from(namesSet).map((name) => {
      const portalOrders = orders.filter((o) => o.portalName.toLowerCase() === name.toLowerCase());
      const totalCount = portalOrders.length;
      const todayCount = portalOrders.filter((o) => o.date === todayStr).length;
      const pendingCount = portalOrders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
      const dispatchedCount = portalOrders.filter((o) => o.status === 'dispatched').length;
      const deliveredCount = portalOrders.filter((o) => o.status === 'delivered').length;
      const revenue = portalOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

      // Find matching portal object if configured
      const matchedPortal = portals.find(
        (p) => p.name.toLowerCase() === name.toLowerCase() || p.platform.toLowerCase() === name.toLowerCase()
      );

      return {
        name,
        totalCount,
        todayCount,
        pendingCount,
        dispatchedCount,
        deliveredCount,
        revenue,
        matchedPortal
      };
    });
  }, [orders, portals, todayStr]);

  // Overall aggregate KPIs
  const totalOrdersCount = orders.length;
  const todayOrdersCount = orders.filter((o) => o.date === todayStr).length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalPending = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
  const totalDelivered = orders.filter((o) => o.status === 'delivered').length;
  const deliveryRate = totalOrdersCount > 0 ? Math.round((totalDelivered / totalOrdersCount) * 100) : 0;

  // Filtered orders table
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (selectedPortalFilter !== 'all' && o.portalName.toLowerCase() !== selectedPortalFilter.toLowerCase()) {
          return false;
        }
        if (selectedStatusFilter !== 'all' && o.status !== selectedStatusFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchOrderNo = o.orderNumber?.toLowerCase().includes(q);
          const matchCust = o.customerName?.toLowerCase().includes(q);
          const matchPortal = o.portalName?.toLowerCase().includes(q);
          if (!matchOrderNo && !matchCust && !matchPortal) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [orders, selectedPortalFilter, selectedStatusFilter, searchQuery]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'dispatched':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">Dispatched</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">Confirmed</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Pending</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">Cancelled</span>;
      case 'returned':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">Returned</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Multi-Portal Orders Hub</h1>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated order volume, channel performance cards, and daily fulfillment trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddPortal}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Portal Link</span>
          </button>
          <button
            onClick={onOpenAddOrder}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shadow-blue-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Order</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">{totalOrdersCount}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <span>+{todayOrdersCount} today</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Fulfillment</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-amber-700">{totalPending}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Needs pack & dispatch</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gross Sales Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all connected portals</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Delivered Ratio</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-purple-700">{deliveryRate}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{totalDelivered} completed orders</div>
          </div>
        </div>
      </div>

      {/* PORTAL SPECIFIC METRIC CARDS (Sob portaler order koto guli asche ta card er moddhe) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Portal-Wise Order Cards
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {portalStats.length} Channels Monitored
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
                className={`bg-white rounded-2xl border ${theme.border} p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group overflow-hidden`}
              >
                {/* Top decorative stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: theme.accent }}
                />

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <PortalLogo
                        name={item.name}
                        logoUrl={item.matchedPortal?.logoUrl}
                        size="md"
                      />
                      <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                    </div>

                    {item.matchedPortal && (
                      <button
                        onClick={() => onSelectPortal(item.matchedPortal!)}
                        title="Open in Workspace"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Big Total Order count */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {item.totalCount}
                      </span>
                      <span className="text-xs text-slate-500 font-medium ml-1.5">orders</span>
                    </div>
                    {item.todayCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +{item.todayCount} today
                      </span>
                    )}
                  </div>

                  {/* Micro Breakdown Stats */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3 h-3 text-amber-500" /> Pending
                      </span>
                      <span className="font-semibold text-slate-800">{item.pendingCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Truck className="w-3 h-3 text-blue-500" /> Dispatched
                      </span>
                      <span className="font-semibold text-slate-800">{item.dispatchedCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Delivered
                      </span>
                      <span className="font-semibold text-slate-800">{item.deliveredCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-dashed border-slate-200">
                      <span className="text-[11px] font-medium text-slate-500">Sales Value</span>
                      <span className="font-bold text-slate-900 text-xs">₹{item.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Action */}
                <div className="mt-3 pt-2">
                  {item.matchedPortal ? (
                    <button
                      onClick={() => onSelectPortal(item.matchedPortal!)}
                      className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Open Seller Desk</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={onOpenAddPortal}
                      className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[11px] font-medium transition-colors"
                    >
                      + Connect URL
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TREND CHART (sob portaler order trend er modhe show korbe) */}
      <TrendChart
        orders={orders}
        daysRange={daysRange}
        onRangeChange={setDaysRange}
      />

      {/* RECENT ORDERS TABLE & LEDGER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Orders Ledger & Status Updates</h3>
            <p className="text-xs text-slate-500">Track and update individual orders from all channels</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Portal Filter */}
            <select
              value={selectedPortalFilter}
              onChange={(e) => setSelectedPortalFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="all">All Portals</option>
              <option value="Flipkart">Flipkart</option>
              <option value="Amazon">Amazon</option>
              <option value="Meesho">Meesho</option>
              <option value="Swiggy">Swiggy</option>
              <option value="Blinkit">Blinkit</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Portal</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer / Destination</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No orders match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, 15).map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <span className="flex items-center gap-2">
                          <PortalLogo
                            name={order.portalName}
                            size="sm"
                          />
                          <span>{order.portalName}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-800 text-[11px]">
                        {order.orderNumber}
                      </td>

                      <td className="py-3 px-4 truncate max-w-[150px]">
                        {order.customerName || 'Direct Customer'}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {order.date}
                      </td>

                      <td className="py-3 px-4">
                        {order.itemsCount || 1} pcs
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{order.amount?.toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(order.status)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className="text-[11px] font-medium bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer hover:border-slate-300"
                        >
                          <option value="pending">Mark Pending</option>
                          <option value="confirmed">Mark Confirmed</option>
                          <option value="dispatched">Mark Dispatched</option>
                          <option value="delivered">Mark Delivered</option>
                          <option value="cancelled">Mark Cancelled</option>
                          <option value="returned">Mark Returned</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 15 && (
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-center text-xs text-slate-500">
            Showing top 15 of {filteredOrders.length} orders
          </div>
        )}
      </div>
    </div>
  );
};
