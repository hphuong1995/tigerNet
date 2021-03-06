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
const fs = require('fs');
const db = require('./../../dist/services/database/db').db;
const sqlData = 'services/database/network.sql';

const NODE_IDS_TABLE = 
    "CREATE TABLE nodeIds (\
        id VARCHAR(6) NOT NULL,\
        isFree BIT NOT NULL,\
        PRIMARY KEY (id)\
    );";
     
const PATTERN_IDS_TABLE = 
    "CREATE TABLE patternIds (\
        id VARCHAR(6) NOT NULL,\
        isFree BIT NOT NULL,\
        PRIMARY KEY (id)\
    );";
    
const DOMAIN_IDS_TABLE = 
    "CREATE TABLE domainIds (\
        id VARCHAR(6) NOT NULL,\
        isFree BIT NOT NULL,\
        PRIMARY KEY (id)\
    );";

const MESSAGE_IDS_TABLE = 
    "CREATE TABLE messageIds (\
        id VARCHAR(6) NOT NULL,\
        isFree BIT NOT NULL,\
        PRIMARY KEY (id)\
    );";

const USERS_TABLE =
    "CREATE TABLE users (\
        id VARCHAR(45) NOT NULL,\
        username VARCHAR(22) NOT NULL,\
        passhash VARCHAR(61) NOT NULL,\
        is_admin BIT NOT NULL, \
        is_blocked BIT NOT NULL DEFAULT 0,\
        login_attempts INT NOT NULL DEFAULT 0,\
        PRIMARY KEY (id)\
    );";

// const MESSAGES_TABLE =
//     "CREATE TABLE messages (\
//         id VARCHAR(45) NOT NULL,\
//         body VARCHAR(51) NOT NULL,\
//         fk_receiver_id VARCHAR(45) NOT NULL,\
//         CONSTRAINT FOREIGN KEY (fk_receiver_id)\
//         REFERENCES nodes(id)\
//         ON UPDATE CASCADE\
//         ON DELETE RESTRICT,\
//         fk_sender_id VARCHAR(45),\
//         CONSTRAINT FOREIGN KEY (fk_sender_id)\
//         REFERENCES nodes(id)\
//         ON UPDATE NO ACTION\
//         ON DELETE NO ACTION,\
//         PRIMARY KEY (id)\
//     );";

const MESSAGES_TABLE =
    "CREATE TABLE messages (\
        id VARCHAR(45) NOT NULL,\
        body VARCHAR(51) NOT NULL,\
        fk_receiver_id VARCHAR(45) NOT NULL,\
        CONSTRAINT FOREIGN KEY (fk_receiver_id)\
        REFERENCES nodes(id)\
        ON UPDATE CASCADE\
        ON DELETE RESTRICT,\
        fk_sender_id VARCHAR(45),\
        PRIMARY KEY (id)\
    );";

const QUESTIONS_TABLE =
    "CREATE TABLE questions (\
        id VARCHAR(45) NOT NULL,\
        question VARCHAR(120),\
        PRIMARY KEY (id)\
    );";

const SECURITY_ANSWERS_TABLE =
    "CREATE TABLE security_answers (\
        id VARCHAR(45) NOT NULL,\
        answer VARCHAR(45) NOT NULL,\
        incorrect_guess BIT NOT NULL DEFAULT 0,\
        fk_user_id VARCHAR(45) NOT NULL,\
        CONSTRAINT FOREIGN KEY (fk_user_id)\
        REFERENCES users(id)\
        ON UPDATE CASCADE\
        ON DELETE CASCADE,\
        fk_question_id VARCHAR(45) NOT NULL,\
        CONSTRAINT FOREIGN KEY (fk_question_id)\
        REFERENCES questions(id)\
        ON UPDATE CASCADE\
        ON DELETE CASCADE,\
        PRIMARY KEY (id)\
    );";

const NODES_TABLE =
    "CREATE TABLE nodes (\
        id VARCHAR(6) NOT NULL,\
        is_active BIT NOT NULL,\
        is_connector BIT NOT NULL,\
        fk_pattern_id VARCHAR(6) DEFAULT NULL,\
        CONSTRAINT FOREIGN KEY (fk_pattern_id)\
        REFERENCES patterns(id)\
        ON UPDATE CASCADE\
        ON DELETE RESTRICT,\
        fk_domain_id VARCHAR(6) DEFAULT NULL,\
        CONSTRAINT FOREIGN KEY (fk_domain_id)\
        REFERENCES domains(id)\
        ON UPDATE CASCADE\
        ON DELETE RESTRICT,\
        PRIMARY KEY (id)\
    );";

