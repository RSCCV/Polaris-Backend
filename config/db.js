const better_sqlite3 = require('better-sqlite3');
//const db = new better_sqlite3('local.db', { verbose: console.log });
//TODO DBMS sowftware?
const mysql = require('mysql2');
const path = require('path');
let db;
require('dotenv').config({ path: path.join(path.basename(path.dirname(__dirname)), '.env') });
// need to load ENV variables here because db.js is executed before server.js :/

// DEBUG
// console.log('Environment variables in db:', process.env ? 'Loaded ✅' : 'Missing ❌');
// console.log('Environment variables loaded from: ', path.basename(path.dirname(__dirname)));
// console.log('Mode: ',process.env.NODE_ENV);

// const connectDB = () => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'PRODUCTION') {
    // Production:
    console.log('Connecting to MySQL...');
    
    db = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('MySQL connected');
  } else {
    // Development: Use SQLite
    console.log('Connecting to SQLite...');
    
    db = new better_sqlite3('local.db', { verbose: console.log });
    db.pragma('foreign_keys = ON');
    console.log('SQLite connected');
  }
// }

// const addAccessLevelColumn = () => {
//   try {
//     db.exec(`
//       ALTER TABLE users 
//       ADD COLUMN accessLevel TEXT DEFAULT 'user'
//     `);
//     console.log('accessLevel column added successfully');
//   } catch (error) {
//     if (error.message.includes('duplicate column name')) {
//       console.log('accessLevel column already exists');
//     } else {
//       throw error;
//     }
//   }
// };

// // Call this once
// addAccessLevelColumn();


module.exports = db;
// module.exports = {db, connectDB};