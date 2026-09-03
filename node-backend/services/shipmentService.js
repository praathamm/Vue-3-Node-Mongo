const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/database');
const { normalizeRole } = require('../utils/auth');
const {
  normalizeShipmentType,
  normalizeShipmentStatus,
  generateTrackingNumber,
  addDays,
  createTrackingEvent,
  formatShipment,
  buildShipmentFilter,
} = require('../utils/shipment');
const { httpError } = require('../utils/errors');
const { sendDeliveryConfirmationEmail } = require('../otpService');

async function findDeliveryAgent(agentIdOrEmail) {
  if (!agentIdOrEmail) return null;
  const { accounts } = getCollections();
  const byId = ObjectId.isValid(agentIdOrEmail)
    ? await accounts.findOne({ _id: new ObjectId(agentIdOrEmail) })
    : null;
  return byId || accounts.findOne({ email: String(agentIdOrEmail).toLowerCase() });
}

async function loadShipmentWithTracking(trackingNumber) {
  const { shipments, shipmentTracking } = getCollections();
  const shipment = await shipments.findOne({ trackingNumber });
  if (!shipment) return null;

  const events = await shipmentTracking.find({ trackingNumber }).sort({ createdAt: 1 }).toArray();
  return formatShipment(shipment, events);
}

async function createShipment(data, user) {
  const {
    senderName, senderAddress, recipientName, recipientAddress,
    senderContactNumber, recipientContactNumber, packageWeight,
    packageDescription, deliveryType,
  } = data;

  if (!senderName || !senderAddress || !recipientName || !recipientAddress || !senderContactNumber ||
      !recipientContactNumber || !packageWeight || !deliveryType) {
    throw httpError(400, 'All mandatory shipment fields are required.');
  }

  const validContactNumber = /^\d{10}$/;
  if (!validContactNumber.test(String(senderContactNumber).trim()) ||
      !validContactNumber.test(String(recipientContactNumber).trim())) {
    throw httpError(400, 'Sender and recipient contact numbers must contain exactly 10 digits.');
  }

  const { shipments, shipmentTracking } = getCollections();
  const now = new Date();
  const normalizedDeliveryType = normalizeShipmentType(deliveryType);
  const shipment = {
    trackingNumber: generateTrackingNumber(),
    senderName: senderName.trim(),
    senderAddress: senderAddress.trim(),
    recipientName: recipientName.trim(),
    recipientAddress: recipientAddress.trim(),
    senderContactNumber: String(senderContactNumber).trim(),
    recipientContactNumber: String(recipientContactNumber).trim(),
    packageWeight: String(packageWeight).trim(),
    packageDescription: packageDescription ? String(packageDescription).trim() : '',
    deliveryType: normalizedDeliveryType,
    status: 'Pending',
    lastUpdatedLocation: senderAddress.trim(),
    expectedDeliveryDate: addDays(now, normalizedDeliveryType === 'Express' ? 2 : 5),
    deliveryAgent: null,
    createdBy: user.userId,
    createdByName: user.name,
    createdByRole: normalizeRole(user.role),
    createdAt: now,
    updatedAt: now,
  };

  const result = await shipments.insertOne(shipment);
  await shipmentTracking.insertOne(createTrackingEvent({
    shipmentId: result.insertedId,
    trackingNumber: shipment.trackingNumber,
    status: 'Booked',
    location: shipment.senderAddress,
    updatedBy: user.name,
    updatedByRole: normalizeRole(user.role),
  }));

  return {
    message: 'Shipment booked successfully.',
    shipment: { shipmentId: result.insertedId.toString(), trackingNumber: shipment.trackingNumber },
  };
}

async function getSummary() {
  const { shipments } = getCollections();
  return {
    summary: {
      totalShipmentsProcessed: await shipments.countDocuments({}),
      deliveredShipments: await shipments.countDocuments({ status: 'Delivered' }),
      pendingShipments: await shipments.countDocuments({ status: { $ne: 'Delivered' } }),
    },
  };
}

async function listShipments(user, query) {
  const { shipments, shipmentTracking } = getCollections();
  const filter = buildShipmentFilter(query);
  const role = normalizeRole(user.role);

  if (role === 'customer') filter.createdBy = user.userId;
  const records = await shipments.find(filter).sort({ createdAt: -1 }).toArray();
  const trackingNumbers = records.map((shipment) => shipment.trackingNumber);
  const events = await shipmentTracking.find({ trackingNumber: { $in: trackingNumbers } }).sort({ createdAt: 1 }).toArray();
  const eventMap = events.reduce((map, event) => {
    if (!map.has(event.trackingNumber)) map.set(event.trackingNumber, []);
    map.get(event.trackingNumber).push(event);
    return map;
  }, new Map());

  return { shipments: records.map((shipment) => formatShipment(shipment, eventMap.get(shipment.trackingNumber) || [])) };
}

