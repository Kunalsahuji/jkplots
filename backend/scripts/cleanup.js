require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const Enquiry = require('../models/Enquiry');

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jkplot');
        console.log('🟢 Connected to Database');

        // 1. Get all valid property IDs currently present in Database
        const properties = await Property.find({}, '_id');
        const validPropertyIds = properties.map(p => p._id.toString());

        let cleanedUsersCount = 0;
        let deletedEnquiriesCount = 0;

        // 3. Clean up orphaned Enquiries (Enquiries tied to deleted properties)
        const enquiries = await Enquiry.find({});
        for (let enq of enquiries) {
            if (!validPropertyIds.includes(enq.property.toString())) {
                await Enquiry.findByIdAndDelete(enq._id);
                deletedEnquiriesCount++;
            }
        }

        // Get remaining valid Enquiry IDs
        const remainingEnquiries = await Enquiry.find({}, '_id');
        const validEnquiryIds = remainingEnquiries.map(e => e._id.toString());

        // 4. Clean up "Ghost IDs" from Users (savedProperties, myProperties, & myEnquiries)
        const users = await User.find({});
        for (let user of users) {
            let isModified = false;
            
            // Clean savedProperties
            const oldSaved = user.savedProperties.length;
            user.savedProperties = user.savedProperties.filter(id => validPropertyIds.includes(id.toString()));
            if (oldSaved !== user.savedProperties.length) isModified = true;

            // Clean myProperties
            const oldMy = user.myProperties.length;
            user.myProperties = user.myProperties.filter(id => validPropertyIds.includes(id.toString()));
            if (oldMy !== user.myProperties.length) isModified = true;

            // Clean myEnquiries
            const oldEnq = user.myEnquiries ? user.myEnquiries.length : 0;
            if (user.myEnquiries) {
                user.myEnquiries = user.myEnquiries.filter(id => validEnquiryIds.includes(id.toString()));
                if (oldEnq !== user.myEnquiries.length) isModified = true;
            }

            if (isModified) {
                await user.save({ validateModifiedOnly: true });
                cleanedUsersCount++;
                console.log(`🧹 Cleaned ghost IDs from User: ${user.name} (${user.phone})`);
            }
        }

        console.log('\n✅ Cleanup Completed Successfully!');
        console.log(`- Cleaned ${cleanedUsersCount} user accounts`);
        console.log(`- Deleted ${deletedEnquiriesCount} orphaned enquiries`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during cleanup:', err);
        process.exit(1);
    }
};

cleanup();
