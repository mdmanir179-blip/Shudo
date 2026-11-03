import React, { useState, useMemo } from 'react';
import { OrderRecord, PortalLink } from '../types';
import { TrendChart } from './TrendChart';
import { PortalLogo } from '../utils/portalLogos';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Package,
  Truck,
  CheckCircle2,
  Calendar,
  Box,
  Layers,
  ArrowUpRight,
  PieChart,
  ShoppingBag,
  Clock,
  Sparkles,
  MapPin,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  isPOOpen,
  isPOInTransit,
  isPODelivered
} from '../utils/poNotifications';

interface AnalyticsViewProps {
  orders: OrderRecord[];
  portals: PortalLink[];
  onOpenAddOrder: () => void;
  onNavigateToOrders: () => void;
}

const PORTAL_COLORS: Record<string, string> = {
  'Swiggy': '#FC8019',
  'Blinkit': '#0C831F',
  'Flipkart': '#2874F0',
  'Amazon': '#FF9900',
  'Meesho': '#8B1E5D',
  'Other': '#64748B'
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  orders,
  portals,
  onOpenAddOrder,
  onNavigateToOrders
}) => {
  const [daysRange, setDaysRange] = useState<number>(7);
  const [activePortalFilter, setActivePortalFilter] = useState<string>('all');

  // Filtered orders for specific channel inspection
  const filteredOrders = useMemo(() => {
    if (activePortalFilter === 'all') return orders;
    return orders.filter(
      (o) => (o.portalName || '').toLowerCase() === activePortalFilter.toLowerCase()
    );
  }, [orders, activePortalFilter]);

  // Aggregate Metrics
  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
    [filteredOrders]
  );

  const totalBoxes = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0),
    [filteredOrders]
  );

  const totalUnits = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (o.itemsCount || 0), 0),
    [filteredOrders]
  );

  const openCount = useMemo(
    () => filteredOrders.filter((o) => isPOOpen(o.status)).length,
    [filteredOrders]
  );

  const inTransitCount = useMemo(
    () => filteredOrders.filter((o) => isPOInTransit(o.status)).length,
    [filteredOrders]
  );

  const deliveredCount = useMemo(
    () => filteredOrders.filter((o) => isPODelivered(o.status)).length,
    [filteredOrders]
  );

  const deliveryRate = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    return Math.round((deliveredCount / filteredOrders.length) * 100);
  }, [deliveredCount, filteredOrders.length]);

  const avgOrderValue = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    return Math.round(totalRevenue / filteredOrders.length);
  }, [totalRevenue, filteredOrders.length]);

  // Channel breakdown
  const channelBreakdown = useMemo(() => {
    const channels = ['Swiggy', 'Blinkit', 'Flipkart', 'Amazon', 'Meesho'];
    const channelStats = channels.map((channel) => {
      const channelOrders = orders.filter(
        (o) => (o.portalName || '').toLowerCase() === channel.toLowerCase()
      );
      const rev = channelOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const boxes = channelOrders.reduce((sum, o) => sum + (o.boxesCount || 0), 0);
      const delivered = channelOrders.filter((o) => isPODelivered(o.status)).length;
      const count = channelOrders.length;
      const pctRevenue = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;
      const pctOrders = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;

      return {
        channel,
        count,
        rev,
        boxes,
        delivered,
        pctRevenue,
        pctOrders,
        color: PORTAL_COLORS[channel] || '#64748B'
      };
    });

    return channelStats.sort((a, b) => b.rev - a.rev);
  }, [orders, totalRevenue]);

  // Top destination fulfillment hubs
  const hubStats = useMemo(() => {
    const hubMap: Record<string, { count: number; value: number; boxes: number; portal: string }> = {};
    orders.forEach((o) => {
      const hub = o.destinationHub?.trim() || 'General Hub';
      if (!hubMap[hub]) {
        hubMap[hub] = { count: 0, value: 0, boxes: 0, portal: o.portalName };
      }
      hubMap[hub].count += 1;
      hubMap[hub].value += (o.amount || 0);
      hubMap[hub].boxes += (o.boxesCount || 0);
    });

    return Object.entries(hubMap)
      .map(([hub, data]) => ({ hub, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [orders]);

  // Carrier / Logistics distribution
  const carrierStats = useMemo(() => {
    const carrierMap: Record<string, number> = {};
    orders.forEach((o) => {
      const carrier = o.carrier?.trim() || 'Standard Courier';
      carrierMap[carrier] = (carrierMap[carrier] || 0) + 1;
    });

    return Object.entries(carrierMap)
      .map(([carrier, count]) => ({
        carrier,
        count,
        pct: orders.length > 0 ? Math.round((count / orders.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Consignment Analytics & Performance
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-md">
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sales revenue, order volume trends, portal market share, and fulfillment metrics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Channel selector filter */}
          <select
            value={activePortalFilter}
            onChange={(e) => setActivePortalFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Channels (Omni-channel)</option>
            <option value="Swiggy">Swiggy Instamart</option>
            <option value="Blinkit">Blinkit</option>
            <option value="Flipkart">Flipkart</option>
            <option value="Amazon">Amazon</option>
            <option value="Meesho">Meesho</option>
          </select>

          <button
            onClick={onNavigateToOrders}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-slate-200"
          >
            <Package className="w-3.5 h-3.5 text-slate-600" />
            <span>View Orders Table</span>
          </button>

          <button
            onClick={onOpenAddOrder}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New PO</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Consignment Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Value</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Across {filteredOrders.length} POs</span>
          </div>
        </div>

        {/* Total Consignment POs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total POs</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {filteredOrders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>{openCount} Open • {inTransitCount} Transit</span>
          </div>
        </div>

        {/* Average PO Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg PO Value</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              AVG
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{avgOrderValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            <span>Per Consignment</span>
          </div>
        </div>

        {/* Total Boxes / Cartons */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Cartons</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {totalBoxes}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>{totalUnits} Total Units</span>
          </div>
        </div>

        {/* In Transit POs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Transit</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">
            {inTransitCount}
          </div>
          <div className="text-[11px] text-blue-700 font-medium mt-1">
            <span>Dispatched on road</span>
          </div>
        </div>

        {/* Delivered Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fulfillment Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 tracking-tight">
            {deliveryRate}%
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            <span>{deliveredCount} of {filteredOrders.length} Delivered</span>
          </div>
        </div>
      </div>

      {/* TREND CHART COMPONENT */}
      <TrendChart
        orders={filteredOrders}
        daysRange={daysRange}
        onRangeChange={setDaysRange}
      />

      {/* TWO COLUMN GRID: PORTAL REVENUE BREAKDOWN & STATUS FUNNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Portal Share & Comparison */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Portal Performance & Channel Share
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Revenue & Order Distribution
            </span>
          </div>

          <div className="space-y-4">
            {channelBreakdown.map((item) => (
              <div
                key={item.channel}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <PortalLogo name={item.channel} size="sm" />
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{item.channel}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {item.count} POs • {item.boxes} Cartons
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 text-xs">
                      ₹{item.rev.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold ml-2">
                      ({item.pctRevenue}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(item.pctRevenue, item.count > 0 ? 5 : 0)}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (1 col): Status Fulfillment Funnel & Logistics */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Fulfillment Status</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Real-time</span>
            </div>

            {/* Status Breakdown items */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-amber-900">Open POs (Pending)</span>
                </div>
                <span className="font-black text-amber-950 text-sm">{openCount}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-900">In Transit (Dispatched)</span>
                </div>
                <span className="font-black text-blue-950 text-sm">{inTransitCount}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-900">Delivered & Confirmed</span>
                </div>
                <span className="font-black text-emerald-950 text-sm">{deliveredCount}</span>
              </div>
            </div>

            {/* Top Carriers */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Logistics & Transporters
              </div>
              <div className="space-y-2">
                {carrierStats.map((c) => (
                  <div key={c.carrier} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate font-medium">{c.carrier}</span>
                    <span className="font-bold text-slate-900">{c.count} POs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <button
              onClick={onNavigateToOrders}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Manage All Consignment POs</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP DESTINATION FULFILLMENT HUBS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              Top Destination Fulfillment Centers (FC Hubs)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Ranked by PO Value</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Fulfillment Center / Hub</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Total POs</th>
                <th className="py-2.5 px-3">Cartons</th>
                <th className="py-2.5 px-3 text-right">Consignment Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hubStats.map((h) => (
                <tr key={h.hub} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{h.hub}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <PortalLogo name={h.portal} size="sm" />
                      <span>{h.portal}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800">{h.count} POs</td>
                  <td className="py-3 px-3 text-slate-600">{h.boxes} Boxes</td>
                  <td className="py-3 px-3 font-extrabold text-slate-900 text-right">
                    ₹{h.value.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
