import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { db, handleFirestoreError, OperationType } from './firebase/config';
import { collection, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { PortalLink, DocSheetItem, SheetUpdateLog, OrderRecord } from './types';
import { ActiveTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PortalsView } from './components/PortalsView';
import { GoogleWorkspaceView } from './components/GoogleWorkspaceView';
import { SheetLogsView } from './components/SheetLogsView';
import { QuickOrderModal } from './components/QuickOrderModal';
import { AddPortalModal } from './components/AddPortalModal';
import { AddDocModal } from './components/AddDocModal';
import { LogSheetUpdateModal } from './components/LogSheetUpdateModal';
import { ClearDataModal } from './components/ClearDataModal';

const DEFAULT_PORTALS = [
  {
    name: 'Flipkart',
    platform: 'flipkart',
    url: 'https://seller.flipkart.com',
    category: 'ecommerce',
    color: '#2874F0',
    notes: 'Official Flipkart Seller Hub for orders and dispatches.'
  },
  {
    name: 'Amazon',
    platform: 'amazon',
    url: 'https://sellercentral.amazon.in',
    category: 'ecommerce',
    color: '#FF9900',
    notes: 'Amazon Seller Central dashboard and orders.'
  },
  {
    name: 'Meesho',
    platform: 'meesho',
    url: 'https://supplier.meesho.com',
    category: 'social_commerce',
    color: '#8B1E5D',
    notes: 'Meesho Supplier Panel order processing.'
  },
  {
    name: 'Swiggy',
    platform: 'swiggy',
    url: 'https://partner.swiggy.com',
    category: 'quick_commerce',
    color: '#FC8019',
    notes: 'Swiggy Partner live order management.'
  },
  {
    name: 'Blinkit',
    platform: 'blinkit',
    url: 'https://partner.blinkit.com',
    category: 'quick_commerce',
    color: '#0C831F',
    notes: 'Blinkit Partner quick fulfillment dashboard.'
  }
];

function MainWorkspace() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Direct Firestore synced data (no login barrier)
  const [portals, setPortals] = useState<PortalLink[]>([]);
  const [documents, setDocuments] = useState<DocSheetItem[]>([]);
  const [sheetLogs, setSheetLogs] = useState<SheetUpdateLog[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  // Selection states for runners
  const [selectedPortal, setSelectedPortal] = useState<PortalLink | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocSheetItem | null>(null);

  // Modals
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

  // Direct Firestore live listeners (immediately active on start)
  useEffect(() => {
    // 1. Portals listener & automatic bootstrap if empty
    const unsubPortals = onSnapshot(
      collection(db, 'portals'),
      async (snapshot) => {
        if (snapshot.empty) {
          // Initialize the 5 default portals if none exist
          for (const p of DEFAULT_PORTALS) {
            await addDoc(collection(db, 'portals'), {
              ...p,
              ownerId: 'workspace_user',
              createdAt: new Date().toISOString()
            });
          }
          return;
        }

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

    // 2. Google Docs & Sheets listener
    const unsubDocs = onSnapshot(
      collection(db, 'documents'),
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

    // 3. Sheet audit logs listener
    const unsubLogs = onSnapshot(
      collection(db, 'sheet_logs'),
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

    // 4. Orders listener
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
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
  }, []);

  const handleOpenLogUpdate = (docItem: DocSheetItem) => {
    setLogTargetDoc(docItem);
    setIsLogUpdateModalOpen(true);
  };

  // Launch Portal in Full Screen on click
  const handleSelectPortalAndOpen = (portal: PortalLink) => {
    setSelectedPortal(portal);
    setActiveTab('portals');
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-white text-slate-900 font-sans">
      {/* LEFT SIDEBAR NAVIGATION MENU */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddPortal={() => setIsAddPortalModalOpen(true)}
        onOpenAddDoc={() => setIsAddDocModalOpen(true)}
        onOpenAddOrder={() => setIsAddOrderModalOpen(true)}
        onOpenClearData={() => setIsClearDataModalOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* RIGHT MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50/50 overflow-hidden">
        {/* HEADER (MENU TOGGLE + BREADCRUMB & QUICK ACTIONS) */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={activeTab}
          onOpenAddOrder={() => setIsAddOrderModalOpen(true)}
        />

        {/* MAIN SCROLLABLE CONTENT AREA (Direct Access, No Login Barrier) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
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
        </main>
      </div>

      {/* Modals */}
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
      <MainWorkspace />
    </AuthProvider>
  );
}
