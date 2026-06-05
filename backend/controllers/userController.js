const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Auth user (Login or Register)
// @route   POST /api/users/auth
// @access  Public
exports.loginOrRegister = async (req, res, next) => {
    try {
        const { phone, name, role } = req.body;

        if (!phone || !name) {
            return next(new ErrorResponse('Please provide phone and name', 400));
        }

        // Find user by phone number
        let user = await User.findOne({ phone });

        if (user) {
            // Update fields if they changed
            user.name = name;
            user.role = role || user.role;
            await user.save();
        } else {
            // Register new user
            user = await User.create({
                phone,
                name,
                role: role || 'user'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};
