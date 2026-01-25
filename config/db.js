// const better_sqlite3 = require('better-sqlite3');
//const db = new better_sqlite3('local.db', { verbose: console.log });
//TODO DBMS sowftware?
// const mysql = require('mysql2');
const path = require('path');
const mongoose = require('mongoose');
let db;
require('dotenv').config({ path: path.join(path.basename(path.dirname(__dirname)), '.env') });
// need to load ENV variables here because db.js is executed before server.js :/

// DEBUG
console.log('Environment variables in db:', process.env ? 'Loaded ✅' : 'Missing ❌');
console.log('Environment variables loaded from: ', path.basename(path.dirname(__dirname)));
console.log('Mode: ',process.env.NODE_ENV);


// MongoDB


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://ralfl:6mo0ZchZymy1pRUN@polarisdb.ns5hw2r.mongodb.net/?appName=PolarisDB";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true, 
//   }
// });

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    console.log("Establishing connection to DB")
    // await client.connect();
    await mongoose.connect(process.env.URI, {
      family: 4,
      dbName: 'PolarisDB',
      serverSelectionTimeoutMS: 10000,
    });
    // Send a ping to confirm a successful connection
    mongoose.set('debug', true);
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



// const connectDB = () => {
  // const env = process.env.NODE_ENV || 'development';

  // if (env === 'PRODUCTION') {
  //   // Production:
  //   console.log('Connecting to MySQL...');
    
  //   db = mysql.createConnection({
  //     host: process.env.DB_HOST,
  //     user: process.env.DB_USERNAME,
  //     password: process.env.DB_PASSWORD,
  //     database: process.env.DB_NAME
  //   });
    
  //   console.log('MySQL connected');
  // } else {
  //   // Development: Use SQLite
  //   console.log('Connecting to SQLite...');
    
  //   db = new better_sqlite3('local.db', { verbose: console.log });
  //   db.pragma('foreign_keys = ON');
  //   console.log('SQLite connected');
  // }
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