/*
 * All data from the database will be accessed through this module.
 * This is the only module that will query the database directly.
 */
const pool = require('./connect');
const uuid = require('uuid/v1');
const bcrypt = require('bcrypt');
const Error = require('../../data/error');
//import Error from '../../data/error';
const User = require('../../data/user');
const Question = require('../../data/question');
const Session = require('../../data/session');
const MAX_LOGIN_ATTEMPTS = 3;

/*
 * Returns an error or a session
 * Error codes:
 *  -1: Invalid sessionId
 *  -2: Invalid CSRF token
 *  -10: MySQL error
 * Callback arguments: (session: Session, error: Error)
 */
module.exports.getSession = (sessionId, csrfToken) => {
    let query = "SELECT * from sessions WHERE id = '" + sessionId + "'";
    pool.query(query, (err, results) => {
        if(err) {
            callback(undefined, new Error(err.message, -10));
            return;
        }
        if(results.length == 0) {
            callback(undefined, new Error("Session not found", -1));
            return;
        }
        if(csrfToken !== results[0].csrf) {
            callback(undefined, new Error("Invalid csrf token", -2));
            return;
        }
    });
}

/*
 * Returns an error or a session
 * Error codes:
 *  -1: Session already exists
 *  -10: MySQL error
 * Callback arguments: (session: Session, error: Error)
 */
module.exports.storeSession = (sessionId, csrfToken) => {
    let query = "SELECT * from sessions WHERE id = '" + sessionId + "'";
    pool.query(query, (err, results) => {
        if(err) {
            callback(undefined, new Error(err.message, -10));
            return;
        }
        if(results.length > 0) {
            callback(undefined, new Error("Session already exists", -1));
            return;
        }
        query = "INSERT INTO sessions(id, csrf) VALUES ?";
        let values = [
            [sessionId, csrfToken]
        ];
        pool.query(query, values, (err, result) => {
            if(err) {
                callback(undefined, new Error(err.message, -10));
                return;
            }
            if(result.affectedRows != 1) {
                callback(undefined, new Error("Only one row was supposed to be updated. Rows updated: " + result.affectedRows, -10));
                return;
            }
            callback(new Session(sessionId, csrfToken), undefined);
        });
    });
}

/*
 * Ensures a session is (or has been) deleted
 * Error codes:
 *  -10: MySQL error
 * Callback arguments: (error: Error)
 */
module.exports.deleteSession = (sessionId) => {
    let query = "DELETE from sessions WHERE id = '" + sessionId + "'";
    pool.query(query, (err, results) => {
        if(err) {
            callback(undefined, new Error(err.message, -10));
            return;
        }
        callback(undefined);
    });
}

/*
 * Returns an error or a user
 * Error codes:
 *      -1: Invalid id
 *      -10: MySQL error
 * Callback argments: (user: User, error: Error)
 */
module.exports.getUserById = (userId, callback) => {
    let query = "SELECT * from users WHERE id ='" + userId + "'";
    pool.query(query, (err, results, fields) => {
        if(err) {
            callback(undefined, new Error(err.message, -10));
            return;
        }
        if(fields.length == 0) {
            callback(undefined, new Error("User not found.", -1));
            return;
        }
        let user = new User(results[0].username, results[0].is_admin, results[0].is_blocked, results[0].login_attempts, results[0].id);
        callback(user, undefined);
    });
}

/*
 * Returns an error or a user
 * Tracks failed user login attempts
 * Blocks user and returns a -3 error when failed login attempts == MAX_LOGIN_ATTEMPTS
 * Error codes:
 *      -1: Invalid username
 *      -2: Invalid password
 *      -3: User is blocked
 *      -10: MySQL error
 * Callback argments: (user: User, error: Error)
 */
module.exports.getUserByLogin = (username, password, callback) => {
    let query = "SELECT * from users WHERE username ='" + username + "'";
    pool.query(query, (err, results) => {
        if(err) {
            callback(undefined, new Error(err.message, -10));
            return;
        }
        if(results.length == 0) {
            callback(undefined, new Error("User not found.", -1));
            return;
        }
        // if(results[0].login_attempts < 1) {
        //     //block user
        // }
        if(results[0].is_blocked) {
            callback(undefined, new Error("User is blocked.", -3));
            return;
        }
        //console.log('passhash: ' + passhash);
        bcrypt.compare(password, results[0].passhash, (err, res) => {
            if(res) {//successful login
                let user = new User(results[0].username, results[0].is_admin, results[0].is_blocked, results[0].login_attempts, results[0].id);
                setLoginAttempts(user.id, 0, (err) => {
                    if(err) {
                        callback(undefined, new Error(err.message, -10));
                        return;
                    }
                    user.loginAttempts = 0;
                    callback(user, undefined);
                });
            } else {
                if(results[0].login_attempts >= MAX_LOGIN_ATTEMPTS - 1) {//user just failed their last login attempt
                    //block user and reset failed attempts
                    this.setUserBlocked(results[0].id, true, (err) => {
                        if(err) {
                            callback(undefined, new Error(err.message, -10));
                            return;
                        }
                        setLoginAttempts(results[0].id, 0, (err) => {
                            if(err) {
                                callback(undefined, new Error(err.message, -10));
                                return;
                            }
                            callback(undefined, new Error("Login attempts exceeded, account has been blocked", -3));
                        });
                    });
                } else {
                    setLoginAttempts(results[0].id, results[0].login_attempts + 1, (err) => {
                        if(err) {
                            callback(undefined, new Error(err.message, -10));
                            return;
                        }
                        callback(undefined, new Error("Incorrect password. Remaining attempts: " + ( MAX_LOGIN_ATTEMPTS - 1 - results[0].login_attempts ) + '.', -2));
                    });
                }
            }
        });
    });
}

