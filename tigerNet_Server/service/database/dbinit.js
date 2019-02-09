/* 
 * This script wipes and sets up the TIGERDB database.
 * DO NOT Include this module, it is not part of the server.
 * It is only for initializing the database
 */
let connection = require('./connect');

connection.beginTransaction( (err) => {
    if(err) {
        throw err;
    }
    let query = "DROP TABLE IF EXISTS users;";
    connection.query(query, (error, res, fields) => {
        if(error) {
            connection.rollback();
            console.log("mysql error: " + error.message);
            throw error;
        }
        query = "CREATE TABLE users (\
                    id VARCHAR(45) NOT NULL,\
                    username VARCHAR(22) NOT NULL,\
                    passhash VARCHAR(61) NOT NULL,\
                    is_admin BIT NOT NULL, \
                    is_blocked BIT NOT NULL,\
                    PRIMARY KEY (id)\
                );";
        connection.query(query, (err) => {
            if(err) {
                connection.rollback();
                throw err;
            }
            connection.commit( (err) => {
                if(err) {
                    connection.rollback();
                    throw err;
                }
                console.log("users table created");
            });
        });
    });
});

connection.beginTransaction( (err) => {
    if(err) {
        throw err;
    }
    let query = "DROP TABLE IF EXISTS messages;";
    connection.query(query, (error, res, fields) => {
        if(error) {
            connection.rollback();
            console.log("mysql error: " + error.message);
            throw error;
        }
        query = "CREATE TABLE messages (\
                    id VARCHAR(45) NOT NULL,\
                    content VARCHAR(500) NOT NULL,\
                    fk_receiver_id VARCHAR(45) NOT NULL,\
                    FOREIGN KEY (fk_receiver_id)\
                    REFERENCES users(id)\
                    ON UPDATE CASCADE\
                    ON DELETE CASCADE,\
                    fk_sender_id VARCHAR(45),\
                    FOREIGN KEY (fk_sender_id)\
                    REFERENCES users(id)\
                    ON UPDATE CASCADE\
                    ON DELETE SET NULL,\
                    PRIMARY KEY (id)\
                );";
        connection.query(query, (err) => {
            if(err) {
                connection.rollback();
                throw err;
            }
            connection.commit( (err) => {
                if(err) {
                    connection.rollback();
                    throw err;
                }
                console.log("messages table created");
            });
        });
    });
});

connection.beginTransaction( (err) => {
    if(err) {
        throw err;
    }
    let query = "DROP TABLE IF EXISTS nodes;";
    connection.query(query, (error, res, fields) => {
        if(error) {
            connection.rollback();
            console.log("mysql error: " + error.message);
            throw error;
        }
        query = "CREATE TABLE nodes (\
                    id VARCHAR(45) NOT NULL,\
                    is_active BIT NOT NULL,\
                    connected_node_id,\
                    PRIMARY KEY (id)\
                );";
        connection.query(query, (err) => {
            if(err) {
                connection.rollback();
                throw err;
            }
            connection.commit( (err) => {
                if(err) {
                    connection.rollback();
                    throw err;
                }
                console.log("nodes table created");
            });
        });
    });
});

connection.beginTransaction( (err) => {
    if(err) {
        throw err;
    }
    let query = "DROP TABLE IF EXISTS node_messages;";
    connection.query(query, (error, res, fields) => {
        if(error) {
            connection.rollback();
            console.log("mysql error: " + error.message);
            throw error;
        }
        query = "CREATE TABLE node_messages (\
                    id VARCHAR(45) NOT NULL,\
                    fk_connected_node_id VARCHAR(45),\
                    FOREIGN KEY fk_connected_node_id\
                    REFERENCES nodes(id)\
                    ON UPDATE CASCADE\
                    ON DELETE SET NULL,\
                    fk_connected_message_id VARCHAR(45),\
                    FOREIGN KEY (fk_connected_message_id),\
                    REFERENCES messages(id)\
                    ON UPDATE CASCADE\
                    ON DELETE SET NULL,\
                    PRIMARY KEY (id)\
                );";
        connection.query(query, (err) => {
            if(err) {
                connection.rollback();
                throw err;
            }
            connection.commit( (err) => {
                if(err) {
                    connection.rollback();
                    throw err;
                }
                console.log("node_messages table created");
            });
        });
    });
});

connection.beginTransaction( (err) => {
    if(err) {
        throw err;
    }
    let query = "DROP TABLE IF EXISTS patterns;";
    connection.query(query, (error, res, fields) => {
        if(error) {
            connection.rollback();
            console.log("mysql error: " + error.message);
            throw error;
        }
        query = "CREATE TABLE patterns (\
                    id VARCHAR(45) NOT NULL,\
                    fk_connected_node_id VARCHAR(45),\
                    FOREIGN KEY (fk_connected_node_id)\
                    REFERENCES nodes(id)\
                    ON UPDATE CASCADE\
                    ON DELETE SET NULL,\
                    PRIMARY KEY (id)\
                );";
        connection.query(query, (err) => {
            if(err) {
                connection.rollback();
                throw err;
            }
            connection.commit( (err) => {
                if(err) {
                    connection.rollback();
                    throw err;
                }
                console.log("patterns table created");
            });
        });
    });
});
