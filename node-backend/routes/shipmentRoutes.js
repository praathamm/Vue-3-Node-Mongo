const express = require('express');
const controller = require('../controllers/shipmentController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.post('/shipments', authenticateToken, authorizeRole(['customer']), controller.createShipment);
router.get('/shipments/summary', authenticateToken, authorizeRole(['courier_staff']), controller.getSummary);
router.get('/shipments', authenticateToken, controller.listShipments);
router.get('/shipments/:trackingNumber', authenticateToken, controller.getShipment);
router.patch('/shipments/:trackingNumber', authenticateToken, authorizeRole(['courier_staff']), controller.saveShipmentChanges);
router.patch('/shipments/:trackingNumber/status', authenticateToken, authorizeRole(['courier_staff']), controller.updateShipmentStatus);
router.patch('/shipments/:trackingNumber/assign', authenticateToken, authorizeRole(['courier_staff']), controller.assignShipment);
router.post('/shipments/:trackingNumber/delivery-email', authenticateToken, authorizeRole(['courier_staff']), controller.sendDeliveryEmail);

module.exports = router;