const PATTERNS_TABLE =
    "CREATE TABLE patterns (\
        id VARCHAR(6) NOT NULL,\
        fk_domain_id VARCHAR(6),\
        CONSTRAINT FOREIGN KEY (fk_domain_id)\
        REFERENCES domains(id)\
        ON UPDATE CASCADE\
        ON DELETE RESTRICT,\
        PRIMARY KEY (id)\
    );";

const DOMAINS_TABLE =
    "CREATE TABLE domains (\
        id VARCHAR(6) NOT NULL,\
        PRIMARY KEY (id)\
    );";

const DOMAIN_DELETE_TRIGGER =
    "CREATE TRIGGER domain_delete\
        BEFORE DELETE ON domains\
        FOR EACH ROW\
        BEGIN\
            DELETE FROM patterns WHERE fk_domain_id = OLD.id;\
            UPDATE domainids SET isFree = 1 WHERE id = OLD.id;\
            DELETE FROM nodes WHERE fk_domain_id = OLD.id;\
            UPDATE nodeids SET isFree = 1 WHERE id = OLD.id;\
        END\
    ";

const PATTERNS_DELETE_TRIGGER = 
    "CREATE TRIGGER patterns_delete\
        BEFORE DELETE ON patterns\
        FOR EACH ROW\
        BEGIN\
            DELETE FROM nodes WHERE fk_pattern_id = OLD.id;\
            UPDATE patternids SET isFree = 1 WHERE id = OLD.id;\
        END\
    ";

const NODES_DELETE_TRIGGER = 
    "CREATE TRIGGER nodes_delete\
        BEFORE DELETE ON nodes\
        FOR EACH ROW\
        BEGIN\
            DELETE FROM messages WHERE fk_receiver_id = OLD.id;\
            UPDATE nodeids SET isFree = 1 WHERE id = OLD.id;\
        END\
    ";

const MESSAGES_DELETE_TRIGGER = 
    "CREATE TRIGGER messages_delete\
        BEFORE DELETE ON messages\
        FOR EACH ROW\
        BEGIN\
            UPDATE messageids SET isFree = 1 WHERE id = OLD.id;\
        END\
    ";
    
