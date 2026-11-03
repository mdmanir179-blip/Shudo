import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { db, handleFirestoreError, OperationType } from './firebase/config';
import { collection, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { PortalLink, DocSheetItem, SheetUpdateLog, OrderRecord } from './types';
import { ActiveTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { AnalyticsView } from './components/AnalyticsView';
import { PortalsView } from './components/PortalsView';
import { GoogleWorkspaceView } from './components/GoogleWorkspaceView';
import { SheetLogsView } from './components/SheetLogsView';
import { QuickOrderModal } from './components/QuickOrderModal';
import { AddPortalModal } from './components/AddPortalModal';
import { AddDocModal } from './components/AddDocModal';
import { LogSheetUpdateModal } from './components/LogSheetUpdateModal';

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
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [selectedOrderIdForView, setSelectedOrderIdForView] = useState<string | null>(null);

  // Modals
  const [isAddPortalModalOpen, setIsAddPortalModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isLogUpdateModalOpen, setIsLogUpdateModalOpen] = useState(false);
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

    // 4. Consignment POs & Orders listener
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      async (snapshot) => {
        if (snapshot.empty) {
          const now = Date.now();
          const today = new Date(now);
          const todayStr = today.toISOString().split('T')[0];

          const yesterday = new Date(now - 86400000);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          const twoDaysAgo = new Date(now - 2 * 86400000);
          const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

          const threeDaysAgo = new Date(now - 3 * 86400000);
          const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

          const fourDaysAgo = new Date(now - 4 * 86400000);
          const fourDaysAgoStr = fourDaysAgo.toISOString().split('T')[0];

          const fiveDaysAgo = new Date(now - 5 * 86400000);
          const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];

          const tomorrow = new Date(now + 86400000);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];

          const dayAfter = new Date(now + 2 * 86400000);
          const dayAfterStr = dayAfter.toISOString().split('T')[0];

          const sampleConsignments = [
            {
              portalName: 'Swiggy',
              orderNumber: 'PO-SWG-9021',
              poNumber: 'PO-SWG-9021',
              destinationHub: 'Swiggy Instamart FC - Whitefield, Bangalore',
              amount: 48500,
              boxesCount: 14,
              itemsCount: 420,
              status: 'open',
              date: todayStr,
              shippingDate: todayStr,
              appointmentDate: tomorrowStr,
              appointmentTime: '10:00 AM - 01:00 PM',
              carrier: 'Delhivery Surface Logistics',
              notes: 'FMCG & Groceries Assortment. Packaging verified.',
              ownerId: 'workspace_user',
              createdAt: new Date().toISOString()
            },
            {
              portalName: 'Swiggy',
              orderNumber: 'PO-SWG-8874',
              poNumber: 'PO-SWG-8874',
              destinationHub: 'Swiggy Instamart FC - Electronic City',
              amount: 62000,
              boxesCount: 18,
              itemsCount: 560,
              status: 'in_transit',
              date: todayStr,
              shippingDate: todayStr,
              appointmentDate: todayStr,
              appointmentTime: '02:30 PM - 04:30 PM',
              carrier: 'BlueDart Express (KA01-MJ-8812)',
              notes: 'Truck on route to FC gate. Delivery slot booked.',
              ownerId: 'workspace_user',
              createdAt: new Date().toISOString()
            },
            {
              portalName: 'Blinkit',
              orderNumber: 'PO-BLNK-4412',
              poNumber: 'PO-BLNK-4412',
              destinationHub: 'Blinkit Mother Hub - Sector 62, Gurgaon',
              amount: 37500,
              boxesCount: 9,
              itemsCount: 310,
              status: 'in_transit',
              date: yesterdayStr,
              shippingDate: yesterdayStr,
              appointmentDate: todayStr,
              appointmentTime: '09:30 AM - 11:30 AM',
              carrier: 'Shadowfax Quick Delivery',
              notes: 'Packaged in standardized quick-commerce cartons.',
              ownerId: 'workspace_user',
              createdAt: new Date(now - 86400000).toISOString()
            },
            {
              portalName: 'Flipkart',
              orderNumber: 'PO-FLIP-1029',
              poNumber: 'PO-FLIP-1029',
              destinationHub: 'Flipkart Bilaspur Fulfillment Center',
              amount: 84000,
              boxesCount: 24,
              itemsCount: 780,
              status: 'open',
              date: twoDaysAgoStr,
              shippingDate: todayStr,
              appointmentDate: dayAfterStr,
              appointmentTime: '11:00 AM - 02:00 PM',
              carrier: 'Ekart Logistics',
              notes: 'B2B Consignment Invoice & E-Way Bill Attached.',
              ownerId: 'workspace_user',
              createdAt: new Date(now - 2 * 86400000).toISOString()
            },
            {
              portalName: 'Amazon',
              orderNumber: 'PO-AMZ-7719',
              poNumber: 'PO-AMZ-7719',
              destinationHub: 'Amazon FC BLR8 - Devanahalli',
              amount: 96000,
              boxesCount: 32,
              itemsCount: 1100,
              status: 'delivered',
              date: threeDaysAgoStr,
              shippingDate: threeDaysAgoStr,
              appointmentDate: threeDaysAgoStr,
              appointmentTime: '10:00 AM',
              carrier: 'ATS Logistics',
              notes: 'Gate-in complete, GRN verified and accepted.',
              deliveredAt: new Date(now - 3 * 86400000).toISOString(),
              ownerId: 'workspace_user',
              createdAt: new Date(now - 3 * 86400000).toISOString()
            },
            {
              portalName: 'Meesho',
              orderNumber: 'PO-MSH-3390',
              poNumber: 'PO-MSH-3390',
              destinationHub: 'Meesho Surat Logistics Hub',
              amount: 34000,
              boxesCount: 11,
              itemsCount: 290,
              status: 'delivered',
              date: fourDaysAgoStr,
              shippingDate: fourDaysAgoStr,
              appointmentDate: fourDaysAgoStr,
              carrier: 'Delhivery Surface',
              notes: 'Ethnic apparel and fashion assortment delivered.',
              deliveredAt: new Date(now - 4 * 86400000).toISOString(),
              ownerId: 'workspace_user',
              createdAt: new Date(now - 4 * 86400000).toISOString()
            },
            {
              portalName: 'Swiggy',
              orderNumber: 'PO-SWG-7612',
              poNumber: 'PO-SWG-7612',
              destinationHub: 'Swiggy Instamart Hub - Bellandur',
              amount: 51200,
              boxesCount: 16,
              itemsCount: 480,
              status: 'delivered',
              date: fiveDaysAgoStr,
              shippingDate: fiveDaysAgoStr,
              appointmentDate: fiveDaysAgoStr,
              carrier: 'BlueDart Surface Express',
              notes: 'Snacks & beverages inventory batch received.',
              deliveredAt: new Date(now - 5 * 86400000).toISOString(),
              ownerId: 'workspace_user',
              createdAt: new Date(now - 5 * 86400000).toISOString()
            }
          ];

          // Set state immediately so user sees live data instantly
          setOrders(
            sampleConsignments.map((c, idx) => ({
              id: `seed-po-${idx}`,
              ...c
            })) as OrderRecord[]
          );

          // Asynchronously persist to Firestore
          for (const c of sampleConsignments) {
            try {
              await addDoc(collection(db, 'orders'), c);
            } catch (err) {
              console.warn('Notice: Firestore seeding PO write:', err);
            }
          }
          return;
        }

        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as OrderRecord[];
        setOrders(items);
      },
      (error) => {
        console.warn('Orders snapshot notice:', error);
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

  // Header Search Callbacks
  const handleSelectOrderFromHeader = (order: OrderRecord) => {
    setActiveTab('orders');
    setSelectedOrderIdForView(order.id);
    setOrdersSearchQuery(order.poNumber || order.orderNumber || '');
  };

  const handleSelectPortalFromHeader = (portal: PortalLink) => {
    handleSelectPortalAndOpen(portal);
  };

  const handleSelectDocFromHeader = (doc: DocSheetItem) => {
    setActiveTab('sheets');
    setSelectedDoc(doc);
  };

  const handleViewAllOrdersFromHeader = (query: string) => {
    setActiveTab('orders');
    setOrdersSearchQuery(query);
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
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        openOrdersCount={orders.filter((o) => o.status === 'open' || o.status === 'pending').length}
      />

      {/* RIGHT MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50/50 overflow-hidden">
        {/* HEADER (MENU TOGGLE + BREADCRUMB, SEARCH & QUICK ACTIONS) */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={activeTab}
          orders={orders}
          portals={portals}
          documents={documents}
          onOpenAddOrder={() => setIsAddOrderModalOpen(true)}
          onSelectOrder={handleSelectOrderFromHeader}
          onSelectPortal={handleSelectPortalFromHeader}
          onSelectDoc={handleSelectDocFromHeader}
          onViewAllOrders={handleViewAllOrdersFromHeader}
        />

        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              portals={portals}
              onOpenAddOrder={() => setIsAddOrderModalOpen(true)}
              onOpenAddPortal={() => setIsAddPortalModalOpen(true)}
              onSelectPortal={handleSelectPortalAndOpen}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              portals={portals}
              onOpenAddOrder={() => setIsAddOrderModalOpen(true)}
              onSelectPortal={handleSelectPortalAndOpen}
              initialSearchQuery={ordersSearchQuery}
              selectedOrderId={selectedOrderIdForView}
              onClearSelectedOrderId={() => setSelectedOrderIdForView(null)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              orders={orders}
              portals={portals}
              onOpenAddOrder={() => setIsAddOrderModalOpen(true)}
              onNavigateToOrders={() => setActiveTab('orders')}
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
