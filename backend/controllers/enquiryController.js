const Enquiry = require('../models/Enquiry');
const Property = require('../models/Property');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new property enquiry
// @route   POST /api/enquiries
// @access  Private
exports.createEnquiry = async (req, res, next) => {
    try {
        const { propertyId, name, phone, message } = req.body;

        if (!propertyId) {
            return next(new ErrorResponse('Property ID is required', 400));
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return next(new ErrorResponse('Property not found', 404));
        }

        const buyerPhone = phone ? `+91${phone.replace(/\D/g, '').slice(-10)}` : req.user.phone;
        const buyerName = name || req.user.name;

        // Prevent multiple active enquiries for the same property
        const existingEnquiry = await Enquiry.findOne({
            property: propertyId,
            buyer: req.user._id,
            status: { $in: ['Pending', 'Contacted'] }
        });

        if (existingEnquiry) {
            return next(new ErrorResponse('You already have an active callback request for this property. Please wait for the dealer to close it.', 400));
        }

        const enquiry = await Enquiry.create({
            property: propertyId,
            dealer: property.dealer,
            dealerPhone: property.dealerPhone,
            buyer: req.user._id,
            buyerPhone,
            buyerName,
            message: message || "I'm interested in this property."
        });

        // Update the buyer's myEnquiries array
        await User.findByIdAndUpdate(req.user._id, {
            $push: { myEnquiries: enquiry._id }
        });

        // Increment property enquiries count
        await Property.findByIdAndUpdate(propertyId, { $inc: { enquiriesCount: 1 } });

        // Notify the dealer
        const dealer = await User.findOne({ phone: property.dealerPhone });
        if (dealer) {
            await Notification.create({
                user: dealer._id,
                title: 'New Callback Request',
                message: `${buyerName} (${buyerPhone}) requested a callback for your property: "${property.title}"`
            });
        }

        res.status(201).json({
            success: true,
            data: enquiry
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user's enquiries (received and sent)
// @route   GET /api/enquiries
// @access  Private
exports.getEnquiries = async (req, res, next) => {
    try {
        let query = {};
        if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            query = {};
        } else if (req.user.role === 'dealer') {
            query = {
                $or: [
                    { dealerPhone: req.user.phone },
                    { buyerPhone: req.user.phone }
                ]
            };
        } else {
            query = { buyerPhone: req.user.phone };
        }

        const enquiries = await Enquiry.find(query)
            .populate('property')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: enquiries
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id
// @access  Private (Dealer/Admin)
exports.updateEnquiryStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['Pending', 'Contacted', 'Closed'].includes(status)) {
            return next(new ErrorResponse('Invalid status value', 400));
        }

        let enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) {
            return next(new ErrorResponse('Enquiry not found', 404));
        }

        if (enquiry.dealerPhone !== req.user.phone && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return next(new ErrorResponse('Not authorized to update this enquiry', 401));
        }

        enquiry.status = status;
        await enquiry.save();

        res.status(200).json({
            success: true,
            data: enquiry
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/:id
// @access  Private (Dealer/Admin)
exports.deleteEnquiry = async (req, res, next) => {
    try {
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) {
            return next(new ErrorResponse('Enquiry not found', 404));
        }

        if (enquiry.dealerPhone !== req.user.phone && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return next(new ErrorResponse('Not authorized to delete this enquiry', 401));
        }

        // Decrement enquiries count on the referenced property
        if (enquiry.property) {
            await Property.findByIdAndUpdate(enquiry.property, { $inc: { enquiriesCount: -1 } });
        }

        // Remove from buyer's enquiries list
        if (enquiry.buyer) {
            await User.findByIdAndUpdate(enquiry.buyer, {
                $pull: { myEnquiries: enquiry._id }
            });
        }

        await Enquiry.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Enquiry deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
