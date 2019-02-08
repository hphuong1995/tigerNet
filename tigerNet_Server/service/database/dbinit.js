/* DO NOT Include this module, it is not ready for use */
let connection = require('./connect');


connection.beginTransaction( (err) => {
    if(err) {
        throw err;
    }
    let query = "DROP TABLE IF EXISTS 'USERS';";
    connection.query(query, (error, res, fields) => {
        if(error) {
            connection.rollback();
            console.log("mysql error: " + error.message);
            throw error;
        }
        query = "CREATE TABLE 'users' (\
                    id VARCHAR(45) NOT NULL\
                    username VARCHAR(22) NOT NULL\
                    passhash VARCHAR(61) NOT NULL\
                    type\
                    status\
                    PRIMARY KEY (id)\
                );";
        connection.query(query, (err) => {
            if(err) {
                connection.rollback();
                throw err;
            }
            connection.commit( (err) => {
                connection.rollback();
                throw err;
            })
        });
    });
});

connection.beginTransaction( (err) => {
    if(err) {
        throw err;
    }
    let query = "DROP TABLE IF EXISTS 'messages';";
    connection.query(query, (error, res, fields) => {
        if(error) {
            connection.rollback();
            console.log("mysql error: " + error.message);
            throw error;
        }
        query = "CREATE TABLE 'messages' (\
                    mid VARCHAR(45) NOT NULL\
                    content VARCHAR(500) NOT NULL\
                    FOREIGN KEY FK_receiver_id VARCHAR(45)\
                    REFERENCES users(id)\
                    ON UPDATE CASCADE\
                    ON DELETE SET NULL\
                    FOREIGN KEY FK_sender_id\
                    REFERENCES users(id)\
                    ON UPDATE CASCADE\
                    ON DELETE SET NULL\
                    PRIMARY KEY (mid)\
                );";
        connection.query(query, (err) => {
            if(err) {
                connection.rollback();
                throw err;
            }
            connection.commit( (err) => {
                connection.rollback();
                throw err;
            })
        });
    });
});

console.log("test module: " + test);