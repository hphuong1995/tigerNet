var mysql = require('mysql');
var fs = require('fs');

if(fs.existsSync('./.dbinit')) {
    let connectionObject = JSON.parse(fs.readFileSync('./.dbinit'));
    connection = mysql.createConnection(connectionObject);
    connection.connect( (err) => {//test to make sure connection is configured properly
        if(err) {
            console.log('Failed to create a connection to MySQL with the data provided in .dbinit');
            throw err;
        }
        connection.close();
    });
} else {    
    console.log('.dbinit file not found, creating .dbinit');
    let connectionObject = {
        host: '',
        user: '',
        password: '',
        database: ''
    }
    fs.writeFileSync('./.dbinit', JSON.stringify(connectionObject, null, 4));
    console.log('Please fill out .dbinit with the database connection info');
    process.exit(0);
}

module.exports = connection;