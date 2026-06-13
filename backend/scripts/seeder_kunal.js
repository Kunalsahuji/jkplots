const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../models/User');
const Admin = require('../models/Admin');
const Property = require('../models/Property');
const bcrypt = require('bcryptjs');

// Sample real estate images
const images = [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80"
];

// Seed Data Configuration
const generateProperties = (dealerId, dealerPhone) => {
    const properties = [];
    const cities = ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur"];
    const localities = ["Sector 1", "Downtown", "Civil Lines", "Green Belt", "VIP Colony"];
    
    const getRand = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let globalCounter = 1;

    // Helper to push
    const addProp = (purpose, type, titlePrefix, bed, bath, area, price) => {
        properties.push({
            title: `${titlePrefix} - Unit ${globalCounter++}`,
            description: `A beautiful ${type} available for ${purpose}. Perfect for those looking for a secure and serene environment with all modern amenities.`,
            purpose: purpose,
            type: type,
            city: getRand(cities),
            locality: getRand(localities),
            bedrooms: bed,
            bathrooms: bath,
            balconies: bed > 0 ? 1 : 0,
            furnishing: bed > 0 ? "Furnished" : "Unfurnished",
            parking: "Covered",
            area: area,
            price: price,
            contactNumber: dealerPhone,
            dealerPhone: dealerPhone,
            dealer: dealerId,
            photos: [getRand(images), getRand(images)],
            views: 0,
            viewedBy: [],
            likes: 0,
            enquiriesCount: 0
        });
    };

    // 1. BUY properties
    const buyTypes = ['Flat/Apartment', 'Independent House / Villa', 'Independent / Builder Floor', 'Plot / Land'];
    buyTypes.forEach((type) => {
        // Seed 2 of each
        addProp('Buy', type, `Premium ${type} for Sale`, type === 'Plot / Land' ? 0 : 3, type === 'Plot / Land' ? 0 : 2, 1500, 8500000);
        addProp('Buy', type, `Luxury ${type} for Sale`, type === 'Plot / Land' ? 0 : 4, type === 'Plot / Land' ? 0 : 3, 2200, 15000000);
    });

    // 2. RENT properties
    const rentTypes = ['Flat/Apartment', 'Independent House / Villa', 'Independent / Builder Floor'];
    rentTypes.forEach((type) => {
        addProp('Rent', type, `Affordable ${type} for Rent`, 2, 1, 900, 15000);
        addProp('Rent', type, `Spacious ${type} for Rent`, 3, 2, 1400, 25000);
    });

    // 3. COMMERCIAL properties
    const commercialTypes = ['Office', 'Industry', 'Retail', 'Plot / Land'];
    commercialTypes.forEach((type) => {
        addProp('Commercial', type, `Prime ${type} Space`, 0, 1, 1000, 5500000);
        addProp('Commercial', type, `Large ${type} Investment`, 0, 2, 5000, 25000000);
    });

    // 4. RICH PROPERTIES (Verified, Furnished, 5 Images, 1 Video)
    const richImages = [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"
    ];
    const sampleVideo = "https://www.w3schools.com/html/mov_bbb.mp4"; // Reliable sample video

    for(let i=1; i<=5; i++) {
        properties.push({
            title: `Fully Verified Premium Villa ${i}`,
            description: `An extremely premium and fully verified villa with a cinematic video tour. Completely furnished with state of the art amenities.`,
            purpose: 'Buy',
            type: 'Independent House / Villa',
            city: getRand(cities),
            locality: getRand(localities),
            bedrooms: 4,
            bathrooms: 4,
            balconies: 2,
            furnishing: "Furnished",
            parking: "Covered",
            area: 3500,
            price: 25000000 + (i * 1000000),
            contactNumber: dealerPhone,
            dealerPhone: dealerPhone,
            dealer: dealerId,
            photos: richImages, // 5 images
            video: sampleVideo, // 1 video
            verified: true, // Verification filter active
            views: 0,
            viewedBy: [],
            likes: 0,
            enquiriesCount: 0
        });
    }

    return properties;
};

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const targetPhone = '+918461840222';
        const user = await User.findOne({ phone: targetPhone });

        if (!user) {
            console.error(`User with phone ${targetPhone} not found. Please register first.`);
            process.exit(1);
        }

        console.log(`Found dealer: ${user.name}. Starting seed process...`);

        // Clean up old properties to prevent duplicates and legacy errors
        await Property.deleteMany({});
        await User.updateMany({}, { $set: { myProperties: [] } });
        console.log('Cleared legacy properties from database.');

        const propertiesToSeed = generateProperties(user._id, user.phone);

        const insertedProperties = await Property.insertMany(propertiesToSeed);
        console.log(`Successfully seeded ${insertedProperties.length} properties across all types!`);

        // Update the user's myProperties array
        const propertyIds = insertedProperties.map(p => p._id);
        await User.findByIdAndUpdate(user._id, {
            $push: { myProperties: { $each: propertyIds } }
        });
        console.log('User myProperties array updated successfully!');

        // Seed Admin User
        await Admin.deleteMany({});
        const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
        await Admin.create({
            name: 'JKPlot Admin',
            email: 'admin@jkplot.com',
            phone: '9999999999',
            password: adminPasswordHash,
            role: 'superadmin'
        });
        console.log('Default Admin created: admin@jkplot.com / Admin@123');

        // Seed Promotion Plans
        const PromotionPlan = require('../models/PromotionPlan');
        await PromotionPlan.deleteMany({});
        await PromotionPlan.insertMany([
            {
                name: 'Bronze Plan',
                durationInDays: 7,
                price: 199,
                description: ['Top of search results', 'Featured badge on listing', '2x more views']
            },
            {
                name: 'Silver Plan',
                durationInDays: 15,
                price: 399,
                description: ['Top of search results', 'Featured badge on listing', '5x more views', 'Homepage showcase']
            },
            {
                name: 'Gold Plan',
                durationInDays: 30,
                price: 799,
                description: ['Top of search results', 'Featured badge on listing', '10x more views', 'Homepage showcase', 'Dedicated support']
            }
        ]);
        console.log('Promotion Plans seeded successfully.');

        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
