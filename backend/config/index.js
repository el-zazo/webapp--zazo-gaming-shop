/**
 * Server configuration
 */

require("dotenv").config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI,
    connectionOptions: {
      dbName: process.env.DB_NAME,
    },
    cache: {
      enabled: false,
    },
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
  },
};

module.exports = config;
