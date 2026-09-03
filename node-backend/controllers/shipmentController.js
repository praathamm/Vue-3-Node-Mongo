const shipmentService = require('../services/shipmentService');
const { sendControllerError } = require('../utils/errors');

async function createShipment(req, res) {
  try {
    return res.status(201).json(await shipmentService.createShipment(req.body, req.user));
  } catch (error) {
    return sendControllerError(res, 'Create shipment error', error, 'Error booking shipment.');
  }
}

async function getSummary(req, res) {
  try {
    return res.json(await shipmentService.getSummary(req.user.userId));
  } catch (error) {
    return sendControllerError(res, 'Shipment summary error', error, 'Error fetching shipment summary.');
  }
}

async function listShipments(req, res) {
  try {
    return res.json(await shipmentService.listShipments(req.user, req.query));
  } catch (error) {
    return sendControllerError(res, 'Get shipments error', error, 'Error fetching shipments.');
  }
}

async function getShipment(req, res) {
  try {
    return res.json(await shipmentService.getShipment(req.params.trackingNumber, req.user));
  } catch (error) {
    return sendControllerError(res, 'Get shipment error', error, 'Error fetching shipment.');
  }
}

async function getPublicTracking(req, res) {
  try {
    return res.json(await shipmentService.getPublicTracking(req.params.trackingNumber));
  } catch (error) {
    return sendControllerError(res, 'Public tracking error', error, 'Error fetching tracking details.');
  }
}

async function saveShipmentChanges(req, res) {
  try {
    return res.json(await shipmentService.saveShipmentChanges(req.params.trackingNumber, req.body, req.user));
  } catch (error) {
    return sendControllerError(res, 'Save shipment changes error', error, 'Error saving shipment changes.');
  }
}

async function updateShipmentStatus(req, res) {
  try {
    return res.json(await shipmentService.updateShipmentStatus(req.params.trackingNumber, req.body, req.user));
  } catch (error) {
    return sendControllerError(res, 'Update shipment status error', error, 'Error updating shipment status.');
  }
}

async function assignShipment(req, res) {
  try {
    return res.json(await shipmentService.assignShipment(req.params.trackingNumber, req.body, req.user));
  } catch (error) {
    return sendControllerError(res, 'Assign shipment error', error, 'Error assigning shipment.');
  }
}

async function sendDeliveryEmail(req, res) {
  try {
    return res.json(await shipmentService.sendDeliveryEmail(req.params.trackingNumber, req.user));
  } catch (error) {
    return sendControllerError(res, 'Send delivery email error', error, 'Error sending delivery email.');
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
