import React, { useState, useMemo } from 'react';
import { SheetUpdateLog, DocSheetItem } from '../types';
import { formatDateTime } from '../utils/googleEmbed';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  UserCheck,
  FileSpreadsheet,
  Plus,
  ArrowUpDown,
  Tag,
  Clock
} from 'lucide-react';

interface SheetLogsViewProps {
  logs: SheetUpdateLog[];
  documents: DocSheetItem[];
  onOpenLogUpdate: (docItem: DocSheetItem) => void;
}

export const SheetLogsView: React.FC<SheetLogsViewProps> = ({
  logs,
  documents,
  onOpenLogUpdate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheetFilter, setSelectedSheetFilter] = useState('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return logs
      .filter((l) => {
        if (selectedSheetFilter !== 'all' && l.documentId !== selectedSheetFilter) {
          return false;
        }
        if (selectedActionFilter !== 'all' && l.actionType !== selectedActionFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchUser = l.userName?.toLowerCase().includes(q);
          const matchEmail = l.userEmail?.toLowerCase().includes(q);
          const matchSheet = l.sheetTitle?.toLowerCase().includes(q);
          const matchSummary = l.changeSummary?.toLowerCase().includes(q);
          if (!matchUser && !matchEmail && !matchSheet && !matchSummary) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime());
  }, [logs, selectedSheetFilter, selectedActionFilter, searchQuery]);

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Sheet Title', 'Updated By', 'User Email', 'Timestamp', 'Category', 'Cell Range', 'Summary'];
    const rows = filteredLogs.map((l) => [
      `"${l.sheetTitle.replace(/"/g, '""')}"`,
      `"${l.userName.replace(/"/g, '""')}"`,
      `"${l.userEmail.replace(/"/g, '""')}"`,
      `"${formatDateTime(l.timestamp).replace(/"/g, '""')}"`,
      `"${l.actionType}"`,
      `"${(l.affectedRange || '').replace(/"/g, '""')}"`,
      `"${l.changeSummary.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sheet_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'inventory_update':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
            Inventory Stock
          </span>
        );
      case 'order_sync':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            Order Sync
          </span>
        );
      case 'price_change':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
            Price Change
          </span>
        );
      case 'data_entry':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
            Data Entry
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            General Edit
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Google Sheet Update Audit Trail
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-purple-50 text-purple-700 rounded-md border border-purple-200">
              Identity & Timestamp Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Permanent history of who updated each Google Sheet, exact date/time, and modifications made.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <button
              onClick={() => onOpenLogUpdate(documents[0])}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Sheet Update</span>
            </button>
          )}

          <button
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Audit Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Updates Recorded</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{logs.length}</div>
          <span className="text-[11px] text-slate-400">Timestamped audit entries</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Active Contributing Users</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {new Set(logs.map((l) => l.userEmail || l.userName)).size}
          </div>
          <span className="text-[11px] text-slate-400">Team members modifying sheets</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Tracked Sheets</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {new Set(logs.map((l) => l.documentId)).size}
          </div>
          <span className="text-[11px] text-slate-400">Google Sheets under audit log</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Historical Activity Log</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search user, email, or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800"
              />
            </div>

            {/* Sheet Filter */}
            <select
              value={selectedSheetFilter}
              onChange={(e) => setSelectedSheetFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="all">All Sheets</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="all">All Categories</option>
              <option value="inventory_update">Inventory Update</option>
              <option value="order_sync">Order Sync</option>
              <option value="price_change">Price Change</option>
              <option value="data_entry">Data Entry</option>
              <option value="general_edit">General Edit</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Updater (Name & Identity)</th>
                <th className="py-3 px-4">Exact Timestamp</th>
                <th className="py-3 px-4">Target Sheet</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Range / Cell</th>
                <th className="py-3 px-4">Changes & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No audit log records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(log.userName || log.userEmail || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>{log.userName}</span>
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                            </div>
                            <div className="text-[10px] text-slate-400">{log.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Exact Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* Sheet Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 max-w-[180px] truncate">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{log.sheetTitle}</span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4">
                        {getActionBadge(log.actionType)}
                      </td>

                      {/* Affected Range */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {log.affectedRange || '—'}
                      </td>

                      {/* Summary of what was updated */}
                      <td className="py-3 px-4 max-w-xs text-slate-700 font-medium">
                        {log.changeSummary}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
