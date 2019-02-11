/*
 * Session object consisting of a session id with its corresponding csrf token
 */
class Session {
    constructor(sessionId, csrfToken) {
        this.session = sessionId,
        this.csrf = csrfToken
    }
}
module.exports = Session;