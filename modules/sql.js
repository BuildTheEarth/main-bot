const mysql = require('mysql');
const config = require("../config.js");
const pool = mysql.createPool({
    host    : config.dbHost,
    port    : 3306,
    user    : config.dbUser,
    password: config.dbPass,
    database: config.dbName
});

// ? Database function to ensure we always have a connection but without having to repeat ourself in the code.
let sql = {};
sql.query = function(query, params, callback) {
  pool.getConnection(function(err, connection) {
    if(err) { 
      if (callback) callback(err, null, null); 
      return; 
    }
    
    connection.query(query, params, function(error, results, fields) {
      connection.release();
      if(error) { 
        if (callback) callback(error, null, null); 
        return; 
      }
      if (callback) callback(false, results, fields);
    });
  });
};

module.exports = sql;