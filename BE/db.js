const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// Promisify the query function
const db = {
    query: (sql, args) => {
        return new Promise((resolve, reject) => {
            connection.query(sql, args, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    },
    connection: connection // Export the original connection as well if needed
};

module.exports = db;
