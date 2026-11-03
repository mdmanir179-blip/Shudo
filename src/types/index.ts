export type PortalPlatform = 'flipkart' | 'amazon' | 'meesho' | 'swiggy' | 'blinkit' | 'custom';

export interface PortalLink {
  id: string;
  name: string;
  platform: PortalPlatform;
  url: string;
  notes?: string;
  category?: string;
  color?: string;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
  orderCount?: number;
}

export type DocType = 'sheet' | 'doc';

export interface DocSheetItem {
  id: string;
  title: string;
  type: DocType;
  url: string;
  embedUrl: string;
  description?: string;
  ownerId: string;
  lastUpdatedBy?: string;
  lastUpdatedEmail?: string;
  lastUpdatedAt?: string;
  createdAt: string;
}

export interface SheetUpdateLog {
  id: string;
  documentId: string;
  sheetTitle: string;
  userName: string;
  userEmail: string;
  userId: string;
  changeSummary: string;
  actionType: 'data_entry' | 'order_sync' | 'inventory_update' | 'price_change' | 'general_edit';
  affectedRange?: string;
  timestamp: string;
  createdAt: string;
  ownerId: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';

export interface OrderRecord {
  id: string;
  portalName: string;
  portalId?: string;
  orderNumber: string;
  customerName?: string;
  amount: number;
  status: OrderStatus;
  itemsCount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  ownerId: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
