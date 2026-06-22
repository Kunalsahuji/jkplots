const Report = require('../models/Report');
const Property = require('../models/Property');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Submit a new complaint / flag a listing
// @route   POST /api/reports
// @access  Public (Guest/User)
exports.createReport = async (req, res, next) => {
    try {
        const { propertyId, reason, description, reporterPhone } = req.body;

        if (!propertyId || !reason || !description) {
            return next(new ErrorResponse('Please provide propertyId, reason category, and description', 400));
        }

        const propertyExists = await Property.findById(propertyId);
        if (!propertyExists) {
            return next(new ErrorResponse('Listing not found', 404));
        }

        // Prevent dealer from reporting their own listing
        if (req.user && (
            (propertyExists.dealer && propertyExists.dealer.toString() === req.user._id.toString()) ||
            (propertyExists.dealerPhone && propertyExists.dealerPhone === req.user.phone)
        )) {
            return next(new ErrorResponse('You cannot report your own property listing', 400));
        }

        const reportData = {
            property: propertyId,
            reason,
            description,
            reporterPhone: reporterPhone || ''
        };

        // If user is logged in, attach their user ID
        if (req.user) {
            reportData.reportedBy = req.user._id;
            if (!reportData.reporterPhone && req.user.phone) {
                reportData.reporterPhone = req.user.phone;
            }
        }

        const report = await Report.create(reportData);

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully. Thank you for making our marketplace safe.',
            data: report
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all reports (Admin)
// @route   GET /api/reports/admin
// @access  Private/Admin
exports.getReports = async (req, res, next) => {
    try {
        const reports = await Report.find()
            .populate({
                path: 'property',
                select: 'title price dealerPhone location city isFeatured photos'
            })
            .populate({
                path: 'reportedBy',
                select: 'name phone email role'
            })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get reports submitted by current user
// @route   GET /api/reports/my-reports
// @access  Private
exports.getMyReports = async (req, res, next) => {
    try {
        const reports = await Report.find({ reportedBy: req.user._id })
            .populate({
                path: 'property',
                select: 'title price dealerPhone location city photos'
            })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update report status and admin response (Admin)
// @route   PUT /api/reports/admin/:id
// @access  Private/Admin
exports.updateReportStatus = async (req, res, next) => {
    try {
        const { status, adminResponse } = req.body;

        const report = await Report.findById(req.params.id);

        if (!report) {
            return next(new ErrorResponse('Report log not found', 404));
        }

        // Prevent status downgrades
        if (status) {
            if (!['Pending', 'Reviewed', 'Dismissed'].includes(status)) {
                return next(new ErrorResponse('Please provide a valid moderation status', 400));
            }
            if (report.status !== 'Pending' && status === 'Pending') {
                return next(new ErrorResponse('Cannot revert status back to Pending once resolved or reviewed', 400));
            }
            report.status = status;
            
            if (['Reviewed', 'Dismissed'].includes(status)) {
                report.resolvedAt = new Date();
            }
        }

        if (adminResponse !== undefined) {
            report.adminResponse = adminResponse;
        }

        await report.save();

        res.status(200).json({
            success: true,
            message: 'Report updated successfully',
            data: report
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a report log (Admin)
// @route   DELETE /api/reports/admin/:id
// @access  Private/Admin
exports.deleteReport = async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return next(new ErrorResponse('Report log not found', 404));
        }

        await report.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Report log deleted successfully',
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
