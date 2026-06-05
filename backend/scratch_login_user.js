const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const testLogin = async () => {
  try {
    console.log('Connecting to database with URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');

    const testUser = {
      phone: '9876543210',
      name: 'Kunal Sahu',
      role: 'dealer'
    };

    console.log('Attempting to login/register test user:', testUser);
    let user = await User.findOne({ phone: testUser.phone });

    if (user) {
      console.log('User already exists. Updating details...');
      user.name = testUser.name;
      user.role = testUser.role;
      await user.save();
    } else {
      console.log('User does not exist. Creating new user...');
      user = await User.create(testUser);
    }

    console.log('SUCCESS! User details saved in Database:');
    console.log(user);

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR running test login script:', err.message);
    process.exit(1);
  }
};

testLogin();
