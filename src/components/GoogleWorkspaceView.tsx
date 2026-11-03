import React, { useState } from 'react';
import { DocSheetItem } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, deleteDoc } from 'firebase/firestore';
import { formatDateTime } from '../utils/googleEmbed';
import {
  FileSpreadsheet,
  FileText,
  Plus,
  ExternalLink,
  Trash2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  UserCheck,
  Edit3,
  ArrowLeft,
  X
} from 'lucide-react';

interface GoogleWorkspaceViewProps {
  documents: DocSheetItem[];
  selectedDoc: DocSheetItem | null;
  onSelectDoc: (docItem: DocSheetItem | null) => void;
  onOpenAddDoc: () => void;
  onOpenLogUpdate: (docItem: DocSheetItem) => void;
}

export const GoogleWorkspaceView: React.FC<GoogleWorkspaceViewProps> = ({
  documents,
  selectedDoc,
  onSelectDoc,
  onOpenAddDoc,
  onOpenLogUpdate
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'documents', id));
      if (selectedDoc?.id === id) {
        onSelectDoc(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `documents/${id}`);
    }
  };

  // FULL SCREEN VIEW: HIDES ALL OTHER OPTIONS AND MAXIMIZES THE SHEET/DOC (as requested: "google sheet, docs jokhon full screen korbo baki option guli hide koro")
  if (fullscreen && selectedDoc) {
    const isSheet = selectedDoc.type === 'sheet';

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-150">
        {/* Fullscreen Clean Top Navigation Bar */}
        <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Exit Fullscreen Button */}
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 text-xs font-semibold shrink-0"
              title="Exit Full Screen"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Fullscreen</span>
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2 truncate">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isSheet ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isSheet ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <span className="font-extrabold text-slate-900 text-sm truncate">
                {selectedDoc.title}
              </span>
              {selectedDoc.lastUpdatedBy && (
                <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-500 font-medium ml-2">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>{selectedDoc.lastUpdatedBy}</span>
                  <span className="text-slate-300">•</span>
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{selectedDoc.lastUpdatedAt ? formatDateTime(selectedDoc.lastUpdatedAt) : ''}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Log Update Button */}
            <button
              onClick={() => onOpenLogUpdate(selectedDoc)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors shadow-emerald-600/15"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Log Sheet Update</span>
            </button>

            <button
              onClick={() => setIframeKey((prev) => prev + 1)}
              title="Reload Sheet Frame"
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href={selectedDoc.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Open Drive</span>
            </a>

            <button
              onClick={() => setFullscreen(false)}
              title="Minimize / Exit Fullscreen"
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 100% Fullscreen Iframe: Completely fills screen with zero clutter or other options */}
        <div className="flex-1 w-full h-full relative bg-white">
          <iframe
            key={iframeKey}
            src={selectedDoc.embedUrl || selectedDoc.url}
            title={selectedDoc.title}
            allow="clipboard-read; clipboard-write;"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    );
  }

  // STANDARD WORKSPACE VIEW (When NOT in Full Screen)
  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Google Docs & Sheets Workspace
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
              Live In-Software Editor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Embed, view, and directly edit Google Sheets and Docs. Every edit can be logged with user name and time.
          </p>
        </div>

        <button
          onClick={onOpenAddDoc}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Google Sheet / Doc</span>
        </button>
      </div>

      {/* Sheet / Doc Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {documents.map((d) => {
          const isSelected = selectedDoc?.id === d.id;
          const isSheet = d.type === 'sheet';

          return (
            <button
              key={d.id}
              onClick={() => onSelectDoc(d)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                isSelected
                  ? isSheet
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                    : 'bg-blue-50 text-blue-800 border-blue-300 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {isSheet ? (
                <FileSpreadsheet className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-emerald-500'}`} />
              ) : (
                <FileText className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-blue-500'}`} />
              )}
              <span className="truncate max-w-[200px]">{d.title}</span>
            </button>
          );
        })}

        <button
          onClick={onOpenAddDoc}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 bg-white transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Sheet Link</span>
        </button>
      </div>

      {/* Embedded Live Runner & Editor Area */}
      {selectedDoc ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Top Bar for active document with update audit status */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedDoc.type === 'sheet' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedDoc.type === 'sheet' ? (
                  <FileSpreadsheet className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedDoc.title}</h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="capitalize">{selectedDoc.type}</span>
                  {selectedDoc.lastUpdatedBy && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        Last updated by: {selectedDoc.lastUpdatedBy}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        {selectedDoc.lastUpdatedAt ? formatDateTime(selectedDoc.lastUpdatedAt) : 'Recently'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenLogUpdate(selectedDoc)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors shadow-emerald-600/10"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Log My Sheet Update</span>
              </button>

              <button
                onClick={() => setIframeKey((prev) => prev + 1)}
                title="Reload Sheet"
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <a
                href={selectedDoc.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Open in Drive</span>
              </a>

              {/* Fullscreen Toggle Button */}
              <button
                onClick={() => setFullscreen(true)}
                title="Fullscreen Editor (Hides all other options)"
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Full Screen</span>
              </button>

              {deleteConfirmId === selectedDoc.id ? (
                <button
                  onClick={() => handleDelete(selectedDoc.id)}
                  className="px-2.5 py-1 text-xs bg-rose-600 text-white font-bold rounded-lg shadow-xs hover:bg-rose-700 transition-colors"
                >
                  Confirm Delete
                </button>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(selectedDoc.id)}
                  title="Delete document"
                  className="p-1.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg text-xs transition-colors hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Embedded Google Sheets / Docs Frame */}
          <div className="relative bg-slate-100 min-h-[640px] flex flex-col">
            <iframe
              key={iframeKey}
              src={selectedDoc.embedUrl || selectedDoc.url}
              title={selectedDoc.title}
              allow="clipboard-read; clipboard-write;"
              className="w-full flex-1 border-0 min-h-[640px] bg-white"
            />

            {/* Help Bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Click <strong>"Full Screen"</strong> above to hide all menus and focus 100% on this sheet!
                </span>
              </div>
              <button
                onClick={() => onOpenLogUpdate(selectedDoc)}
                className="shrink-0 px-2.5 py-1 text-emerald-700 font-semibold hover:underline"
              >
                + Record Update Record
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Select a Google Sheet or Doc</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Click one of the sheets above to run and edit it directly inside the software.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {documents.length > 0 && (
              <button
                onClick={() => onSelectDoc(documents[0])}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Open {documents[0].title}
              </button>
            )}
            <button
              onClick={onOpenAddDoc}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              + Add Google Sheet Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
