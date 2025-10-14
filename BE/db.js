const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance and reliability
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'electro_store',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    idleTimeout: 300000,
    // Keep connection alive
    keepAliveInitialDelay: 0,
    enableKeepAlive: true
});

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err);
        console.log('Make sure MySQL is running and database "electro_store" exists');
    } else {
        console.log('Connected to MySQL successfully with connection pool');
        connection.release();
    }
});

// Promisify the query function with better error handling
const db = {
    query: (sql, args) => {
        return new Promise((resolve, reject) => {
            pool.query(sql, args, (err, rows) => {
                if (err) {
                    console.error('Database query error:', err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    },
    pool: pool // Export the pool for advanced usage
};

module.exports = db;
