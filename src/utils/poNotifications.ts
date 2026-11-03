import { OrderRecord } from '../types';

export type AlertType =
  | 'shipping_today'
  | 'shipping_overdue'
  | 'shipping_upcoming'
  | 'appointment_today'
  | 'appointment_overdue'
  | 'appointment_upcoming';

export interface DateAlert {
  id: string;
  orderId: string;
  poNumber: string;
  portalName: string;
  destinationHub?: string;
  type: AlertType;
  urgency: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  targetDate: string; // YYYY-MM-DD
  timeSlot?: string;
  currentStatus: string;
}

export function isPOOpen(status: string): boolean {
  return status === 'open' || status === 'pending' || status === 'confirmed';
}

export function isPOInTransit(status: string): boolean {
  return status === 'in_transit' || status === 'dispatched';
}

export function isPODelivered(status: string): boolean {
  return status === 'delivered';
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computePODateAlerts(orders: OrderRecord[]): DateAlert[] {
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();
  const alerts: DateAlert[] = [];

  for (const order of orders) {
    const poNum = order.poNumber || order.orderNumber || 'PO';
    const hub = order.destinationHub ? ` (${order.destinationHub})` : '';

    // Ignore cancelled or returned orders
    if (order.status === 'cancelled' || order.status === 'returned') {
      continue;
    }

    // 1. APPOINTMENT DATE ALERTS (For all non-delivered POs)
    if (order.appointmentDate && !isPODelivered(order.status)) {
      if (order.appointmentDate === today) {
        alerts.push({
          id: `appt_today_${order.id}`,
          orderId: order.id,
          poNumber: poNum,
          portalName: order.portalName,
          destinationHub: order.destinationHub,
          type: 'appointment_today',
          urgency: 'critical',
          title: 'Appointment Slot Today!',
          message: `${order.portalName} consignment ${poNum} appointment slot is TODAY${order.appointmentTime ? ` (${order.appointmentTime})` : ''}${hub}. Ensure delivery unloading.`,
          targetDate: order.appointmentDate,
          timeSlot: order.appointmentTime,
          currentStatus: order.status
        });
      } else if (order.appointmentDate < today) {
        alerts.push({
          id: `appt_overdue_${order.id}`,
          orderId: order.id,
          poNumber: poNum,
          portalName: order.portalName,
          destinationHub: order.destinationHub,
          type: 'appointment_overdue',
          urgency: 'critical',
          title: 'Appointment Overdue - Mark Delivered?',
          message: `Appointment date (${order.appointmentDate}) has passed for ${poNum} (${order.portalName}). If unloaded, mark as Delivered.`,
          targetDate: order.appointmentDate,
          timeSlot: order.appointmentTime,
          currentStatus: order.status
        });
      } else if (order.appointmentDate === tomorrow) {
        alerts.push({
          id: `appt_tomorrow_${order.id}`,
          orderId: order.id,
          poNumber: poNum,
          portalName: order.portalName,
          destinationHub: order.destinationHub,
          type: 'appointment_upcoming',
          urgency: 'warning',
          title: 'Appointment Slot Tomorrow',
          message: `${order.portalName} consignment ${poNum} appointment slot is tomorrow${order.appointmentTime ? ` at ${order.appointmentTime}` : ''}${hub}.`,
          targetDate: order.appointmentDate,
          timeSlot: order.appointmentTime,
          currentStatus: order.status
        });
      }
    }

    // 2. SHIPPING DATE ALERTS (Only if PO is still Open and not yet In Transit or Delivered)
    if (order.shippingDate && isPOOpen(order.status)) {
      if (order.shippingDate === today) {
        alerts.push({
          id: `ship_today_${order.id}`,
          orderId: order.id,
          poNumber: poNum,
          portalName: order.portalName,
          destinationHub: order.destinationHub,
          type: 'shipping_today',
          urgency: 'warning',
          title: 'Shipping Date is Today',
          message: `PO ${poNum} (${order.portalName}) shipping / dispatch is scheduled for TODAY. Dispatch and mark In Transit.`,
          targetDate: order.shippingDate,
          currentStatus: order.status
        });
      } else if (order.shippingDate < today) {
        alerts.push({
          id: `ship_overdue_${order.id}`,
          orderId: order.id,
          poNumber: poNum,
          portalName: order.portalName,
          destinationHub: order.destinationHub,
          type: 'shipping_overdue',
          urgency: 'critical',
          title: 'Shipping Date Overdue!',
          message: `Shipping date (${order.shippingDate}) was missed for ${poNum} (${order.portalName}). Please dispatch or update schedule.`,
          targetDate: order.shippingDate,
          currentStatus: order.status
        });
      } else if (order.shippingDate === tomorrow) {
        alerts.push({
          id: `ship_tomorrow_${order.id}`,
          orderId: order.id,
          poNumber: poNum,
          portalName: order.portalName,
          destinationHub: order.destinationHub,
          type: 'shipping_upcoming',
          urgency: 'info',
          title: 'Shipping Due Tomorrow',
          message: `PO ${poNum} (${order.portalName}) is scheduled for dispatch tomorrow. Keep cartons ready.`,
          targetDate: order.shippingDate,
          currentStatus: order.status
        });
      }
    }
  }

  // Sort by urgency: critical first, then warning, then info
  const priorityMap: Record<string, number> = { critical: 1, warning: 2, info: 3 };
  return alerts.sort((a, b) => priorityMap[a.urgency] - priorityMap[b.urgency]);
}
