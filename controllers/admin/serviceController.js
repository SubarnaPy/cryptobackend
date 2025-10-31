const Service = require('../../models/Service');

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
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
    const service = await Service.findById(req.params.id);
    
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
    if (!title || !category || !description || !aboutService || !price || !duration || !consultant || !consultantTitle) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    const service = await Service.create({
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
    const updateData = req.body;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
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
    const service = await Service.findByIdAndDelete(req.params.id);

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

// Get next available service ID (no longer needed with MongoDB _id)
exports.getNextServiceId = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'MongoDB auto-generates IDs'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get next service ID'
    });
  }
};
