const Purchase = require('../models/Purchase');
const Service = require('../models/Service');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new purchase
const createPurchase = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            serviceId,
            customerName,
            customerEmail,
            customerPhone,
            appointmentDate,
            appointmentTime,
            notes,
            paymentMethod = 'pending'
        } = req.body;

        // Verify service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        // Create purchase
        const purchase = new Purchase({
            serviceId,
            serviceName: service.title,
            serviceCategory: service.category,
            amount: parseFloat(service.price.replace(/[^0-9.-]+/g, '')), // Extract numeric value
            customerName,
            customerEmail,
            customerPhone,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            notes,
            paymentMethod,
            status: 'pending',
            createdAt: new Date()
        });

        await purchase.save();

        res.status(201).json({
            success: true,
            message: 'Purchase created successfully',
            data: purchase
        });

    } catch (error) {
        console.error('Error creating purchase:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create purchase',
            details: error.message
        });
    }
};

// Get all purchases with filtering and pagination
const getPurchases = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            serviceCategory,
            customerEmail,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};

        if (status) filter.status = status;
        if (serviceCategory) filter.serviceCategory = serviceCategory;
        if (customerEmail) filter.customerEmail = { $regex: customerEmail, $options: 'i' };

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const [purchases, totalCount] = await Promise.all([
            Purchase.find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Purchase.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                purchases,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / parseInt(limit)),
                    totalCount,
                    hasNext: skip + purchases.length < totalCount,
                    hasPrev: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch purchases',
            details: error.message
        });
    }
};

// Get purchase by ID
const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;

        const purchase = await Purchase.findById(id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                error: 'Purchase not found'
            });
        }

        res.json({
            success: true,
            data: purchase
        });

    } catch (error) {
        console.error('Error fetching purchase:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch purchase',
            details: error.message
        });
    }
};

// Update purchase
const updatePurchase = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { id } = req.params;
        const updateData = { ...req.body };

        // Add updatedAt timestamp
        updateData.updatedAt = new Date();

        const purchase = await Purchase.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!purchase) {
            return res.status(404).json({
                success: false,
                error: 'Purchase not found'
            });
        }

        res.json({
            success: true,
            message: 'Purchase updated successfully',
            data: purchase
        });

    } catch (error) {
        console.error('Error updating purchase:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update purchase',
            details: error.message
        });
    }
};

// Delete purchase
const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;

        const purchase = await Purchase.findByIdAndDelete(id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                error: 'Purchase not found'
            });
        }

        res.json({
            success: true,
            message: 'Purchase deleted successfully',
            data: purchase
        });

    } catch (error) {
        console.error('Error deleting purchase:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete purchase',
            details: error.message
        });
    }
};

// Update purchase status
const updatePurchaseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                validStatuses
            });
        }

        const purchase = await Purchase.findByIdAndUpdate(
            id,
            {
                status,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!purchase) {
            return res.status(404).json({
                success: false,
                error: 'Purchase not found'
            });
        }

        res.json({
            success: true,
            message: `Purchase status updated to ${status}`,
            data: purchase
        });

    } catch (error) {
        console.error('Error updating purchase status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update purchase status',
            details: error.message
        });
    }
};

// Get purchase statistics
const getPurchaseStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const [
            totalPurchases,
            totalRevenue,
            statusBreakdown,
            categoryBreakdown,
            recentPurchases
        ] = await Promise.all([
            Purchase.countDocuments(dateFilter),
            Purchase.aggregate([
                { $match: dateFilter },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Purchase.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Purchase.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$serviceCategory',
                        count: { $sum: 1 },
                        revenue: { $sum: '$amount' }
                    }
                }
            ]),
            Purchase.find(dateFilter)
                .sort({ createdAt: -1 })
                .limit(5)
                .select('customerName serviceName amount status createdAt')
        ]);

        res.json({
            success: true,
            data: {
                totalPurchases,
                totalRevenue: totalRevenue[0]?.total || 0,
                statusBreakdown,
                categoryBreakdown,
                recentPurchases
            }
        });

    } catch (error) {
        console.error('Error fetching purchase stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch purchase statistics',
            details: error.message
        });
    }
};

module.exports = {
    createPurchase,
    getPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
    updatePurchaseStatus,
    getPurchaseStats
};