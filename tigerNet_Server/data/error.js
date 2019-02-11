/* 
 * Error object that consists of a message string, and a status code number
 */
class Error {
    constructor(message, statusCode) {
        this.message = message;
        this.status = statusCode;
    }
}
module.exports = Error;