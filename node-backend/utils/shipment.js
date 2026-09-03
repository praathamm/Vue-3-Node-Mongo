function normalizeShipmentType(deliveryType) {
  const value = String(deliveryType || '').trim().toLowerCase();
  return value === 'express' ? 'Express' : 'Standard';
}

function normalizeShipmentStatus(status) {
  const value = String(status || '').trim().toLowerCase();

  if (value === 'arrived at hub') return 'Arrived at Hub';
  if (value === 'out for delivery') return 'Out for Delivery';
  if (value === 'delivered') return 'Delivered';
  if (value === 'delayed') return 'Delayed';
  if (value === 'in transit') return 'In Transit';
  if (value === 'pending') return 'Pending';

  return 'Pending';
}

function generateTrackingNumber() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TRK-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function createTrackingEvent({ shipmentId, trackingNumber, status, location, reason, updatedBy, updatedByRole }) {
  return {
    shipmentId,
    trackingNumber,
    status,
    location: location || '',
    reason: reason || '',
    updatedBy,
    updatedByRole,
    createdAt: new Date(),
  };
}

function formatShipment(shipment, trackingEvents = []) {
  return {
    shipmentId: shipment._id,
    trackingNumber: shipment.trackingNumber,
    senderName: shipment.senderName,
    senderAddress: shipment.senderAddress,
    recipientName: shipment.recipientName,
    recipientAddress: shipment.recipientAddress,
    senderContactNumber: shipment.senderContactNumber,
    recipientContactNumber: shipment.recipientContactNumber,
    packageWeight: shipment.packageWeight,
    packageDescription: shipment.packageDescription || '',
    deliveryType: shipment.deliveryType,
    status: shipment.status,
    lastUpdatedLocation: shipment.lastUpdatedLocation || '',
    expectedDeliveryDate: shipment.expectedDeliveryDate,
    deliveryAgent: shipment.deliveryAgent || null,
    createdBy: shipment.createdBy,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    deliveredAt: shipment.deliveredAt || null,
    deliveryEmailSentAt: shipment.deliveryEmailSentAt || null,
    trackingHistory: trackingEvents.map((event) => ({
      dateTime: event.createdAt,
      status: event.status,
      location: event.location,
      reason: event.reason,
      updatedBy: event.updatedBy,
      updatedByRole: event.updatedByRole,
    })),
  };
}

function parseDateRange(value) {
  const parsed = new Date(`${value}T00:00:00.000+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildShipmentFilter(query) {
  const filter = {};
  const { status, from, to } = query;

  if (status) filter.status = normalizeShipmentStatus(status);

  if (from || to) {
    filter.createdAt = {};

    if (from) {
      const fromDate = parseDateRange(from);
      if (fromDate) filter.createdAt.$gte = fromDate;
    }

    if (to) {
      const toDate = parseDateRange(to);
      if (toDate) {
        toDate.setTime(toDate.getTime() + (24 * 60 * 60 * 1000) - 1);
        filter.createdAt.$lte = toDate;
      }
    }

    if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
  }

  return filter;
}

module.exports = {
  normalizeShipmentType,
  normalizeShipmentStatus,
  generateTrackingNumber,
  addDays,
  createTrackingEvent,
  formatShipment,
  buildShipmentFilter,
};
