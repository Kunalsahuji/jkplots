const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Property = require('../models/Property');
const Report = require('../models/Report');
const User = require('../models/User');

const seedReports = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jkplot-haven', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Database connected.');

        // Clear existing reports
        await Report.deleteMany();
        console.log('Cleared existing reports.');

        const properties = await Property.find().limit(3);
        if (properties.length === 0) {
            console.log('No properties found to report on. Please seed properties first.');
            process.exit(0);
        }

        const user = await User.findOne();

        const dummyReports = [
            {
                property: properties[0]._id,
                reason: 'Fraud/Scam',
                description: 'The dealer is claiming ownership of this house but I verified with the local land registry and it belongs to someone else. They are demanding advance payments.',
                reporterPhone: '9906123456',
                reportedBy: user ? user._id : null,
                status: 'Pending'
            },
            {
                property: properties[1]._id,
                reason: 'Incorrect Details',
                description: 'The location shown in the listing description says Srinagar Civil Lines, but the actual map pin and description references a location in Baramulla. Very misleading.',
                reporterPhone: '7006987654',
                reportedBy: null,
                status: 'Pending'
            }
        ];

        if (properties[2]) {
            dummyReports.push({
                property: properties[2]._id,
                reason: 'Sold/Unavailable',
                description: 'I called the agent and they told me this plot was sold 3 months ago. They are keeping it listed to attract leads.',
                reporterPhone: '9596112233',
                reportedBy: user ? user._id : null,
                status: 'Reviewed'
            });
        }

        await Report.insertMany(dummyReports);
        console.log(`Successfully seeded ${dummyReports.length} dummy reports!`);

        mongoose.connection.close();
        console.log('Connection closed.');
    } catch (err) {
        console.error('Error seeding reports:', err);
        process.exit(1);
    }
};

seedReports();