async function getShipment(trackingNumber, user) {
  const shipment = await loadShipmentWithTracking(trackingNumber);
  if (!shipment) throw httpError(404, 'Shipment not found.');

  const role = normalizeRole(user.role);
  if (role === 'customer' && shipment.createdBy !== user.userId) {
    throw httpError(403, 'You can only view your own shipments.');
  }
  return { shipment };
}

async function getPublicTracking(trackingNumber) {
  const { shipments, shipmentTracking, accounts } = getCollections();
  const shipmentRecord = await shipments.findOne({ trackingNumber });
  if (!shipmentRecord) throw httpError(404, 'Shipment not found.');

  const trackingEvents = await shipmentTracking
    .find({ trackingNumber })
    .sort({ createdAt: 1 })
    .toArray();
  const shipment = formatShipment(shipmentRecord, trackingEvents);
  const customerId = ObjectId.isValid(shipment.createdBy)
    ? new ObjectId(shipment.createdBy)
    : shipment.createdBy;
  const customer = await accounts.findOne(
    { _id: customerId },
    { projection: { name: 1, email: 1, phoneNumber: 1 } }
  );
  let deliveryAgent = shipment.deliveryAgent;
  if (deliveryAgent?.userId && !deliveryAgent.phoneNumber) {
    const agentId = ObjectId.isValid(deliveryAgent.userId)
      ? new ObjectId(deliveryAgent.userId)
      : deliveryAgent.userId;
    const agent = await accounts.findOne(
      { _id: agentId },
      { projection: { phoneNumber: 1 } }
    );
    if (agent?.phoneNumber) deliveryAgent = { ...deliveryAgent, phoneNumber: agent.phoneNumber };
  }

  return { shipment: {
    trackingNumber: shipment.trackingNumber,
    senderName: shipment.senderName,
    senderAddress: shipment.senderAddress,
    senderEmail: customer?.email || '',
    senderContactNumber: shipment.senderContactNumber || customer?.phoneNumber || '',
    recipientName: shipment.recipientName,
    recipientAddress: shipment.recipientAddress,
    recipientContactNumber: shipment.recipientContactNumber,
    packageWeight: shipment.packageWeight,
    packageDescription: shipment.packageDescription,
    deliveryType: shipment.deliveryType,
    status: shipment.status,
    lastUpdatedLocation: shipment.lastUpdatedLocation,
    expectedDeliveryDate: shipment.expectedDeliveryDate,
    deliveryAgent,
    deliveryEmailStatus: shipment.deliveryEmailStatus || 'not_sent',
    deliveryEmailSentAt: shipment.deliveryEmailSentAt || null,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    deliveredAt: shipment.deliveredAt || null,
    trackingHistory: shipment.trackingHistory,
  } };
}

async function saveShipmentChanges(trackingNumber, data, user) {
  const { shipments, shipmentTracking } = getCollections();
  const shipment = await shipments.findOne({ trackingNumber });
  if (!shipment) throw httpError(404, 'Shipment not found.');
  let nextAgent = shipment.deliveryAgent || null;
  if (data.deliveryAgentEmail !== undefined) {
    if (!data.deliveryAgentEmail) {
      nextAgent = null;
    } else {
      const agent = await findDeliveryAgent(data.deliveryAgentEmail);
      if (!agent) throw httpError(404, 'Delivery agent not found.');
      if (normalizeRole(agent.role) !== 'courier_staff') throw httpError(400, 'Selected user is not a courier staff member.');
      nextAgent = {
        userId: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        phoneNumber: agent.phoneNumber || '',
        role: normalizeRole(agent.role),
      };
    }
  }

  const normalizedStatus = normalizeShipmentStatus(data.status || shipment.status);
  if (!nextAgent) throw httpError(400, 'Select a courier staff member before saving changes.');
  const nextLocation = data.location ? String(data.location).trim() : shipment.lastUpdatedLocation || shipment.senderAddress;
  const now = new Date();
  const updatedShipment = { status: normalizedStatus, lastUpdatedLocation: nextLocation, deliveryAgent: nextAgent, updatedAt: now };
  if (normalizedStatus === 'Delivered') updatedShipment.deliveredAt = now;

  await shipments.updateOne({ trackingNumber }, { $set: updatedShipment });

  if (shipment.deliveryAgent?.userId !== nextAgent.userId || normalizedStatus !== shipment.status || nextLocation !== shipment.lastUpdatedLocation) {
    await shipmentTracking.insertOne(createTrackingEvent({
      shipmentId: shipment._id,
      trackingNumber,
      status: normalizedStatus,
      location: nextLocation,
      reason: shipment.deliveryAgent?.userId !== nextAgent.userId
        ? `Assigned to ${nextAgent.name}`
        : normalizedStatus === 'Delayed' ? String(data.reason || '').trim() : '',
      updatedBy: user.name,
      updatedByRole: normalizeRole(user.role),
    }));
  }

  return { message: 'Shipment changes saved successfully.' };
}

