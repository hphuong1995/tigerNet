/* 
 * This script wipes and sets up the TIGERDB database with tables and initial values.
 * DO NOT Include this module, it is a standalone script and not part of the server.
 * It is only for initializing the database.
 */
//const pool = require('./connect');
const pool = require('./../../dist/services/database/connect');
const uuid = require('uuid/v1');
const bcrypt = require('bcrypt');
const initQueue = [];

const ID_TABLE = 
    "CREATE TABLE id (\
        nodeId INT NOT NULL,\
        patternId INT NOT NULL,\
        messageId INT NOT NULL,\
        PRIMARY KEY (nodeId)\
    );";

const USERS_TABLE =
    "CREATE TABLE users (\
        id VARCHAR(45) NOT NULL,\
        username VARCHAR(22) NOT NULL,\
        passhash VARCHAR(61) NOT NULL,\
        is_admin BIT NOT NULL, \
        is_blocked BIT NOT NULL,\
        login_attempts INT NOT NULL,\
        PRIMARY KEY (id)\
    );";

const MESSAGES_TABLE =
    "CREATE TABLE messages (\
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

const NODES_TABLE =
    "CREATE TABLE nodes (\
        id VARCHAR(6) NOT NULL,\
        is_active BIT NOT NULL,\
        is_connector BIT NOT NULL,\
        fk_pattern_id VARCHAR(6),\
        FOREIGN KEY (fk_pattern_id)\
        REFERENCES patterns(id)\
        ON UPDATE CASCADE\
        ON DELETE CASCADE,\
        PRIMARY KEY (id)\
    );";

const QUESTIONS_TABLE =
    "CREATE TABLE questions (\
        id VARCHAR(45) NOT NULL,\
        question VARCHAR(120),\
        PRIMARY KEY (id)\
    );";

const NODE_MESSAGES_TABLE =
    "CREATE TABLE node_messages (\
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

const SECURITY_ANSWERS_TABLE =
    "CREATE TABLE security_answers (\
        id VARCHAR(45) NOT NULL,\
        answer VARCHAR(45) NOT NULL,\
        incorrect_guess BIT NOT NULL,\
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

const PATTERNS_TABLE =
    "CREATE TABLE patterns (\
        id VARCHAR(6) NOT NULL,\
        PRIMARY KEY (id)\
    );";

const SESSIONS_TABLE =
    "CREATE TABLE sessions (\
        id VARCHAR(45) NOT NULL,\
        csrf VARCHAR(45) NOT NULL,\
        PRIMARY KEY (id)\
    );";

/*
 * Functions added to the queue will be executed in FIFO order
 */
initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    pool.getConnection((err, connection) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("DB initilization failed");
            process.exit(-1);
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    connection.beginTransaction((err) => {
        if (err) {
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "SET FOREIGN_KEY_CHECKS = 0;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "DROP TABLE IF EXISTS id;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = ID_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "DROP TABLE IF EXISTS users;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = USERS_TABLE;
    connection.query(query, (err) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "DROP TABLE IF EXISTS messages;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = MESSAGES_TABLE;
    connection.query(query, (err) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "DROP TABLE IF EXISTS nodes;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = NODES_TABLE;
    connection.query(query, (err) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "DROP TABLE IF EXISTS questions;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = QUESTIONS_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "DROP TABLE IF EXISTS node_messages;";
    connection.query(query, (err) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = NODE_MESSAGES_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "DROP TABLE IF EXISTS security_answers;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = SECURITY_ANSWERS_TABLE;
    connection.query(query, (err) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "DROP TABLE IF EXISTS patterns;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = PATTERNS_TABLE;
    connection.query(query, (err) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "DROP TABLE IF EXISTS sessions;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = SESSIONS_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    let query = "SET FOREIGN_KEY_CHECKS = 1;";
    connection.query(query, (err, res, fields) => {
        if (err) {
            connection.rollback(() => connection.release());
            console.error("mysql error: " + err.message);
            throw err;
        }
        if (next) {
            next(connection, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = undefined;
    if(initQueue) {
        next = initQueue.pop();
    }
    connection.commit((err) => {
        if (err) {
            connection.rollback(() => connection.release());
            throw err;
        }
        connection.release();
        if (next) {
            next(undefined, initQueue);
        }
    });
});

initQueue.unshift((connection, initQueue) => {
    if(initQueue) {
        next = initQueue.pop();
    }    
    initializeValuesAndExit();
});

let executeQueue = initQueue.pop();
executeQueue(undefined, initQueue);

function initializeValuesAndExit() {
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
        passHash: bcrypt.hashSync('tiger0485', 10),
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
        // login_attempts INT NOT NULL,\
        query = "INSERT INTO users (id, username, passhash, is_admin, is_blocked, login_attempts) VALUES ?";
        let values = [
            [adminUser.id, adminUser.username, adminUser.passHash, adminUser.isAdmin, adminUser.isBlocked, 0],
            [user.id, user.username, user.passHash, user.isAdmin, user.isBlocked, 0]
        ];
        pool.query(query, [values], (err, res, fields) => {
            if (err) {
                console.error("mysql error: " + err.message);
                throw err;
            }
            query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id, incorrect_guess) VALUES ?";
            values = [
                [adminAnswers[0].id, adminAnswers[0].answer, adminAnswers[0].userId, adminAnswers[0].questionId, false],
                [adminAnswers[1].id, adminAnswers[1].answer, adminAnswers[1].userId, adminAnswers[1].questionId, false],
                [adminAnswers[2].id, adminAnswers[2].answer, adminAnswers[2].userId, adminAnswers[2].questionId, false],
                [userAnswers[0].id, userAnswers[0].answer, userAnswers[0].userId, userAnswers[0].questionId, false],
                [userAnswers[1].id, userAnswers[1].answer, userAnswers[1].userId, userAnswers[1].questionId, false],
                [userAnswers[2].id, userAnswers[2].answer, userAnswers[2].userId, userAnswers[2].questionId, false]
            ];
            pool.query(query, [values], (err, res, fields) => {
                if (err) {
                    console.error("mysql error: " + err.message);
                    throw err;
                }
                query = "INSERT INTO id (nodeId, patternId, messageId) VALUES ?";
                values = [
                    [0, 0, 0]
                ]
                pool.query(query, [values], (err, res, fields) => {
                    if (err) {
                        console.error("mysql error: " + err.message);
                        throw err;
                    }
                    console.log("Database values initialized");
                    process.exit(0);
                });
            });
        });
    });
}
