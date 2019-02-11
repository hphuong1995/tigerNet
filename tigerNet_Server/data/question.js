/*
 * Create a new Question. If id is not provided, one is generated
 */
const uuid = require('uuid/v1');
class Question {
    constructor(question, id) {
        this.id = id || uuid();
        this.question = question;
    }
}
module.exports = Question;