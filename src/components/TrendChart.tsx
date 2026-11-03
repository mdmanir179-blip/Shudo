import React, { useState, useMemo } from 'react';
import { OrderRecord } from '../types';
import { TrendingUp, Calendar, Layers, BarChart3 } from 'lucide-react';

interface TrendChartProps {
  orders: OrderRecord[];
  daysRange: number;
  onRangeChange: (days: number) => void;
}

const PORTAL_COLORS: Record<string, string> = {
  'Flipkart': '#2874F0',
  'Amazon': '#FF9900',
  'Meesho': '#8B1E5D',
  'Swiggy': '#FC8019',
  'Blinkit': '#0C831F',
  'Other': '#64748B'
};

export const TrendChart: React.FC<TrendChartProps> = ({ orders, daysRange, onRangeChange }) => {
  const [viewMode, setViewMode] = useState<'stacked' | 'total' | 'revenue'>('total');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate date series for the past N days
  const dateSeries = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  }, [daysRange]);

  // Aggregate orders by date and portal
  const chartData = useMemo(() => {
    return dateSeries.map((dateStr) => {
      const dayOrders = orders.filter((o) => {
        const rawDate = o.date || o.shippingDate || o.createdAt || '';
        const cleanDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        return cleanDate === dateStr;
      });
      const totalCount = dayOrders.length;
      const totalRevenue = dayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

      const byPortal: Record<string, number> = {
        'Flipkart': 0,
        'Amazon': 0,
        'Meesho': 0,
        'Swiggy': 0,
        'Blinkit': 0,
        'Other': 0
      };

      dayOrders.forEach((o) => {
        const p = o.portalName || 'Other';
        if (byPortal[p] !== undefined) {
          byPortal[p] += 1;
        } else {
          byPortal['Other'] += 1;
        }
      });

      // format label (e.g. "Nov 2")
      const parts = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      const label = `${monthNames[mIdx]} ${dayNum}`;

      return {
        dateStr,
        label,
        totalCount,
        totalRevenue,
        byPortal
      };
    });
  }, [dateSeries, orders]);

  // Max value for scaling
  const maxValue = useMemo(() => {
    if (viewMode === 'revenue') {
      const max = Math.max(...chartData.map((d) => d.totalRevenue), 100);
      return Math.ceil(max * 1.15);
    }
    const max = Math.max(...chartData.map((d) => d.totalCount), 5);
    return Math.ceil(max * 1.2);
  }, [chartData, viewMode]);

  // SVG Chart dimensions
  const svgWidth = 720;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingBottom = 30;
  const paddingTop = 20;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * plotWidth;
    const val = viewMode === 'revenue' ? d.totalRevenue : d.totalCount;
    const y = paddingTop + plotHeight - (val / maxValue) * plotHeight;
    return { x, y, data: d };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, pt, idx) => {
        if (idx === 0) return `M ${pt.x} ${pt.y}`;
        const prev = points[idx - 1];
        const cpX1 = prev.x + (pt.x - prev.x) / 2;
        const cpX2 = cpX1;
        return `${acc} C ${cpX1} ${prev.y}, ${cpX2} ${pt.y}, ${pt.x} ${pt.y}`;
      }, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
    : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 transition-all">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Order Volume & Performance Trend</h3>
            <p className="text-xs text-slate-500">Real-time daily orders across connected seller channels</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('total')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'total' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Order Count
            </button>
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'stacked' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portal Breakdown
            </button>
            <button
              onClick={() => setViewMode('revenue')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'revenue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue (₹)
            </button>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => onRangeChange(days)}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  daysRange === days ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="relative mt-4 w-full overflow-x-auto">
        {viewMode === 'stacked' ? (
          // Stacked Bars View for Portal Comparison
          <div className="pt-2">
            <div className="h-48 flex items-end gap-2 sm:gap-3 px-2 border-b border-slate-200">
              {chartData.map((d, idx) => {
                const total = d.totalCount;
                const heightPercent = total > 0 ? Math.min(100, Math.max(10, (total / maxValue) * 100)) : 4;
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={d.dateStr}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 z-20 bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-xl pointer-events-none min-w-[150px] border border-slate-700 animate-in fade-in duration-150">
                        <div className="font-bold border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
                          <span>{d.label}</span>
                          <span className="text-blue-400">{d.totalCount} Orders</span>
                        </div>
                        {Object.entries(d.byPortal).map(([portal, count]) => {
                          if (count === 0) return null;
                          return (
                            <div key={portal} className="flex items-center justify-between text-[11px] py-0.5">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: PORTAL_COLORS[portal] || '#64748B' }}
                                />
                                {portal}
                              </span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Segmented Bar */}
                    <div
                      className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:ring-2 group-hover:ring-blue-400 group-hover:ring-offset-1"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {total === 0 ? (
                        <div className="w-full h-1 bg-slate-200 rounded-t" />
                      ) : (
                        Object.entries(d.byPortal).map(([portal, count]) => {
                          if (count === 0) return null;
                          const segPercent = (count / total) * 100;
                          return (
                            <div
                              key={portal}
                              style={{
                                height: `${segPercent}%`,
                                backgroundColor: PORTAL_COLORS[portal] || '#64748B'
                              }}
                              className="w-full transition-all"
                              title={`${portal}: ${count}`}
                            />
                          );
                        })
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 mt-2 truncate w-full text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Continuous Smooth Curve Area View
          <div className="relative">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-52 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = paddingTop + plotHeight * pct;
                const valueLabel = Math.round(maxValue * (1 - pct));
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="#94A3B8"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="sans-serif"
                    >
                      {viewMode === 'revenue' ? `₹${valueLabel}` : valueLabel}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}

              {/* Main Trend Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {points.map((pt, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5.5 : 3.5}
                      fill={isHovered ? '#1D4ED8' : '#FFFFFF'}
                      stroke="#2563EB"
                      strokeWidth={isHovered ? 3 : 2}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    {/* X-axis labels */}
                    {(chartData.length <= 10 || idx % Math.ceil(chartData.length / 8) === 0) && (
                      <text
                        x={pt.x}
                        y={svgHeight - 8}
                        fill="#64748B"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {pt.data.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="absolute z-20 bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full border border-slate-700 animate-in fade-in duration-150"
                style={{
                  left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                  top: `${(points[hoveredIndex].y / svgHeight) * 100}%`,
                  marginTop: '-10px'
                }}
              >
                <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-100">
                  {points[hoveredIndex].data.label}
                </div>
                <div className="flex items-center justify-between gap-4 text-emerald-400 font-medium">
                  <span>Total Orders:</span>
                  <span className="font-bold text-white">{points[hoveredIndex].data.totalCount}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-blue-300">
                  <span>Day Revenue:</span>
                  <span className="font-bold text-white">₹{points[hoveredIndex].data.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          {Object.entries(PORTAL_COLORS).map(([portal, color]) => (
            <div key={portal} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-medium text-slate-700">{portal}</span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-slate-400">
          Showing {orders.length} total orders across {daysRange} days
        </div>
      </div>
    </div>
  );
};
