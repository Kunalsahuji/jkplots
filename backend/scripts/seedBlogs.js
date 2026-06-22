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

        // 0. DELETE ALL EXISTING BLOGS
        await Blog.deleteMany();
        console.log('Deleted all existing blogs to prevent duplicates.');

        // 1. Get Admin
        let adminUser = await Admin.findOne();
        if (!adminUser) {
            adminUser = await Admin.create({
                name: 'JKPLOT Admin',
                email: 'admin@jkplot.com',
                password: 'password123',
                role: 'superadmin'
            });
        }

        // 2. Get Dealer (Kunal Sahu)
        let dealerUser = await User.findOne({ phone: { $in: ['+918461840222', '8461840222'] } });
        if (dealerUser) {
            dealerUser.role = 'dealer';
            await dealerUser.save();
        }

        // 3. CREATE DUMMY GUIDE ARTICLES (1 for Admin, 1 for Dealer)
        const dummyGuideData = {
            excerpt: 'READ FIRST: This is an official guide explaining the exact steps, required formats, and SEO best practices for submitting an article to JKPlot Haven.',
            content: `<h2>Mastering the JKPlot Editor</h2><p>Writing detailed articles builds your authority and attracts leads. Here is exactly what you need to provide:</p><br/><h3>1. Article Title</h3><p>Make it punchy! Example: <i>"5 Tips for Buying Land in Jammu"</i></p><br/><h3>2. Cover Image</h3><p>Always upload a high-resolution, landscape-oriented image. Avoid images with heavy text.</p><br/><h3>3. Content Formatting</h3><p>Use headings (<b>H2</b>, <b>H3</b>) to separate sections. Break large paragraphs into smaller 2-3 sentence chunks to make it easy to read on mobile devices.</p><br/><h3>4. SEO Discovery (Crucial!)</h3><ul><li><b>Tags:</b> Add 3-5 comma-separated tags (e.g., real estate, tips, jammu).</li><li><b>Meta Title:</b> Keep it under 60 characters.</li><li><b>Meta Description:</b> A short 160-character summary that appears on Google Search.</li></ul><br/><p><i>Follow these steps to ensure your article gets approved quickly!</i></p>`,
            coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead2708?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            status: 'Published',
            publishedAt: new Date(),
            tags: ['System Guide', 'Tutorial', 'Must Read'],
            seo: {
                metaTitle: 'OFFICIAL GUIDE: How to Write and Format Articles | JKPlot',
                metaDescription: 'Learn the exact requirements and best practices for writing high-converting real estate articles on JKPlot Haven.',
                keywords: ['guide', 'tutorial', 'instructions', 'formatting']
            }
        };

        // Admin Guide
        await Blog.create({
            ...dummyGuideData,
            title: '📌 ADMIN GUIDE: How to Manage and Write Articles',
            slug: 'admin-guide-how-to-manage-articles-' + Date.now().toString().slice(-5),
            author: adminUser._id,
        });

        if (dealerUser) {
            // Dealer Guide
            await Blog.create({
                ...dummyGuideData,
                title: '📌 DEALER GUIDE: How to Submit Articles for Approval',
                slug: 'dealer-guide-how-to-submit-articles-' + Date.now().toString().slice(-5),
                author: dealerUser._id,
            });
        }
        console.log('Created 2 Example/Dummy Guide Articles.');

        // 4. Create 1 Unique Article per City from Admin
        const cities = await City.find({ isActive: true });
        console.log(`Found ${cities.length} active cities.`);

        const cityTopics = {
            'Jammu': {
                title: 'Top 5 Commercial Investment Hotspots in Jammu for 2026',
                excerpt: 'Explore the fastest-growing commercial sectors in Jammu. We break down the top 5 areas witnessing massive infrastructure growth and high rental yields.',
                content: '<p>Jammu is rapidly transforming into a massive commercial hub.</p><h3>1. Transport Nagar Expansion</h3><p>With new highway linkages, logistics properties are surging.</p><h3>2. Bypass Road Retail</h3><p>Showrooms and retail outlets are seeing a 15% YoY appreciation.</p><p>Investors should look for clear-title commercial plots in these designated zones.</p>',
                img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Discover the top 5 commercial investment zones in Jammu for 2026. Maximize your ROI with our exclusive JKPlot market analysis.',
                keys: ['Jammu commercial', 'investment hotspots', 'Jammu real estate']
            },
            'Srinagar': {
                title: 'Why Premium Lake-View Properties in Srinagar are Surging',
                excerpt: 'A detailed look at the rising demand and exclusive pricing of residential properties surrounding Dal Lake and Nigeen Lake in Srinagar.',
                content: '<p>The allure of a lake-view property in Srinagar is timeless.</p><h3>Scarcity Drives Value</h3><p>With strict environmental regulations limiting new constructions near water bodies, existing properties command a massive premium.</p><p>For HNIs, acquiring a heritage property here is considered a trophy asset.</p>',
                img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Explore the surging demand for premium lake-view properties in Srinagar. Understand the market dynamics behind Dal Lake real estate.',
                keys: ['Srinagar real estate', 'Dal Lake properties', 'luxury homes']
            },
            'Anantnag': {
                title: 'The Complete Guide to Agricultural Land in Anantnag',
                excerpt: 'Everything you need to know about purchasing, zoning, and cultivating agricultural plots in the fertile district of Anantnag.',
                content: '<p>Anantnag is the agricultural heartland of South Kashmir.</p><h3>Understanding Land Types</h3><p>Abi Awal (highly irrigated) lands are strictly regulated, whereas orchard conversions are seeing new policies.</p><h3>Investment Angle</h3><p>Buying land for high-density apple orchards is currently the most profitable venture in the district.</p>',
                img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'A comprehensive guide to buying agricultural land and orchards in Anantnag. Learn about zoning laws and investment returns.',
                keys: ['Anantnag land', 'agricultural plots', 'Kashmir orchards']
            },
            'Baramulla': {
                title: 'Navigating the Shift to Organized Residential Real Estate in Baramulla',
                excerpt: 'Baramulla is moving away from scattered housing to organized colonies. Learn what this means for plot buyers and future development.',
                content: '<p>The residential landscape in Baramulla is modernizing.</p><h3>The Rise of Colonies</h3><p>Local developers are introducing gated communities with dedicated amenities like parks and wide roads.</p><p>If you are buying a plot today, an approved colony offers far better resale value than independent, unzoned land.</p>',
                img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Analyze the shift towards organized residential colonies in Baramulla. Find out why gated communities are the future of North Kashmir real estate.',
                keys: ['Baramulla plots', 'residential colonies', 'housing development']
            },
            'Udhampur': {
                title: 'How Highway Infrastructure is Impacting Udhampur Real Estate',
                excerpt: 'An analysis of property price escalations along the new highway corridors and bypass routes in Udhampur.',
                content: '<p>Udhampur is geographically crucial.</p><h3>The Highway Effect</h3><p>The four-laning project has unlocked massive parcels of land for commercial and warehousing use.</p><p>We project a steady 12% annual appreciation for plots located within 2 kilometers of the new bypass.</p>',
                img: 'https://images.unsplash.com/photo-1542361345-89e58247f2d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Discover how highway infrastructure and bypass roads are skyrocketing property values in Udhampur. A must-read for logistics investors.',
                keys: ['Udhampur real estate', 'highway properties', 'commercial land']
            },
            'Kathua': {
                title: 'Industrial Growth and Land Price Surges in Kathua',
                excerpt: 'With new industrial estates popping up, Kathua is the prime destination for manufacturing setups. Here is what land buyers need to know.',
                content: '<p>Kathua is the gateway to J&K and its industrial powerhouse.</p><h3>SIDCO Estates</h3><p>The expansion of SIDCO industrial areas has caused a ripple effect in nearby residential plot pricing.</p><p>Workers and executives need housing, making Kathua an excellent market for rental yield investments.</p>',
                img: 'https://images.unsplash.com/photo-1587293852726-591136bba78c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Investigate the industrial real estate boom in Kathua. Learn how manufacturing growth is driving up both commercial and residential land prices.',
                keys: ['Kathua industries', 'SIDCO land', 'Kathua property']
            },
            'Samba': {
                title: 'Why Samba is the Next Big Manufacturing Hub',
                excerpt: 'An in-depth look at government incentives, connectivity, and real estate availability making Samba perfect for heavy industries.',
                content: '<p>Samba offers vast plains and excellent rail/road connectivity.</p><h3>Freight Corridors</h3><p>Proximity to the upcoming freight corridors means Samba is uniquely positioned for massive manufacturing plants.</p><p>Investors looking for large acreage should focus on the Samba-Mansar link road.</p>',
                img: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Find out why Samba is emerging as the premier manufacturing hub in J&K and how it affects large-acreage real estate investments.',
                keys: ['Samba manufacturing', 'industrial land', 'Samba real estate']
            },
            'Rajouri': {
                title: 'Affordable Housing Trends and Plot Investments in Rajouri',
                excerpt: 'Discover the most affordable neighborhoods in Rajouri that are poised for significant infrastructure upgrades in the next 5 years.',
                content: '<p>Rajouri offers excellent entry-level property prices.</p><h3>Smart Buying</h3><p>Rather than buying in the congested city center, investors are looking at the peripheral ring roads.</p><p>Plots here are currently undervalued but have immense potential as the city expands outward.</p>',
                img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Explore affordable housing and peripheral plot investments in Rajouri. Get in early before infrastructure upgrades drive prices up.',
                keys: ['Rajouri housing', 'affordable plots', 'Rajouri investment']
            },
            'Poonch': {
                title: 'The Rise of Border Tourism and Commercial Properties in Poonch',
                excerpt: 'How the newfound peace and border tourism initiatives are creating a demand for hospitality and commercial real estate in Poonch.',
                content: '<p>Poonch is opening up to the world.</p><h3>Tourism Infrastructure</h3><p>With increasing footfall at border tourism sites, there is a severe shortage of quality hotels and homestays.</p><p>Purchasing land for boutique hospitality projects in Poonch is a highly recommended long-term play.</p>',
                img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Analyze the impact of border tourism on Poonch real estate. Discover lucrative opportunities in hospitality and commercial properties.',
                keys: ['Poonch tourism', 'hospitality real estate', 'Poonch commercial']
            },
            'Kupwara': {
                title: 'Untapped Real Estate Potential and Scenic Plots in Kupwara',
                excerpt: 'Kupwara boasts some of the most beautiful landscapes in Kashmir. Learn about the emerging market for vacation homes and eco-resorts.',
                content: '<p>Kupwara is nature pristine frontier.</p><h3>Eco-Tourism</h3><p>The government push for eco-tourism is making Kupwara a hotspot for luxury wooden cottages and resorts.</p><p>Investors must ensure strict compliance with forest department guidelines before purchasing land here.</p>',
                img: 'https://images.unsplash.com/photo-1542640244-7e672d6cb466?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Explore the untapped potential of scenic real estate in Kupwara. A guide to investing in eco-resorts and vacation homes legally.',
                keys: ['Kupwara properties', 'eco-tourism', 'Kashmir vacation homes']
            },
            'Pulwama': {
                title: 'Orchard Lands vs Residential Plots in Pulwama',
                excerpt: 'Understanding the shifting dynamics of land use in Pulwama, focusing on the profitability of apple orchards versus residential zones.',
                content: '<p>Pulwama is known for its high-density apple orchards.</p><h3>The Battle for Land</h3><p>With urbanization expanding, many farmers are selling orchard lands at massive premiums for residential development.</p>',
                img: 'https://images.unsplash.com/photo-1542314831-c6a4d14efa74?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Discover the shifting dynamics of real estate in Pulwama. Compare ROI between orchard lands and residential property development.',
                keys: ['Pulwama real estate', 'orchard land', 'residential plots']
            },
            'Shopian': {
                title: 'Investing in the Commercial Apple Hubs of Shopian',
                excerpt: 'How the thriving apple industry is driving up commercial real estate prices along the major transport routes in Shopian.',
                content: '<p>Shopian is the apple bowl of Kashmir.</p><h3>Logistics Corridors</h3><p>Cold storage facilities and packaging units are buying up land rapidly, causing a massive spike in commercial per-kanal prices.</p>',
                img: 'https://images.unsplash.com/photo-1579381534080-60b61e27a696?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Explore commercial real estate opportunities in Shopian driven by the booming apple and cold storage industry.',
                keys: ['Shopian property', 'cold storage land', 'commercial investment']
            },
            'Bandipora': {
                title: 'Understanding Property Taxes and Regulations in Bandipora',
                excerpt: 'A comprehensive look at the new property tax structures and their immediate impact on the real estate market in Bandipora.',
                content: '<p>Regulatory changes are sweeping through Bandipora.</p><h3>Tax Implications</h3><p>The recent introduction of property taxes has temporarily slowed down speculative buying, creating a buyers market.</p>',
                img: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Analyze the impact of property taxes on the Bandipora real estate market. A guide for new buyers navigating local regulations.',
                keys: ['Bandipora real estate', 'property tax', 'market analysis']
            },
            'Ganderbal': {
                title: 'Best Tourist Route Property Investments in Ganderbal',
                excerpt: 'Why land along the routes leading to Sonamarg in Ganderbal district is becoming the most sought-after asset class.',
                content: '<p>Ganderbal serves as the gateway to Sonamarg.</p><h3>Highway Hospitality</h3><p>There is an unprecedented demand for roadside land to build restaurants, dhabas, and transit hotels.</p>',
                img: 'https://images.unsplash.com/photo-1518557984649-7b161c230cfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Discover high-yield real estate investments along the tourist routes of Ganderbal leading to Sonamarg.',
                keys: ['Ganderbal property', 'tourist route', 'commercial land']
            },
            'Kulgam': {
                title: 'Developing Retail Spaces in Kulgam City Center',
                excerpt: 'An analysis of the retail boom in Kulgam and why building mixed-use commercial spaces is the most profitable local strategy.',
                content: '<p>Kulgam city center is experiencing a massive retail boom.</p><h3>Mixed-Use Success</h3><p>Building properties with shops on the ground floor and offices above is generating rental yields as high as 8%.</p>',
                img: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Investigate the retail and commercial property boom in Kulgam. Learn why mixed-use spaces offer the best ROI.',
                keys: ['Kulgam real estate', 'retail space', 'commercial property']
            },
            'Budgam': {
                title: 'Airport Proximity and its Effect on Budgam Property Values',
                excerpt: 'How the expansion of the Srinagar International Airport is sending property values soaring in neighboring Budgam localities.',
                content: '<p>Budgam shares borders with the international airport.</p><h3>The Aviation Premium</h3><p>Areas directly connecting to the airport road have seen a 25% price escalation as logistics and airline staff seek nearby housing.</p>',
                img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Learn how the expansion of Srinagar Airport is driving up property values in Budgam. Explore the best localities for investment.',
                keys: ['Budgam property', 'airport real estate', 'price escalation']
            },
            'Reasi': {
                title: 'Religious Tourism Impact on Reasi Real Estate',
                excerpt: 'A deep dive into the Katra market in Reasi and how millions of pilgrims drive a multi-crore hospitality real estate industry.',
                content: '<p>Reasi is home to the holy shrine of Mata Vaishno Devi.</p><h3>The Katra Phenomenon</h3><p>Property in Katra is exclusively hospitality-driven. Buying land here requires massive capital but guarantees year-round cash flow.</p>',
                img: 'https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Explore the lucrative hospitality real estate market in Reasi and Katra driven by year-round religious tourism.',
                keys: ['Reasi property', 'Katra real estate', 'hospitality investment']
            },
            'Ramban': {
                title: 'Highway Expansion and Rising Rental Yields in Ramban',
                excerpt: 'As the national highway widens, Ramban is emerging as a critical transit hub. Learn how this is boosting local rental markets.',
                content: '<p>Ramban is the critical midpoint on the Jammu-Srinagar highway.</p><h3>Transit Accommodations</h3><p>There is a massive shortage of quality housing for highway engineers and transit workers, driving rental yields to unprecedented highs.</p>',
                img: 'https://images.unsplash.com/photo-1510065097455-89b251121817?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Analyze the real estate rental boom in Ramban caused by national highway expansion projects and transit worker influx.',
                keys: ['Ramban real estate', 'rental yields', 'highway projects']
            },
            'Doda': {
                title: 'Residential Real Estate Challenges and Growth in Doda',
                excerpt: 'Understanding the unique geographical challenges of building in Doda and the areas witnessing the most stable growth.',
                content: '<p>Building in the hilly terrain of Doda requires expertise.</p><h3>Stable Growth Corridors</h3><p>Investors are moving away from steep slopes towards the newly developed plateau regions for safer, long-term residential construction.</p>',
                img: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Discover the geographical challenges and safe investment zones for residential real estate in the hilly district of Doda.',
                keys: ['Doda real estate', 'hill construction', 'property growth']
            },
            'Kishtwar': {
                title: 'Hydropower Projects and Housing Demand in Kishtwar',
                excerpt: 'How mega-hydropower projects are creating a sudden influx of workers and sending housing demands through the roof in Kishtwar.',
                content: '<p>Kishtwar is the hydropower capital of J&K.</p><h3>The Energy Boom</h3><p>Thousands of engineers and laborers require housing, creating an immediate need for rapid, prefabricated rental colonies.</p>',
                img: 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                meta: 'Investigate how mega-hydropower projects in Kishtwar are driving massive demand for rental housing and prefabricated colonies.',
                keys: ['Kishtwar real estate', 'hydropower', 'housing demand']
            }
        };

        let cityCount = 0;
        for (const city of cities) {
            const topic = cityTopics[city.name] || {
                title: `Emerging Property Market Trends in ${city.name} [Unique]`,
                excerpt: `A unique analysis of the real estate landscape in ${city.name}.`,
                content: `<p>The property market in ${city.name} is growing rapidly.</p>`,
                img: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80`,
                meta: `Latest real estate trends in ${city.name}.`,
                keys: [`${city.name} real estate`]
            };

            const title = topic.title.replace(/{city}/g, city.name);

            await Blog.create({
                title: title,
                slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4),
                excerpt: topic.excerpt.replace(/{city}/g, city.name),
                content: topic.content.replace(/{city}/g, city.name),
                coverImage: topic.img,
                author: adminUser._id,
                status: 'Published',
                publishedAt: new Date(Date.now() - Math.random() * 10000000000),
                tags: [city.name.toLowerCase(), 'market analysis', 'investment'],
                seo: {
                    metaTitle: (topic.metaTitle || title).substring(0, 60),
                    metaDescription: (topic.meta || topic.excerpt).replace(/{city}/g, city.name).substring(0, 160),
                    keywords: (topic.keys || []).map(k => k.replace(/{city}/g, city.name))
                }
            });
            cityCount++;
        }
        console.log(`Created ${cityCount} distinct articles for each city from Admin.`);

        // 5. Create 10 Distinct Articles for Kunal Sahu
        if (dealerUser) {
            const kunalTopics = [
                {
                    title: '5 Massive Red Flags to Watch Out For When Buying a Plot',
                    excerpt: 'Avoid losing your life savings. Learn the top 5 warning signs of disputed or illegal land from an expert dealer.',
                    content: '<h3>1. Missing Chain of Title</h3><p>If the seller cannot provide documents linking back to the original owner, walk away.</p><h3>2. Unregistered Brokers</h3><p>Always deal with verified professionals.</p>',
                    tags: ['buying tips', 'fraud prevention', 'legal'],
                    img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                },
                {
                    title: 'How to Negotiate the Best Price for Commercial Land',
                    excerpt: 'Commercial land negotiations are ruthless. Use these 3 psychological tactics to secure the best per-square-foot rate.',
                    content: '<h3>Understand the Zoning Premium</h3><p>Do not pay commercial rates for mixed-use land.</p><h3>The Walk-Away Power</h3><p>Always have three backup properties before entering a negotiation room.</p>',
                    tags: ['negotiation', 'commercial', 'pricing'],
                    img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                },
                {
                    title: 'The Step-by-Step Guide to Property Registration in J&K',
                    excerpt: 'Confused about the registry process? Here is the exact checklist you need for a smooth property registration at the Tehsil office.',
                    content: '<h3>Stamp Duty Variations</h3><p>Remember that stamp duty is lower for female buyers. Always factor this into your purchase strategy.</p><h3>Required Documents</h3><p>Keep your Fard, ID proofs, and NOCs ready.</p>',
                    tags: ['registration', 'legal', 'checklist'],
                    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66cb85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                },
                {
                    title: 'Why Corner Plots Command a Premium (And If They are Worth It)',
                    excerpt: 'Builders charge 10-15% extra for corner plots. Let us analyze if the extra ventilation and double-access justify the high cost.',
                    content: '<h3>The Pros</h3><p>More natural light, two entry gates, and better commercial viability.</p><h3>The Cons</h3><p>More exposure to street noise and dust. If it is purely residential, a park-facing plot might be better.</p>',
                    tags: ['plot selection', 'corner plot', 'pricing'],
                    img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                },
                {
                    title: 'Understanding Zoning Laws Before Starting Construction',
                    excerpt: 'Do not start digging until you read this. A breakdown of residential, commercial, and mixed-use zoning laws in municipal areas.',
                    content: '<h3>Setback Rules</h3><p>Every municipality requires you to leave a certain percentage of your plot open. Violating this leads to demolition drives.</p>',
                    tags: ['zoning', 'construction', 'laws'],
                    img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                },
                {
                    title: 'Pre-Launch vs Ready-to-Move: Which is Better for Investors?',
                    excerpt: 'Are pre-launch offers a scam or a goldmine? An objective comparison of risk versus reward in early-stage investments.',
                    content: '<h3>The Risk Profile</h3><p>Pre-launch offers the highest ROI but carries execution risk. Always check the developers track record before handing over a booking amount.</p>',
                    tags: ['investment strategy', 'pre-launch', 'ROI'],
                    img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                },
                {
                    title: 'Top 3 Neighborhoods Providing the Highest Rental Yields',
                    excerpt: 'Looking for monthly passive income? These 3 emerging neighborhoods are currently offering rental yields above 6%.',
                    content: '<h3>Student Hubs vs IT Hubs</h3><p>Areas near universities provide consistent but low-ticket rentals, while IT corridors offer premium long-term corporate leases.</p>',
                    tags: ['rental yield', 'passive income', 'neighborhoods'],
                    img: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                },
                {
                    title: 'The Hidden Costs of Buying Land You Need to Know',
                    excerpt: 'The plot price is just the beginning. Discover the hidden costs of fencing, soil testing, and local association fees.',
                    content: '<h3>Leveling and Soil</h3><p>Buying a cheap plot on a slope means you will spend lakhs just on retaining walls and earth-filling. Always calculate the "developed cost".</p>',
                    tags: ['hidden costs', 'budgeting', 'plot buying'],
                    img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                },
                {
                    title: 'How to Spot Fake Property Documents Instantly',
                    excerpt: 'Protect yourself from forgery. I share my 10 years of experience on how to visually and legally verify property papers.',
                    content: '<h3>Watermarks and Stamps</h3><p>Always verify the stamp paper serial number online. Cross-check the sub-registrar signatures with official records.</p>',
                    tags: ['forgery', 'document verification', 'safety'],
                    img: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                },
                {
                    title: 'Flipping Land: A Beginners Guide to Short-Term Profits',
                    excerpt: 'Buy, hold, sell. The definitive guide to land flipping for massive short-term capital gains in growing cities.',
                    content: '<h3>The 18-Month Strategy</h3><p>Identify corridors where highways are proposed but not yet built. Buy agricultural land, wait for the notification, and flip to developers.</p>',
                    tags: ['land flipping', 'capital gains', 'trading'],
                    img: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                }
            ];

            let count = 1;
            for (const topic of kunalTopics) {
                await Blog.create({
                    title: topic.title,
                    slug: topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4),
                    excerpt: topic.excerpt,
                    content: topic.content,
                    coverImage: topic.img,
                    author: dealerUser._id,
                    status: count <= 5 ? 'Published' : 'Pending', // First 5 published, rest pending
                    publishedAt: count <= 5 ? new Date(Date.now() - Math.random() * 10000000000) : null,
                    tags: topic.tags,
                    seo: {
                        metaTitle: `${topic.title.substring(0, 45)} | Dealer Tips`,
                        metaDescription: topic.excerpt.substring(0, 160),
                        keywords: [...topic.tags, 'kunal sahu', 'jkplot dealer']
                    }
                });
                count++;
            }
            console.log('Created 10 entirely distinct articles for Kunal Sahu (Dealer).');
        }

        console.log('Blog Seeding Completed Successfully! No duplicates exist.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedBlogs();
