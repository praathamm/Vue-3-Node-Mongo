const express = require('express');
const controller = require('../controllers/shipmentController');

const router = express.Router();

router.get('/track/:trackingNumber', controller.getPublicTracking);

module.exports = router;
