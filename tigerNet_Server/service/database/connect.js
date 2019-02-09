var mysql = require('mysql');
var fs = require('fs');
let pool = null;

if(fs.existsSync('./.dbtoken')) {
    console.log("attempting to connect...");
    let connectionObject = JSON.parse(fs.readFileSync('./.dbtoken'));
    connectionObject.connectionLimit = 10;
    pool = mysql.createPool( connectionObject );
    // connection.connect( (err) => {//test to make sure connection is configured properly
    //     if(err) {
    //         console.log('Failed to create a connection to MySQL with the data provided in .dbtoken');
    //         console.log(err.code);
    //         console.log(err.message);
    //         console.log(err.sqlMessage);
    //     }
    //     console.log("Successful connection");
    // });
} else {    
    console.log('.dbtoken file not found, creating .dbtoken');
    let connectionObject = {
        host: '',
        port: '',
        user: '',
        password: '',
        database: ''
    }
    fs.writeFileSync('./.dbtoken', JSON.stringify(connectionObject, null, 4));
    console.log('Please fill out .dbtoken with the database connection info');
    process.exit(0);
}

pool.getConnection((err, connection) => {
    if(err) {
        console.error(err);
    }
    if(connection) {
        connection.release();
    }
});

module.exports = pool;