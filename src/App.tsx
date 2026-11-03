import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db, handleFirestoreError, OperationType } from './firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PortalLink, DocSheetItem, SheetUpdateLog, OrderRecord } from './types';
import { ActiveTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PortalsView } from './components/PortalsView';
import { GoogleWorkspaceView } from './components/GoogleWorkspaceView';
import { SheetLogsView } from './components/SheetLogsView';
import { AuthModal } from './components/AuthModal';
import { QuickOrderModal } from './components/QuickOrderModal';
import { AddPortalModal } from './components/AddPortalModal';
import { AddDocModal } from './components/AddDocModal';
import { LogSheetUpdateModal } from './components/LogSheetUpdateModal';
import { ClearDataModal } from './components/ClearDataModal';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Firestore synced data
  const [portals, setPortals] = useState<PortalLink[]>([]);
  const [documents, setDocuments] = useState<DocSheetItem[]>([]);
  const [sheetLogs, setSheetLogs] = useState<SheetUpdateLog[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  // Selection states for runners
  const [selectedPortal, setSelectedPortal] = useState<PortalLink | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocSheetItem | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddPortalModalOpen, setIsAddPortalModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isLogUpdateModalOpen, setIsLogUpdateModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [logTargetDoc, setLogTargetDoc] = useState<DocSheetItem | null>(null);

  // Monitor desktop fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Firestore subscriptions attached when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setPortals([]);
      setDocuments([]);
      setSheetLogs([]);
      setOrders([]);
      setSelectedPortal(null);
      setSelectedDoc(null);
      return;
    }

    const userId = currentUser.uid;

    // 1. Portals subscription
    const portalsQuery = query(collection(db, 'portals'), where('ownerId', '==', userId));
    const unsubPortals = onSnapshot(
      portalsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as PortalLink[];
        setPortals(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'portals');
      }
    );

    // 2. Google Docs & Sheets subscription
    const docsQuery = query(collection(db, 'documents'), where('ownerId', '==', userId));
    const unsubDocs = onSnapshot(
      docsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as DocSheetItem[];
        setDocuments(items);
        setSelectedDoc((prev) =>
          prev ? items.find((d) => d.id === prev.id) || items[0] || null : items[0] || null
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'documents');
      }
    );

    // 3. Sheet audit logs subscription
    const logsQuery = query(collection(db, 'sheet_logs'), where('ownerId', '==', userId));
    const unsubLogs = onSnapshot(
      logsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as SheetUpdateLog[];
        setSheetLogs(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'sheet_logs');
      }
    );

    // 4. Orders subscription
    const ordersQuery = query(collection(db, 'orders'), where('ownerId', '==', userId));
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as OrderRecord[];
        setOrders(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    return () => {
      unsubPortals();
      unsubDocs();
      unsubLogs();
      unsubOrders();
    };
  }, [currentUser]);

  const handleOpenLogUpdate = (docItem: DocSheetItem) => {
    setLogTargetDoc(docItem);
    setIsLogUpdateModalOpen(true);
  };

  // Launch Portal in Full Screen (as requested: "jokhon kono portal click korbo setike full screen a sho koro")
  const handleSelectPortalAndOpen = (portal: PortalLink) => {
    setSelectedPortal(portal);
    setActiveTab('portals');
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center p-4 select-none">
        <img
          src="/logo.svg"
          alt="Logo"
          className="w-14 h-14 object-contain mb-4 animate-pulse"
        />
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Starting Desktop Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-white text-slate-900 font-sans">
      {/* LEFT SIDEBAR NAVIGATION MENU (with menu hide/show toggle) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddPortal={() => {
          if (!currentUser) setIsAuthModalOpen(true);
          else setIsAddPortalModalOpen(true);
        }}
        onOpenAddDoc={() => {
          if (!currentUser) setIsAuthModalOpen(true);
          else setIsAddDocModalOpen(true);
        }}
        onOpenAddOrder={() => {
          if (!currentUser) setIsAuthModalOpen(true);
          else setIsAddOrderModalOpen(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenClearData={() => setIsClearDataModalOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* RIGHT MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50/50 overflow-hidden">
        {/* HEADER (MENU TOGGLE + EXCLUSIVELY PORTALS) */}
        <Header
          portals={portals}
          selectedPortal={selectedPortal}
          onSelectPortal={handleSelectPortalAndOpen}
          onOpenAddPortal={() => {
            if (!currentUser) setIsAuthModalOpen(true);
            else setIsAddPortalModalOpen(true);
          }}
          orders={orders}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!currentUser ? (
            // Clean login gate
            <div className="max-w-md mx-auto my-16 bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-lg shadow-slate-200/40">
              <img
                src="/logo.svg"
                alt="Logo"
                className="w-16 h-16 object-contain mx-auto mb-4 drop-shadow-sm"
              />
              <p className="text-xs text-slate-500 mb-6">
                Sign in to manage seller portals, embedded sheets, and live orders.
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                Sign In / Register
              </button>
            </div>
          ) : (
            <div>
              {activeTab === 'dashboard' && (
                <DashboardView
                  orders={orders}
                  portals={portals}
                  onOpenAddOrder={() => setIsAddOrderModalOpen(true)}
                  onOpenAddPortal={() => setIsAddPortalModalOpen(true)}
                  onSelectPortal={handleSelectPortalAndOpen}
                />
              )}

              {activeTab === 'portals' && (
                <PortalsView
                  portals={portals}
                  selectedPortal={selectedPortal}
                  onSelectPortal={setSelectedPortal}
                  onOpenAddPortal={() => setIsAddPortalModalOpen(true)}
                  onOpenAddOrder={() => setIsAddOrderModalOpen(true)}
                />
              )}

              {activeTab === 'sheets' && (
                <GoogleWorkspaceView
                  documents={documents}
                  selectedDoc={selectedDoc}
                  onSelectDoc={setSelectedDoc}
                  onOpenAddDoc={() => setIsAddDocModalOpen(true)}
                  onOpenLogUpdate={handleOpenLogUpdate}
                />
              )}

              {activeTab === 'logs' && (
                <SheetLogsView
                  logs={sheetLogs}
                  documents={documents}
                  onOpenLogUpdate={handleOpenLogUpdate}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <QuickOrderModal
        isOpen={isAddOrderModalOpen}
        onClose={() => setIsAddOrderModalOpen(false)}
        portals={portals}
      />

      <AddPortalModal
        isOpen={isAddPortalModalOpen}
        onClose={() => setIsAddPortalModalOpen(false)}
      />

      <AddDocModal
        isOpen={isAddDocModalOpen}
        onClose={() => setIsAddDocModalOpen(false)}
      />

      <LogSheetUpdateModal
        isOpen={isLogUpdateModalOpen}
        onClose={() => {
          setIsLogUpdateModalOpen(false);
          setLogTargetDoc(null);
        }}
        document={logTargetDoc}
      />

      <ClearDataModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onDataCleared={() => {
          setSelectedPortal(null);
          setSelectedDoc(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
