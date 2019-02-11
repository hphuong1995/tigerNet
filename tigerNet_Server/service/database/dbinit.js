/* 
 * This script wipes and sets up the TIGERDB database.
 * DO NOT Include this module, it is not part of the server.
 * It is only for initializing the database
 */
const pool = require('./connect');
const uuid = require('uuid/v1');
const bcrypt = require('bcrypt');

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
                            connection.rollback(() => connection.release());
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
                                                query = "DROP TABLE IF EXISTS security_answers;";
                                                connection.query(query, (err, res, fields) => {
                                                    if (err) {
                                                        connection.rollback(() => connection.release());
                                                        console.error("mysql error: " + err.message);
                                                        throw err;
                                                    }
                                                    query = "CREATE TABLE security_answers (\
                                                                id VARCHAR(45) NOT NULL,\
                                                                answer VARCHAR(45) NOT NULL,\
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
                                                                    query = "CREATE TABLE sessions (\
                                                                                id VARCHAR(45) NOT NULL,\
                                                                                csrf VARCHAR(45) NOT NULL,\
                                                                                PRIMARY KEY (id)\
                                                                            );";
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
                                                                            addInitialValues();
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
});



function addInitialValues() {
    let adminUser = {
        id: uuid(),
        username: 'Harrison',
        passHash: bcrypt.hashSync('tiger0485', 10),
        isAdmin: true,
        isBlocked: false
    }

    let user = {
        id: uuid(),
        username: 'Horacio',
        passHash: bcrypt.hashSync('RpelioN2x', 10),
        isAdmin: false,
        isBlocked: false
    }

    let questions = [
        [uuid(), "What is your favorite class?"],
        [uuid(), "When was your first dog born?"],
        [uuid(), "What is your brother's name?"],
        [uuid(), "What is your favorite color?"],
        [uuid(), "What is your favorite food?"],
    ];

    let adminAnswers = [
        {
            id: uuid(),
            questionId: questions[0][0],
            userId: adminUser.id,
            answer: "CS 744"
        },
        {
            id: uuid(),
            questionId: questions[1][0],
            userId: adminUser.id,
            answer: "2000"
        },
        {
            id: uuid(),
            questionId: questions[2][0],
            userId: adminUser.id,
            answer: "Leeroy"
        }
    ];

    let userAnswers = [
        {
            id: uuid(),
            questionId: questions[2][0],
            userId: user.id,
            answer: "Kevin"
        },
        {
            id: uuid(),
            questionId: questions[3][0],
            userId: user.id,
            answer: "green"
        },
        {
            id: uuid(),
            questionId: questions[4][0],
            userId: user.id,
            answer: "apple pie"
        }
    ];
    
    let query = "INSERT INTO questions(id, question) VALUES ?";
    pool.query(query, [questions], (err, res, fields) => {
        if (err) {
            console.error("mysql error: " + err.message);
            throw err;
        }
        query = "INSERT INTO users (id, username, passhash, is_admin, is_blocked) VALUES ?";
        let values = [
            [adminUser.id, adminUser.username, adminUser.passHash, adminUser.isAdmin, adminUser.isBlocked],
            [user.id, user.username, user.passHash, user.isAdmin, user.isBlocked]
        ];
        pool.query(query, [values], (err, res, fields) => {
            if (err) {
                console.error("mysql error: " + err.message);
                throw err;
            }
            query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id) VALUES ?";
            values = [
                [adminAnswers[0].id, adminAnswers[0].answer, adminAnswers[0].userId, adminAnswers[0].questionId],
                [adminAnswers[1].id, adminAnswers[1].answer, adminAnswers[1].userId, adminAnswers[1].questionId],
                [adminAnswers[2].id, adminAnswers[2].answer, adminAnswers[2].userId, adminAnswers[2].questionId],
                [userAnswers[0].id, userAnswers[0].answer, userAnswers[0].userId, userAnswers[0].questionId],
                [userAnswers[1].id, userAnswers[1].answer, userAnswers[1].userId, userAnswers[1].questionId],
                [userAnswers[2].id, userAnswers[2].answer, userAnswers[2].userId, userAnswers[2].questionId]
            ];
            pool.query(query, [values], (err, res, fields) => {
                if (err) {
                    console.error("mysql error: " + err.message);
                    throw err;
                }
                console.log("Database values initialized");
            });
        });
    });
}
