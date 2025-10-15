const Service = require('../models/Service');

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ serviceId: 1 });
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
};

// Get single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.id });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service'
    });
  }
};

// Create new service
exports.createService = async (req, res) => {
  try {
    const {
      serviceId,
      title,
      category,
      description,
      aboutService,
      price,
      duration,
      rating,
      reviews,
      consultant,
      consultantTitle,
      features,
      icon
    } = req.body;

    // Validate required fields
    if (!serviceId || !title || !category || !description || !aboutService || !price || !duration || !consultant || !consultantTitle) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Check if service with this ID already exists
    const existingService = await Service.findOne({ serviceId });
    if (existingService) {
      return res.status(400).json({
        success: false,
        error: 'Service with this ID already exists'
      });
    }

    const service = await Service.create({
      serviceId,
      title,
      category,
      description,
      aboutService,
      price,
      duration,
      rating: rating || 0,
      reviews: reviews || 0,
      consultant,
      consultantTitle,
      features: features || [],
      icon: icon || ''
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create service'
    });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const updateData = req.body;

    // Don't allow changing the serviceId
    delete updateData.serviceId;

    const service = await Service.findOneAndUpdate(
      { serviceId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update service'
    });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;

    const service = await Service.findOneAndDelete({ serviceId });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully',
      data: service
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete service'
    });
  }
};

// Get next available service ID
exports.getNextServiceId = async (req, res) => {
  try {
    const lastService = await Service.findOne().sort({ serviceId: -1 });
    const nextId = lastService ? lastService.serviceId + 1 : 1;
    
    res.json({
      success: true,
      nextServiceId: nextId
    });
  } catch (error) {
    console.error('Error getting next service ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next service ID'
    });
  }
};
