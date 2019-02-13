var mysql = require('mysql');
var fs = require('fs');
let pool = null;

if(fs.existsSync('./.dbtoken')) {
    console.log("attempting to connect...");
    let connectionObject = JSON.parse(fs.readFileSync('./.dbtoken'));
    connectionObject.connectionLimit = 10;
    connectionObject.typeCast = customCaster;
    pool = mysql.createPool( connectionObject );
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
        console.log("Established connection with database");
        connection.release();
    }
});

/*
 * By default the MySQL Node driver does not properly convert BIT values to booleans.
 * This custom type caster is used to properly convert BIT values to booleans
 */
function customCaster( field, userDefaultTypeCasting ) {
    if(field.type === 'BIT') {
        // convert the field into a list of bits, least significant at index 0
        let bytes = field.buffer();
        return bytes[0] == 1;
    }
    return userDefaultTypeCasting();
}

module.exports = pool;