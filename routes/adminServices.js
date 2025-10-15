const express = require('express');
const router = express.Router();
const adminServiceController = require('../controllers/adminServiceController');

// Get next available service ID
router.get('/next-id', adminServiceController.getNextServiceId);

// Get all services
router.get('/', adminServiceController.getAllServices);

// Get single service
router.get('/:id', adminServiceController.getServiceById);

// Create new service
router.post('/', adminServiceController.createService);

// Update service
router.put('/:id', adminServiceController.updateService);

// Delete service
router.delete('/:id', adminServiceController.deleteService);

module.exports = router;
