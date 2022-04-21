require('dotenv').config();

var mysql = require('mysql2');
var conn = mysql.createConnection({
  host: '127.0.0.1', 
  user: 'root',      
  password: process.env.DB_VOLT,      
}); 
 
conn.connect(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully!!');
});
module.exports = conn;