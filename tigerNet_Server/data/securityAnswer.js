/*
 * Create a new Security Answer. If id is undefined or null, generate an id 
 */
const uuid = require('uuid/v1');
class SecurityAnswer {
    constructor(answer, userId, questionId, id) {
        this.id = id || uuid();
        this.answer = answer;
        this.userId = userId;
        this.questionId = questionId;
    }
}
module.exports = SecurityAnswer;