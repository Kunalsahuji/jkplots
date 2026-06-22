const mongoose = require('mongoose');
const dotenv = require('dotenv');
const City = require('../models/City');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedCities = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const jkCities = [
            'Jammu',
            'Srinagar',
            'Anantnag',
            'Baramulla',
            'Udhampur',
            'Kathua',
            'Samba',
            'Rajouri',
            'Poonch',
            'Kupwara',
            'Pulwama',
            'Shopian',
            'Bandipora',
            'Ganderbal',
            'Kulgam',
            'Budgam',
            'Reasi',
            'Ramban',
            'Doda',
            'Kishtwar'
        ];

        let createdCount = 0;

        for (const cityName of jkCities) {
            const existing = await City.findOne({ name: cityName });
            if (!existing) {
                await City.create({
                    name: cityName,
                    state: 'Jammu and Kashmir',
                    isActive: true
                });
                createdCount++;
            }
        }

        console.log(`Seeded ${createdCount} new cities in Jammu and Kashmir.`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedCities();
