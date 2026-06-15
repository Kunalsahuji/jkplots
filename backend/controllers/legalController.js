const LegalPage = require('../models/LegalPage');
const ErrorResponse = require('../utils/errorResponse');

// Get default page content if not seeded
const getDefaultContent = (slug) => {
    if (slug === 'privacy-policy') {
        return {
            title: 'Privacy Policy',
            content: `<h3>1. Information We Collect</h3>
<p>We collect information to provide better services to all our users. The types of information we collect include:</p>
<ul>
  <li>Personal identification information (Name, email address, phone number, etc.)</li>
  <li>Property preferences and search history on our platform</li>
  <li>Communication records when you contact our support or dealers</li>
</ul>

<h3>2. How We Use Your Information</h3>
<p>We use the information we collect to provide, maintain, and improve our services, process inquiries, and deliver personalized recommendations.</p>

<h3>3. Data Security</h3>
<p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, or deletion.</p>`
        };
    }
    
    if (slug === 'terms-of-service') {
        return {
            title: 'Terms of Service',
            content: `<h3>1. Acceptance of Terms</h3>
<p>By accessing or using the JKPlot platform, you agree to comply with and be bound by these Terms of Service.</p>

<h3>2. User Accounts</h3>
<p>To post listings or contact dealers, you may need to register an account. You are responsible for keeping your login credentials secure.</p>

<h3>3. Prohibited Activities</h3>
<p>Users are strictly prohibited from posting fraudulent listings, violating intellectual property rights, or misrepresenting information on this platform.</p>`
        };
    }

    return {
        title: 'Legal Document',
        content: '<p>Document content is currently under preparation.</p>'
    };
};

// @desc    Get legal page by slug
// @route   GET /api/legal/:slug
// @access  Public
exports.getLegalPage = async (req, res, next) => {
    try {
        const { slug } = req.params;
        let page = await LegalPage.findOne({ slug });

        // If not found in DB, seed a default copy
        if (!page) {
            const defaults = getDefaultContent(slug);
            page = await LegalPage.create({
                slug,
                title: defaults.title,
                content: defaults.content,
                updatedBy: 'System Seeder'
            });
        }

        res.status(200).json({
            success: true,
            data: page
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update or create a legal page
// @route   PUT /api/legal/:slug
// @access  Private/Admin
exports.updateLegalPage = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { title, content } = req.body;

        if (!title || !content) {
            return next(new ErrorResponse('Please provide a title and content', 400));
        }

        let page = await LegalPage.findOne({ slug });

        if (page) {
            page.title = title;
            page.content = content;
            page.updatedBy = req.user?.name || 'Admin';
            await page.save();
        } else {
            page = await LegalPage.create({
                slug,
                title,
                content,
                updatedBy: req.user?.name || 'Admin'
            });
        }

        res.status(200).json({
            success: true,
            data: page
        });
    } catch (err) {
        next(err);
    }
};
