const mongoose = require('mongoose');
const { MONGO_URL, DB_NAME } = require('./envConfig');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
    console.log(`MongoDB Connected: ${conn.connection.host} / ${DB_NAME}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
