/*
 * All data from the database will be accessed through this module.
 * This is the only module that will query the database directly.
 */
const pool = require('./connect');
//const uuid = require('uuid/v1');
const bcrypt = require('bcrypt');
const Error = require('../../data/error');
//import Error from '../../data/error';
const User = require('../../data/user');
const Question = require('../../data/question');

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
        let user = new User(results[0].username, results[0].is_admin, results[0].is_blocked, results[0].id);
        callback(user, undefined);
    });
}

/*
 * Returns an error or a user
 * Error codes:
 *      -1: Invalid username
 *      -2: Invalid password
 *      -3: User is blocked
 *      -10: MySQL error
 * Callback argments: (user: User, error: Error)
 */
module.exports.getUserByLogin = (username, password, callback) => {
    let query = "SELECT * from users WHERE username ='" + username + "'";
    pool.query(query, (err, results, fields) => {
        console.log('login query result: ' + JSON.stringify(results, null, 4));
        if(err) {
            callback(undefined, new Error(err.message, -10));
            return;
        }
        if(fields.length == 0) {
            callback(undefined, new Error("User not found.", -1));
            return;
        }
        if(results[0].is_blocked) {
            callback(undefined, new Error("User is blocked.", -3));
            return;
        }
        //console.log('passhash: ' + passhash);
        bcrypt.compare(password, results[0].passhash, (err, res) => {
            if(res) {
                let user = new User(results[0].username, results[0].is_admin, results[0].is_blocked, results[0].id);
                callback(user, undefined);
            } else {
                callback(undefined, new Error("Invalid password", -2));
            }
        });
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
        callback(questions, undefined);
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