/*
 * Block or unblock a user depending on the block argument
 * Arguments: (userId: string, block: boolean, callback)
 * Error codes:
 *       -1: Invalid userid
 *      -10: MySQL error
 * Callback arguments: (error: Error)
 */
module.exports.setUserBlocked = (userId, block, callback) => {
    let isBlocked = 0;
    if(block) {
        isBlocked = 1;
    } else {
        isBlocked = 0;
    }
    let query = "UPDATE users SET is_blocked = " + isBlocked + " WHERE id = '" + userId + "'";
    pool.query(query, (err, result) => {
        if(err) {
            callback(new Error("MySQL Error trying to block or unblock user", -10));
            return;
        }
        if(result.affectedRows < 1) {
            callback(new Error("Tried to block or unblock invalid userId: " + userId, -1));
            return;
        }
        callback(undefined);
    })
}

/*
 * Set the ammount of login attempts the user has left
 * Arguments: (userId: string, block: boolean, callback)
 * Error codes:
 *       -1: Invalid userid
 *      -10: MySQL error
 * Callback arguments: (error: Error)
 */
let setLoginAttempts = (userId, attempts, callback) => {
    if(attempts < 0 || attempts > MAX_LOGIN_ATTEMPTS) {
        throw "Attempted to set an invalid number of login attempts: " + attempts;
    }
    let query = "UPDATE users SET login_attempts = " + attempts + " WHERE id = '" + userId + "'";
    pool.query(query, (err, result) => {
        if(err) {
            callback(new Error("MySQL Error trying to set login attempts", -10));
            return;
        }
        if(result.affectedRows < 1) {
            callback(new Error("Tried to set login attempts for an invalid userId: " + userId, -1));
            return;
        }
        callback(undefined);        
    });
}

/*
 * Returns a user's list of questions
 * Error codes:
 *      -10: MySQL error
 * Callback argments: (questions: Question[], error: Error)
 */
module.exports.getUserQuestions = (userId, callback) => {
    let query = "SELECT question, questions.id FROM questions JOIN security_answers ON QUESTIONS.ID = SECURITY_ANSWERS.FK_QUESTION_ID\
                    WHERE FK_USER_ID = '" + userId + "'";
    pool.query(query, (err, results) => {
        if(err) {
            callback(undefined, new Error(err.message, -10));
            return;
        }
        let questions = [];
        questions = results.map( (question) => {
            return new Question(question.question, question.id);
        });
        //console.log("THE QUESTIONS: " + JSON.stringify(questions), null, 4);
        callback(questions, undefined);
    });
}

/*
 * Returns a user's list of questions
 * Arguments: (userId: string, questions: { qid: string, answer: string }[], callback)
 * Error codes:
 *      -1: Invalid number of security questions
 *      -10: MySQL error
 * Callback argments: (error: Error)
 */
module.exports.setUserQuestionAnswers = (userId, questionAnswers, callback) => {
    if(questionAnswers.length != 3) {
        callback(new Error("Attempted to set an invalid amount of questions: " + questionAnswers.length, -1));
        return;
    }
    pool.getConnection((err, connection) => {
        if(err) {
            callback(new Error(err.message, -10));
            connection.release();
            return;
        }
        connection.beginTransaction((err) => {
            if(err) {
                callback(new Error(err.message, -10));
                connection.rollback(() => connection.release());
                return;
            }
            //let query = "DELETE FROM security_answers WHERE fk_user_id ='" + userId + "'";
            let query = "DELETE FROM security_answers WHERE fk_user_id ='" + userId + "'";
            connection.query(query, (err) => {
                if(err) {
                    callback(new Error(err.message, -10));
                    connection.rollback(() => connection.release());
                    return;
                }
                //let query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id) VALUES ?";
                query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id) VALUES ?";
                let values = [];
                questionAnswers.forEach( (q) => {
                    values.push( [uuid(), q.answer, userId, q.qid] );
                });
                console.log(JSON.stringify(values, null, 4));
                var queryVal = connection.query(query, [values], (err) => {
                    if(err) {
                        callback(new Error(err.message, -10));
                        connection.rollback(() => connection.release());
                        return;
                    }
                    connection.commit((err) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            callback(new Error(err.message, -10));
                            throw err;
                        }
                        callback(undefined);
                        connection.release();
                    });
                });
                console.log(queryVal.sql);
            });
        });
    });
}

/*
 * Returns a user's list of questions
 * Error codes:
 *       -1: Invalid user or question id
 *      -10: MySQL error
 * Callback argments: (answer: String, error: Error)
 */
module.exports.getAnswer = (userId, questionId, callback) => {
    let query = "SELECT answer FROM questions JOIN security_answers ON QUESTIONS.ID = SECURITY_ANSWERS.FK_QUESTION_ID\
                    WHERE FK_USER_ID = '" + userId + "' AND FK_QUESTION_ID ='" + questionId + "'";
    pool.query(query, (err, results) => {
        if(err) {
            callback(undefined, new Error(err.message, -10));
            return;
        }
        if(results.length == 0) {
            callback(undefined, new Error("Invalid user or question id", -1));
            return;
        }
        callback(results[0].answer, undefined);
    });
}
