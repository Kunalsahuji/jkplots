const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Blog = require('../models/Blog');
const User = require('../models/User');
const Admin = require('../models/Admin');
const City = require('../models/City');

const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedBlogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Get Admin
        let adminUser = await Admin.findOne();
        if (!adminUser) {
            console.log('No admin found, creating one...');
            adminUser = await Admin.create({
                name: 'JKPLOT Admin',
                email: 'admin@jkplot.com',
                password: 'password123',
                role: 'superadmin'
            });
        } else {
            adminUser.name = 'JKPLOT Admin';
            await adminUser.save();
        }

        // 2. Get Dealer
        let dealerUser = await User.findOne({ phone: '+918461840222' });
        if (!dealerUser) {
            dealerUser = await User.findOne({ phone: '8461840222' });
        }
        if (!dealerUser) {
            console.log('Dealer not found, please check the phone number. Skipping dealer blogs.');
        } else {
            dealerUser.role = 'dealer'; // Ensure it's dealer
            await dealerUser.save();
        }

        // 3. Create the Example Article
        const exampleBlog = await Blog.create({
            title: 'GUIDE: How to Write the Perfect Real Estate Article [Example]',
            slug: 'guide-how-to-write-perfect-real-estate-article-example-' + Date.now().toString().slice(-4),
            excerpt: 'This is an example article designed to show dealers and administrators exactly how to properly format and submit a blog post to JKPlot Haven.',
            content: `<h2>Welcome to the JKPlot Haven Editor</h2><br/><p>Writing a great article helps boost your visibility as a dealer on our platform.</p><br/><h3>Best Practices:</h3><ul><li><b>Title:</b> Keep it catchy and under 60 characters.</li><li><b>Content:</b> Break it up into small paragraphs. Use bold text for emphasis.</li><li><b>SEO Tags:</b> Fill out the SEO section completely. It helps buyers find your article on Google!</li></ul><br/><p><i>Start typing your own knowledge today and watch your leads grow!</i></p>`,
            coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
            author: adminUser._id,
            status: 'Published',
            publishedAt: new Date(),
            tags: ['guide', 'tutorial', 'admin'],
            seo: {
                metaTitle: 'Guide: Write Perfect Real Estate Articles | JKPlot Haven',
                metaDescription: 'Learn how to write highly engaging and SEO-optimized real estate articles on JKPlot Haven to attract more buyers to your listings.',
                keywords: ['guide', 'writing', 'jkplot', 'real estate marketing']
            }
        });
        console.log('Example Guide Article created.');

        // 4. Create 2 Blogs for each City from Admin
        const cities = await City.distinct('name');
        console.log(`Found ${cities.length} cities.`);
        
        for (const city of cities) {
            for (let i = 1; i <= 2; i++) {
                const title = i === 1 
                    ? `Top 5 Emerging Real Estate Investment Hubs in ${city}`
                    : `Complete Guide to Buying Your First Plot in ${city}`;
                    
                await Blog.create({
                    title: title,
                    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4),
                    excerpt: `Discover the best neighborhoods and upcoming real estate opportunities in ${city}. Read our comprehensive market analysis.`,
                    content: `<p>The real estate market in <b>${city}</b> is experiencing unprecedented growth.</p><br/><h3>Why Invest Here?</h3><p>With massive infrastructure development and new highways, property values are steadily rising.</p><p>Stay tuned to JKPlot for the latest property updates in ${city}!</p>`,
                    coverImage: i === 1 
                        ? 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'
                        : 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=800&q=80',
                    author: adminUser._id,
                    status: 'Published',
                    publishedAt: new Date(Date.now() - Math.random() * 10000000000), // Random past date
                    tags: [city.toLowerCase(), 'investment', 'market trends'],
                    seo: {
                        metaTitle: `Real Estate Investment in ${city} | JKPlot Market Analysis`,
                        metaDescription: `Read our comprehensive guide and market analysis for real estate investment opportunities in ${city}. Buy smart with JKPlot Haven.`,
                        keywords: [city, 'real estate', 'investment', 'plots', 'jkplot']
                    }
                });
            }
        }
        console.log(`Created 2 articles for each of the ${cities.length} cities.`);

        // 5. Create 10 Blogs from Kunal Sahu (Dealer)
        if (dealerUser) {
            for (let i = 1; i <= 10; i++) {
                const title = `Dealer Insight: Why Now is the Best Time to Buy Property - Part ${i}`;
                await Blog.create({
                    title: title,
                    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4),
                    excerpt: `Expert dealer insights from Kunal Sahu on market timing, property negotiation, and finding the perfect plot for your dream home.`,
                    content: `<p>As an experienced dealer, I frequently get asked: <i>When is the right time to buy?</i></p><br/><p>The truth is, the best time was yesterday. The second best time is today.</p><p>Contact me through my JKPlot profile to discuss these opportunities directly!</p>`,
                    coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
                    author: dealerUser._id,
                    status: i <= 5 ? 'Published' : 'Pending', // 5 published, 5 pending
                    publishedAt: i <= 5 ? new Date(Date.now() - Math.random() * 10000000000) : null,
                    tags: ['dealer tips', 'buying guide', 'negotiation'],
                    seo: {
                        metaTitle: `Dealer Insight: Buying Property in 2026 | Kunal Sahu`,
                        metaDescription: `Read expert real estate tips from authorized dealer Kunal Sahu. Discover the best strategies for negotiating and securing your perfect property.`,
                        keywords: ['dealer tips', 'kunal sahu', 'property advice']
                    }
                });
            }
            console.log('Created 10 articles for Kunal Sahu (Dealer).');
        }

        console.log('Blog Seeding Completed Successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedBlogs();
