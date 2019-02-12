/*
 * Creates a User. If no id is provided, an id is generated
 */
const uuid = require('uuid/v1');
class User {
    constructor(username, isAdmin, isBlocked, loginAttempts, id) {
        this.id = id || uuid();
        this.username = username;
        this.isAdmin = isAdmin;
        this.isBlocked = isBlocked;
        this.loginAttempts = loginAttempts;
    }
}
module.exports = User;