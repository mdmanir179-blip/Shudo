export type PortalPlatform = 'flipkart' | 'amazon' | 'meesho' | 'swiggy' | 'blinkit' | 'custom';

export interface PortalLink {
  id: string;
  name: string;
  platform: PortalPlatform;
  url: string;
  notes?: string;
  category?: string;
  color?: string;
  logoUrl?: string;
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

export type OrderStatus =
  | 'open'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'pending'
  | 'confirmed'
  | 'dispatched'
  | 'returned';

export interface OrderRecord {
  id: string;
  portalName: string;
  portalId?: string;
  orderNumber: string; // Also acts as PO Number
  poNumber?: string;
  destinationHub?: string; // FC / Warehouse Hub (e.g., Swiggy Instamart Whitefield FC)
  customerName?: string;
  amount: number;
  boxesCount?: number; // Total Cartons / Boxes
  itemsCount: number; // Total units
  status: OrderStatus;
  date: string; // PO date (YYYY-MM-DD)
  shippingDate?: string; // Shipping / Dispatch date (YYYY-MM-DD)
  appointmentDate?: string; // Delivery slot / Appointment date (YYYY-MM-DD)
  appointmentTime?: string; // Time slot (e.g., "10:00 AM - 01:00 PM")
  carrier?: string; // Transporter / Courier name
  vehicleNumber?: string;
  trackingNumber?: string;
  deliveredAt?: string;
  notes?: string;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
