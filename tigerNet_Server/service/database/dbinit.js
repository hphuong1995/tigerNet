/* 
 * This script wipes and sets up the TIGERDB database.
 * DO NOT Include this module, it is not part of the server.
 * It is only for initializing the database
 */
let pool = require('./connect');
pool.getConnection((err, connection) => {
    if (err) {
        connection.rollback(() => connection.release());
        console.error("DB initilization failed");
        process.exit(-1);
    }

    connection.beginTransaction((err) => {
        if (err) {
            throw err;
        }
        let query = "SET FOREIGN_KEY_CHECKS = 0;";
        connection.query(query, (err, res, fields) => {
            if (err) {
                connection.rollback(() => connection.release());
                console.error("mysql error: " + err.message);
                throw err;
            }
            query = "DROP TABLE IF EXISTS users;";
            connection.query(query, (err, res, fields) => {
                if (err) {
                    connection.rollback(() => connection.release());
                    console.error("mysql error: " + err.message);
                    throw err;
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
                    if (err) {
                        connection.rollback(() => connection.release());
                        console.error("mysql error: " + err.message);
                        throw err;
                    }
                    query = "DROP TABLE IF EXISTS messages;";
                    connection.query(query, (err, res, fields) => {
                        if (err) {
                            connection.rollback();
                            console.error("mysql error: " + err.message);
                            throw err;
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
                            if (err) {
                                connection.rollback(() => connection.release());
                                console.error("mysql error: " + err.message);
                                throw err;
                            }
                            query = "DROP TABLE IF EXISTS nodes;";
                            connection.query(query, (err, res, fields) => {
                                if (err) {
                                    connection.rollback(() => connection.release());
                                    console.error("mysql error: " + err.message);
                                    throw err;
                                }
                                query = "CREATE TABLE nodes (\
                                            id VARCHAR(45) NOT NULL,\
                                            is_active BIT NOT NULL,\
                                            connected_node_id VARCHAR(45),\
                                            PRIMARY KEY (id)\
                                        );";
                                connection.query(query, (err) => {
                                    if (err) {
                                        connection.rollback(() => connection.release());
                                        console.error("mysql error: " + err.message);
                                        throw err;
                                    }
                                    query = "DROP TABLE IF EXISTS questions;";
                                    connection.query(query, (err, res, fields) => {
                                        if (err) {
                                            connection.rollback(() => connection.release());
                                            console.error("mysql error: " + err.message);
                                            throw err;
                                        }
                                        query = "CREATE TABLE questions (\
                                                    id VARCHAR(45) NOT NULL,\
                                                    question VARCHAR(120),\
                                                    PRIMARY KEY (id)\
                                                );";
                                        connection.query(query, (err, res, fields) => {
                                            if (err) {
                                                connection.rollback(() => connection.release());
                                                console.error("mysql error: " + err.message);
                                                throw err;
                                            }
                                            query = "DROP TABLE IF EXISTS node_messages;";
                                            connection.query(query, (err) => {
                                                if (err) {
                                                    connection.rollback(() => connection.release());
                                                    console.error("mysql error: " + err.message);
                                                    throw err;
                                                }
                                                query = "CREATE TABLE node_messages (\
                                                            id VARCHAR(45) NOT NULL,\
                                                            fk_connected_node_id VARCHAR(45),\
                                                            FOREIGN KEY (fk_connected_node_id)\
                                                            REFERENCES nodes(id)\
                                                            ON UPDATE CASCADE\
                                                            ON DELETE SET NULL,\
                                                            fk_connected_message_id VARCHAR(45),\
                                                            FOREIGN KEY (fk_connected_message_id)\
                                                            REFERENCES messages(id)\
                                                            ON UPDATE CASCADE\
                                                            ON DELETE SET NULL,\
                                                            PRIMARY KEY (id)\
                                                        );";
                                                query = "DROP TABLE IF EXISTS user_questions;";
                                                connection.query(query, (err, res, fields) => {
                                                    if (err) {
                                                        connection.rollback(() => connection.release());
                                                        console.error("mysql error: " + err.message);
                                                        throw err;
                                                    }
                                                    query = "CREATE TABLE user_questions (\
                                                                id VARCHAR(45) NOT NULL,\
                                                                fk_user_id VARCHAR(45) NOT NULL,\
                                                                FOREIGN KEY (fk_user_id)\
                                                                REFERENCES users(id)\
                                                                ON UPDATE CASCADE\
                                                                ON DELETE CASCADE,\
                                                                fk_question_id VARCHAR(45) NOT NULL,\
                                                                FOREIGN KEY (fk_question_id)\
                                                                REFERENCES questions(id)\
                                                                ON UPDATE CASCADE\
                                                                ON DELETE CASCADE,\
                                                                PRIMARY KEY (id)\
                                                            );";
                                                    connection.query(query, (err) => {
                                                        if (err) {
                                                            connection.rollback(() => connection.release());
                                                            console.error("mysql error: " + err.message);
                                                            throw err;
                                                        }
                                                        query = "DROP TABLE IF EXISTS patterns;";
                                                        connection.query(query, (err, res, fields) => {
                                                            if (err) {
                                                                connection.rollback(() => connection.release());
                                                                console.error("mysql error: " + err.message);
                                                                throw err;
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
                                                                if (err) {
                                                                    connection.rollback(() => connection.release());
                                                                    console.error("mysql error: " + err.message);
                                                                    throw err;
                                                                }
                                                                query = "SET FOREIGN_KEY_CHECKS = 1;";
                                                                connection.query(query, (err, res, fields) => {
                                                                    if (err) {
                                                                        connection.rollback(() => connection.release());
                                                                        console.error("mysql error: " + err.message);
                                                                        throw err;
                                                                    }
                                                                    connection.commit((err) => {
                                                                        if (err) {
                                                                            connection.rollback(() => connection.release());
                                                                            throw err;
                                                                        }
                                                                        console.error("All tables created successfully");
                                                                        connection.release();
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