const NODE_CONNECTIONS_TABLE =
    "CREATE TABLE node_connections (\
        id INT NOT NULL AUTO_INCREMENT,\
        fk_node_id VARCHAR(6),\
        FOREIGN KEY (fk_node_id)\
        REFERENCES nodes(id)\
        ON UPDATE CASCADE\
        ON DELETE CASCADE,\
        fk_target_id VARCHAR(6),\
        CONSTRAINT FOREIGN KEY (fk_target_id)\
        REFERENCES nodes(id)\
        ON UPDATE CASCADE\
        ON DELETE CASCADE,\
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
    let next = initQueue.pop();
    pool.getConnection((err, connection) => {
        if (err) {
            connection.release();
            console.error("DB initilization failed");
            process.exit(-1);
        }
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    connection.beginTransaction((err) => {
        if (err) {
            throw err;
        }
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "SET FOREIGN_KEY_CHECKS = 0;";
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "DROP TRIGGER IF EXISTS domain_delete;";
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "DROP TRIGGER IF EXISTS messages_delete;";
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "DROP TRIGGER IF EXISTS patterns_delete;";
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "DROP TRIGGER IF EXISTS nodes_delete;";
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "DROP TABLE IF EXISTS ids, nodeIds, patternIds, messageIds, users,\
                    messages, nodes, questions, node_messages, security_answers,\
                    patterns, sessions, node_connections, pattern_connections,\
                    domainIds, domains;";
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "SET FOREIGN_KEY_CHECKS = 1;";
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = NODE_IDS_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = PATTERN_IDS_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = MESSAGE_IDS_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = DOMAIN_IDS_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = USERS_TABLE;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = DOMAINS_TABLE;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = PATTERNS_TABLE;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = NODES_TABLE;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = MESSAGES_TABLE;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = QUESTIONS_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

// initQueue.unshift((connection, initQueue) => {
//     let next = initQueue.pop();
//     let query = NODE_MESSAGES_TABLE;
//     connection.query(query, (err, res, fields) => {
//         if (err) rollbackAndExit(connection, err);
//         next(connection, initQueue);
//     });
// });

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = SECURITY_ANSWERS_TABLE;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = SESSIONS_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = NODE_CONNECTIONS_TABLE;
    connection.query(query, (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = DOMAIN_DELETE_TRIGGER;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = PATTERNS_DELETE_TRIGGER;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = NODES_DELETE_TRIGGER;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = MESSAGES_DELETE_TRIGGER;
    connection.query(query, (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "INSERT INTO users (id, username, passhash, is_admin) VALUES ?";
    let values = [
        [uuid(), 'administrator', bcrypt.hashSync('IMonitor', 10), true],
        [uuid(), 'LMarshall', bcrypt.hashSync('LindaM', 10), false],
        [uuid(), 'MClutcher', bcrypt.hashSync('MaxClutch', 10), false],
        [uuid(), 'EWickerson', bcrypt.hashSync('EmilyWicker', 10), false]
    ];
    connection.query(query, [values], (err) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "SELECT id FROM users WHERE username = 'administrator'";
    connection.query(query, (err, results) => {
        if (err) rollbackAndExit(connection, err);
        console.log(results);
        let id = results[0].id;
        let questions = [
            [uuid(), "What is your favorite film?"],
            [uuid(), "What city would you like to visit as your dream vacation?"],
            [uuid(), "What is the short name of the college you attended first?"]
        ];
        let answers = [
            [uuid(), "Die Hard", id, questions[0][0]],
            [uuid(), "Paris", id, questions[1][0]],
            [uuid(), "Concordia", id, questions[2][0]],
        ];
        query = "INSERT INTO questions (id, question) VALUES ?";
        connection.query(query, [questions], (err) => {
            if (err) rollbackAndExit(connection, err);
            query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id) VALUES ?";
            connection.query(query, [answers], (err) => {
                if (err) rollbackAndExit(connection, err);
                next(connection, initQueue);
            });
        });
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "SELECT id FROM users WHERE username = 'LMarshall'";
    connection.query(query, (err, results) => {
        if (err) rollbackAndExit(connection, err);
        console.log(results);
        let id = results[0].id;
        let questions = [
            [uuid(), "What city were you born in?"],
            [uuid(), "What is your favorite film?"],
            [uuid(), "What is your closest friend’s nick name?"]
        ];
        let answers = [
            [uuid(), "Nashville", id, questions[0][0]],
            [uuid(), "Spider Man", id, questions[1][0]],
            [uuid(), "Turtle", id, questions[2][0]],
        ];
        query = "INSERT INTO questions (id, question) VALUES ?";
        connection.query(query, [questions], (err) => {
            if (err) rollbackAndExit(connection, err);
            query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id) VALUES ?";
            connection.query(query, [answers], (err) => {
                if (err) rollbackAndExit(connection, err);
                next(connection, initQueue);
            });
        });
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "SELECT id FROM users WHERE username = 'MClutcher'";
    connection.query(query, (err, results) => {
        if (err) rollbackAndExit(connection, err);
        console.log(results);
        let id = results[0].id;
        let questions = [
            [uuid(), "What is the name of the high school you attended?"],
            [uuid(), "What are the last four digits of your current phone number?"],
            [uuid(), "What is your closest friend’s nickname?"]
        ];
        let answers = [
            [uuid(), "Longville High School", id, questions[0][0]],
            [uuid(), "7823", id, questions[1][0]],
            [uuid(), "Magnet", id, questions[2][0]],
        ];
        query = "INSERT INTO questions (id, question) VALUES ?";
        connection.query(query, [questions], (err) => {
            if (err) rollbackAndExit(connection, err);
            query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id) VALUES ?";
            connection.query(query, [answers], (err) => {
                if (err) rollbackAndExit(connection, err);
                next(connection, initQueue);
            });
        });
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let query = "SELECT id FROM users WHERE username = 'EWickerson'";
    connection.query(query, (err, results) => {
        if (err) rollbackAndExit(connection, err);
        console.log(results);
        let id = results[0].id;
        let questions = [
            [uuid(), "Who is your favorite singer?"],
            [uuid(), "Who is your favorite school teacher?"],
            [uuid(), "What is your closest friend’s nickname?"]
        ];
        let answers = [
            [uuid(), "Jeanette Chan", id, questions[0][0]],
            [uuid(), "Michael Chan", id, questions[1][0]],
            [uuid(), "Biker", id, questions[2][0]],
        ];
        query = "INSERT INTO questions (id, question) VALUES ?";
        connection.query(query, [questions], (err) => {
            if (err) rollbackAndExit(connection, err);
            query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id) VALUES ?";
            connection.query(query, [answers], (err) => {
                if (err) rollbackAndExit(connection, err);
                next(connection, initQueue);
            });
        });
    });
});

// let query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id, incorrect_guess) VALUES ?";
//     let values = [
//         [adminAnswers[0].id, adminAnswers[0].answer, adminAnswers[0].userId, adminAnswers[0].questionId, false],
//         [adminAnswers[1].id, adminAnswers[1].answer, adminAnswers[1].userId, adminAnswers[1].questionId, false],
//         [adminAnswers[2].id, adminAnswers[2].answer, adminAnswers[2].userId, adminAnswers[2].questionId, false],
//         [userAnswers[0].id, userAnswers[0].answer, userAnswers[0].userId, userAnswers[0].questionId, false],
//         [userAnswers[1].id, userAnswers[1].answer, userAnswers[1].userId, userAnswers[1].questionId, false],
//         [userAnswers[2].id, userAnswers[2].answer, userAnswers[2].userId, userAnswers[2].questionId, false]
//     ];
// let query = "INSERT INTO questions(id, question) VALUES ?";
// params.questions = [
//     [uuid(), "What is your favorite class?"],
//     [uuid(), "When was your first dog born?"],
//     [uuid(), "What is your brother's name?"],
//     [uuid(), "What is your favorite color?"],
//     [uuid(), "What is your favorite food?"],
// ];

// initQueue.unshift((connection, initQueue) => {

//     let params = {};
//     params.adminUser = {
//         id: uuid(),
//         username: 'Harrison',
//         passHash: bcrypt.hashSync('tiger0485', 10),
//         isAdmin: true,
//         isBlocked: false
//     }

//     params.user = {
//         id: uuid(),
//         username: 'Horacio',
//         passHash: bcrypt.hashSync('tiger0485', 10),
//         isAdmin: false,
//         isBlocked: false
//     }

//     params.questions = [
//         [uuid(), "What is your favorite class?"],
//         [uuid(), "When was your first dog born?"],
//         [uuid(), "What is your brother's name?"],
//         [uuid(), "What is your favorite color?"],
//         [uuid(), "What is your favorite food?"],
//     ];

//     params.adminAnswers = [
//         {
//             id: uuid(),
//             questionId: params.questions[0][0],
//             userId: params.adminUser.id,
//             answer: "CS 744"
//         },
//         {
//             id: uuid(),
//             questionId: params.questions[1][0],
//             userId: params.adminUser.id,
//             answer: "2000"
//         },
//         {
//             id: uuid(),
//             questionId: params.questions[2][0],
//             userId: params.adminUser.id,
//             answer: "Leeroy"
//         }
//     ];

//     params.userAnswers = [
//         {
//             id: uuid(),
//             questionId: params.questions[2][0],
//             userId: params.user.id,
//             answer: "Kevin"
//         },
//         {
//             id: uuid(),
//             questionId: params.questions[3][0],
//             userId: params.user.id,
//             answer: "green"
//         },
//         {
//             id: uuid(),
//             questionId: params.questions[4][0],
//             userId: params.user.id,
//             answer: "apple pie"
//         }
//     ];
//     let next = initQueue.pop();
//     let query = "INSERT INTO questions(id, question) VALUES ?";
//     connection.query(query, [params.questions], (err, res, fields) => {
//         if (err) rollbackAndExit(connection, err);
//         next(connection, initQueue, params);
//     });
// });

// initQueue.unshift((connection, initQueue, params) => {
//     let adminUser = params.adminUser;
//     let user = params.user;
//     let next = initQueue.pop();
//     let query = "INSERT INTO users (id, username, passhash, is_admin, is_blocked, login_attempts) VALUES ?";
//     let values = [
//         [adminUser.id, adminUser.username, adminUser.passHash, adminUser.isAdmin, adminUser.isBlocked, 0],
//         [user.id, user.username, user.passHash, user.isAdmin, user.isBlocked, 0]
//     ];
//     connection.query(query, [values], (err, res, fields) => {
//         if (err) rollbackAndExit(connection, err);
//         next(connection, initQueue, params);
//     });
// });

// initQueue.unshift((connection, initQueue, params) => {
//     let next = initQueue.pop();
//     let adminAnswers = params.adminAnswers;
//     let userAnswers = params.userAnswers;
//     let query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id, incorrect_guess) VALUES ?";
//     let values = [
//         [adminAnswers[0].id, adminAnswers[0].answer, adminAnswers[0].userId, adminAnswers[0].questionId, false],
//         [adminAnswers[1].id, adminAnswers[1].answer, adminAnswers[1].userId, adminAnswers[1].questionId, false],
//         [adminAnswers[2].id, adminAnswers[2].answer, adminAnswers[2].userId, adminAnswers[2].questionId, false],
//         [userAnswers[0].id, userAnswers[0].answer, userAnswers[0].userId, userAnswers[0].questionId, false],
//         [userAnswers[1].id, userAnswers[1].answer, userAnswers[1].userId, userAnswers[1].questionId, false],
//         [userAnswers[2].id, userAnswers[2].answer, userAnswers[2].userId, userAnswers[2].questionId, false]
//     ];
//     connection.query(query, [values], (err, res, fields) => {
//         if (err) rollbackAndExit(connection, err);
//         next(connection, initQueue);
//     });
// });

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let id = 0;
    let idString = "";
    let values = [];
    for(id = 0; id < 100; id++) {
        idString = '' + id;
        while (idString.length < 2) {
            idString = "0" + idString;
        }
        values.push(['N' + idString, true]);
    }
    let query = "INSERT INTO nodeIds (id, isFree) VALUES ?";
    connection.query(query, [values], (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let id = 0;
    let idString = "";
    let values = [];
    for(id = 0; id < 100; id++) {
        idString = '' + id;
        while (idString.length < 2) {
            idString = "0" + idString;
        }
        values.push(['D' + idString, true]);
    }
    let query = "INSERT INTO nodeIds (id, isFree) VALUES ?";
    connection.query(query, [values], (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let id = 0;
    let idString = "";
    let values = [];
    for(id = 0; id < 100; id++) {
        idString = '' + id;
        while (idString.length < 2) {
            idString = "0" + idString;
        }
        values.push(['P' + idString, true]);
    }
    let query = "INSERT INTO patternIds (id, isFree) VALUES ?";
    connection.query(query, [values], (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let id = 0;
    let idString = "";
    let values = [];
    for(id = 0; id < 1000; id++) {
        idString = '' + id;
        while (idString.length < 3) {
            idString = "0" + idString;
        }
        values.push(['M' + idString, true]);
    }
    let query = "INSERT INTO messageIds (id, isFree) VALUES ?";
    connection.query(query, [values], (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    let id = 0;
    let idString = "";
    let values = [];
    for(id = 0; id < 100; id++) {
        idString = '' + id;
        while (idString.length < 2) {
            idString = "0" + idString;
        }
        values.push(['DN' + idString, true]);
    }
    let query = "INSERT INTO domainIds (id, isFree) VALUES ?";
    connection.query(query, [values], (err, res, fields) => {
        if (err) rollbackAndExit(connection, err);
        next(connection, initQueue);
    });
});

// ### TEST_DATA

initQueue.unshift((connection, initQueue) => {
    let next = initQueue.pop();
    fs.readFile( sqlData, 'utf8', (err, sqlScript) => {
        if (err) rollbackAndExit(connection, err);
        // next(connection, initQueue, sqlScript);
        executeScript(sqlScript, 0);
        function executeScript(script, queryStart) {
            let queryEnd = script.indexOf(';', queryStart);
            if(queryEnd < 1) {
                next(connection, initQueue);
            } else {
                let query = script.substring(queryStart, queryEnd);
                console.log(query);
                connection.query(query, (err) => {
                    if (err) rollbackAndExit(connection, err);
                    executeScript(script, queryEnd + 1);
                });
            }
        }
    });
});

// ### END TEST_DATA

initQueue.unshift((connection, initQueue) => {
    connection.commit((err) => {
        if (err) rollbackAndExit(connection, err);
        connection.release();
        console.log("Database values initialized");
        process.exit(0);
    });
});

function rollbackAndExit(connection, err) {
    connection.rollback(() => {
        console.error("Error: " + err.message);
        connection.release();
        throw err;
    });
}

let executeQueue = initQueue.pop();
executeQueue(undefined, initQueue);