async function updateShipmentStatus(trackingNumber, data, user) {
  return saveShipmentChanges(trackingNumber, { ...data }, user);
}

async function assignShipment(trackingNumber, data, user) {
  const { shipments, shipmentTracking } = getCollections();
  const shipment = await shipments.findOne({ trackingNumber });
  if (!shipment) throw httpError(404, 'Shipment not found.');

  const agent = await findDeliveryAgent(data.deliveryAgentId || data.deliveryAgentEmail);
  if (!agent) throw httpError(404, 'Delivery agent not found.');
  if (normalizeRole(agent.role) !== 'courier_staff') {
    throw httpError(400, 'Selected user is not a courier staff member.');
  }

  const nextAgent = {
    userId: agent._id.toString(),
    name: agent.name,
    email: agent.email,
    phoneNumber: agent.phoneNumber || '',
    role: normalizeRole(agent.role),
  };
  const nextLocation = data.location ? String(data.location).trim() : shipment.lastUpdatedLocation || shipment.senderAddress;

  await shipments.updateOne(
    { trackingNumber },
    { $set: { deliveryAgent: nextAgent, lastUpdatedLocation: nextLocation, updatedAt: new Date() } }
  );
  await shipmentTracking.insertOne(createTrackingEvent({
    shipmentId: shipment._id,
    trackingNumber,
    status: shipment.status,
    location: nextLocation,
    reason: `Assigned to ${nextAgent.name}`,
    updatedBy: user.name,
    updatedByRole: normalizeRole(user.role),
  }));

  return { message: 'Shipment assigned successfully.', shipment: { trackingNumber, deliveryAgent: nextAgent } };
}

async function sendDeliveryEmail(trackingNumber, user) {
  const { shipments, accounts } = getCollections();
  const shipment = await shipments.findOne({ trackingNumber });
  if (!shipment) throw httpError(404, 'Shipment not found.');
  if (shipment.status !== 'Delivered') throw httpError(400, 'Only delivered shipments can receive a delivery email.');
  if (shipment.deliveryAgent?.userId !== user.userId) {
    throw httpError(403, 'You can only send emails for shipments assigned to you.');
  }

  if (shipment.deliveryEmailSentAt) {
    return { message: 'Delivery email has already been sent.', alreadySent: true };
  }

  const customerId = ObjectId.isValid(shipment.createdBy) ? new ObjectId(shipment.createdBy) : shipment.createdBy;
  const customer = await accounts.findOne({ _id: customerId }, { projection: { name: 1, email: 1 } });
  if (!customer?.email) throw httpError(400, 'The customer does not have an email address.');

  const now = new Date();
  const claim = await shipments.updateOne(
    {
      trackingNumber,
      status: 'Delivered',
      'deliveryAgent.userId': user.userId,
      deliveryEmailSentAt: { $exists: false },
      deliveryEmailStatus: { $ne: 'sending' },
    },
    { $set: { deliveryEmailStatus: 'sending', deliveryEmailSendingAt: now } }
  );

  if (claim.modifiedCount !== 1) {
    const current = await shipments.findOne({ trackingNumber });
    if (current?.deliveryEmailSentAt) return { message: 'Delivery email has already been sent.', alreadySent: true };
    throw httpError(409, 'A delivery email is already being sent for this shipment.');
  }

  try {
    await sendDeliveryConfirmationEmail(customer.email, shipment, customer.name);
    await shipments.updateOne(
      { trackingNumber },
      {
        $set: {
          deliveryEmailStatus: 'sent',
          deliveryEmailSentAt: new Date(),
          deliveryEmailSentBy: user.userId,
          deliveryEmailSentTo: customer.email,
        },
        $unset: { deliveryEmailSendingAt: '' },
      }
    );
    return { message: 'Delivery email sent successfully.', email: customer.email };
  } catch (error) {
    await shipments.updateOne(
      { trackingNumber },
      { $set: { deliveryEmailStatus: 'failed' }, $unset: { deliveryEmailSendingAt: '' } }
    );
    throw error;
  }
}

module.exports = {
  createShipment,
  getSummary,
  listShipments,
  getShipment,
  getPublicTracking,
  saveShipmentChanges,
  updateShipmentStatus,
  assignShipment,
  sendDeliveryEmail,
};
