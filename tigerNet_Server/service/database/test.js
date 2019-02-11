const db = require('./db');
const User = require("../../data/user");
const Question = require("../../data/question");
const Error = require('../../data/error');

console.log('Horacio is attempting to login...');
db.getUserByLogin('Horacio', 'RpelioN2x', (user, err) => {
    if (err) {
        console.error(err.message);
        console.error('status: ' + err.status);
        throw err;
    }
    console.log('login result: ' + JSON.stringify(user, null, 4));
    console.log(user.username + ' has successfully logged in');
    console.log(JSON.stringify(user, null, 4));
    console.log();
    console.log('retrieving ' + user.username + "'s questions");
    db.getUserQuestions(user.id, (questions, err) => {
        if (err) {
            console.error(err.message);
            console.error('status: ' + err.status);
            throw err;
        }
        console.log('Successfully retrieved questions:');
        console.log(JSON.stringify(questions, null, 4));
        console.log();
        console.log('retrieving ' + user.username + "'s answer to question: " + questions[0].question);
        db.getAnswer(user.id, questions[0].id, (answer, err) => {
            if (err) {
                console.error(err.message);
                console.error('status: ' + err.status);
                throw err;
            }
            console.log('retrieved answer: ' + answer);
            console.log("retrieving invalid user's answer to question: " + questions[0].question);
            db.getAnswer("asdfasgaweraegfsdas", questions[0].id, (answer, err) => {
                if (err) {
                    console.log('invalid retrieval caught. Error object:');
                    console.log(JSON.stringify(err, null, 4));
                } else {
                    console.log("Test failed: successfull retrieval of invalid user's answer");
                    console.log("Invalid result object:");
                    console.log(JSON.stringify(answer, null, 4));
                    throw "test failed";
                }
                console.log('Harrison is attempting to login...');
                db.getUserByLogin('Harrison', 'tiger0485', (admin, err) => {
                    if (err) {
                        console.error(err.message);
                        console.error('status: ' + err.status);
                        throw err;
                    }
                    console.log('login result: ' + JSON.stringify(admin, null, 4));
                    console.log(admin.username + ' has successfully logged in');
                    console.log(JSON.stringify(admin, null, 4));
                    console.log();
                    console.log('retrieving ' + admin.username + "'s questions");
                    db.getUserQuestions(admin.id, (questions, err) => {
                        if (err) {
                            console.error(err.message);
                            console.error('status: ' + err.status);
                            throw err;
                        }
                        console.log('Successfully retrieved questions:');
                        console.log(JSON.stringify(questions, null, 4));
                        console.log();
                        console.log('retrieving ' + admin.username + "'s answer to question: " + questions[0].question);
                        db.getAnswer(admin.id, questions[0].id, (answer, err) => {
                            if (err) {
                                console.error(err.message);
                                console.error('status: ' + err.status);
                                throw err;
                            }
                            console.log('retrieved answer: ' + answer);
                            console.log("retrieving invalid user's answer to question: " + questions[0].question);
                            db.getAnswer(user.id, questions[0].id, (answer, err) => {
                                if (err) {
                                    console.log('invalid retrieval caught. Error object:');
                                    console.log(JSON.stringify(err, null, 4));
                                    return;
                                } else {
                                    console.log("Test failed: successfull retrieval of invalid user's answer");
                                    console.log("Invalid result object:");
                                    console.log(JSON.stringify(answer, null, 4));
                                    throw "test failed";
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});