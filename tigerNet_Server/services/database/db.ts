import bcrypt from "bcrypt";
import { MysqlError, PoolConnection, Query } from "mysql";
import { connect } from "net";
import { resolve } from "url";
import uuid from "uuid/v1";
import { Connector } from "../../data/connector";
import { Domain } from "../../data/domain";
import { Err } from "../../data/err";
import { Network } from "../../data/network";
import { Node } from "../../data/node";
import { Pattern } from "../../data/pattern";
import { Question } from "../../data/question";
import { SecurityAnswer } from "../../data/securityAnswer";
import { Session } from "../../data/session";
import { User } from "../../data/user";
// import { conn } from "./connect";
import pool from "./connect";

pool.getConnection((err: MysqlError, connection: PoolConnection) => {
    if (err) {
        throw err;
    }
    conn.releaseConnection(connection);
});

const MAX_LOGIN_ATTEMPTS: number = 3;
// let poolHolder: any = pool;
let conn: any = pool;

// interface IDB {
//     getSession(sessionId: string, csrfToken: string,
//                callback: (session: Session, err: Err) => void): void;
//     storeSession(session: Session, callback: (session: Session, err: Err) => void): void;
//     deleteSession(sessionId: string, callback: (err: Err) => void): void;
//     getUserById(userId: string, callback: (user: User, err: Err) => void): void;
//     getUserByLogin(username: string, password: string,
//                    callback: (user: User, err: Err) => void): void;
//     setUserBlocked(userId: string, block: boolean, callback: (err: Err) => void): void;
//     setLoginAttempts(userId: string, attempts: number, callback: (err: Err) => void): void;
//     getUserQuestions(userId: string, callback: (questions: Question[], err: Err) => void): void;
//     getUserUnguessedQuestion(userId: string, callback: (question: Question, err: Err) => void): void;
//     setUserQuestionAnswers(
//         userId: string,
//         questionAnswers: Array<{ qid: string, answer: string, guessedWrong: boolean }>,
//         callback: (err: Err) => void): void;
//     getAnswer(userId: string, questionId: string,
//               callback: (answer: SecurityAnswer, err: Err) => void): void;
//     setFailedGuessOnAnswer(answerId: string, inCorrectGuess: boolean, callback: (err: Err) => void): void;
//     setFailedGuessOnAllAnswers(userId: string, inCorrectGuess: boolean, callback: (err: Err) => void): void;
// }

interface IDbNode {
    is_active: boolean;
    is_connector: boolean;
    id: string;
    fk_pattern_id: string;
}

interface IDbConnector {
    fk_node_id: string;
    fk_target_id: string;
}

class DB {

    constructor() { return; }

    /*
     * Returns an error or a session
     * Error codes:
     *  -1: Invalid sessionId
     *  -2: Invalid CSRF token
     *  -10: MySQL error
     * Callback arguments: (session: Session, error: Error)
     */
    public getSession(sessionId: string, csrfToken: string,
        callback: (session: Session, err: Err) => void): void {
        const query: string = "SELECT * from sessions WHERE id = '" + sessionId + "'";
        console.log(query);
        conn.query(query, (err: MysqlError, results: any[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            if (results.length === 0) {
                callback(undefined, new Err("Session not found", -1));
                return;
            }
            if (csrfToken !== results[0].csrf) {
                callback(undefined, new Err("Invalid csrf token", -2));
                return;
            }
            callback(new Session(results[0].id, results[0].csrf), undefined);
        });
    }

    /*
     * Returns an error or a session
     * Error codes:
     *  -1: Session already exists
     *  -10: MySQL error
     * Callback arguments: (session: Session, error: Error)
     */
    public storeSession(session: Session, callback: (session: Session, err: Err) => void): void {
        let query: string = "SELECT * from sessions WHERE id = '" + session.sid + "'";
        conn.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            if (results.length > 0) {
                callback(undefined, new Err("Session already exists", -1));
                return;
            }
            query = "INSERT INTO sessions(id, csrf) VALUES ?";
            const values: string[][] = [
                [session.sid, session.csrf]
            ];
            conn.query(query, [values], (err: MysqlError, result: any) => {
                if (err) {
                    callback(undefined, new Err(err.message, -10));
                    return;
                }
                if (result.affectedRows !== 1) {
                    callback(undefined, new Err("Only one row was supposed to be updated. Rows updated: " +
                        result.affectedRows, -10));
                    return;
                }
                callback(session, undefined);
            });
        });
    }

    /*
     * Ensures a session is (or has been) deleted
     * Error codes:
     *  -10: MySQL error
     * Callback arguments: (error: Error)
     */
    public deleteSession(sessionId: string, callback: (err: Err) => void): void {
        const query: string = "DELETE from sessions WHERE id = '" + sessionId + "'";
        conn.query(query, (err: MysqlError) => {
            if (err) {
                callback(new Err(err.message, -10));
                return;
            }
            callback(undefined);
        });
    }

    public startTransaction(callback: (err: Err) => void): void {
        pool.getConnection((err: MysqlError, connection: PoolConnection) => {
            if (err) {
                callback(new Err(err.message, -10));
                connection.release();
                return;
            }
            conn = connection;
            connection.beginTransaction((err: MysqlError) => {
                if (err) {
                    callback(new Err(err.message, -10));
                    connection.rollback(() => connection.release());
                    return;
                }
                callback(undefined);
            });
        });
    }

    public rollBackTransaction(callback: (err: Err) => void): void {
        conn.rollback((err: MysqlError) => {
            if (err) {
                callback(new Err(err.message, -10));
            }
            conn.release();
            conn = pool;
            callback(undefined);
        });
    }

    public commitTransaction(callback: (err: Err) => void): void {
        conn.commit((err: MysqlError) => {
            if (err) {
                conn.rollback(() => conn.release());
                conn = pool;
                callback(new Err(err.message, -10));
                return;
            }
            conn.release();
            conn = pool;
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
    public getUserById(userId: string, callback: (user: User, err: Err) => void): void {
        const query: string = "SELECT * from users WHERE id ='" + userId + "'";
        conn.query(query, (err: MysqlError, results: any, fields: any[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            if (fields.length === 0) {
                callback(undefined, new Err("User not found.", -1));
                return;
            }
            const user = new User(results[0].username, results[0].is_admin, results[0].is_blocked, results[0].id);
            callback(user, undefined);
        });
    }

    /*
     * Returns an error or a user
     * Tracks failed user login attempts
     * Error codes:
     *      -1: Invalid username
     *      -2: Invalid password
     *      -10: MySQL error
     * Callback argments: (user: User, error: Error)
     */
    public getUserByLogin(username: string, password: string,
        callback: (user: User, err: Err) => void): void {
        const query: string = "SELECT * from users WHERE username ='" + username + "'";
        conn.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            if (results.length === 0) {
                callback(undefined, new Err("User not found.", -1));
                return;
            }

            bcrypt.compare(password, results[0].passhash, (err: Error, res: boolean) => {
                if (res) {// successful login
                    const user: User = new User(
                        results[0].username,
                        results[0].is_admin,
                        results[0].is_blocked,
                        results[0].id
                    );
                    callback(user, undefined);
                } else {
                    callback(undefined, new Err("Incorrect password.", -2));
                }
            });
        });
    }

    /*
     * Get all users
     * Error codes:
     *      -10: MySQL error
     * Callback arguments: (error: Error)
     */
    public getAllUsers(callback: (users: User[], err: Err) => void): void {
        const query: string = "SELECT * from users";
        conn.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
            }
            const users: User[] = results.map((res: any) => {
                return new User(res.username, res.is_admin, res.is_blocked, res.id);
            });
            callback(users, undefined);
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
    public setUserBlocked(userId: string, block: boolean, callback: (err: Err) => void): void {
        const query = "UPDATE users SET is_blocked = " + block + " WHERE id = '" + userId + "'";
        conn.query(query, (err: MysqlError, result: any) => {
            if (err) {
                callback(new Err("MySQL Error trying to block or unblock user", -10));
                return;
            } else if (result.affectedRows < 1) {
                callback(new Err("Tried to block or unblock invalid userId: " + userId, -1));
                return;
            } else if (!block) {
                this.setFailedGuessOnAllAnswers(userId, false, (err: Err) => {
                    if (err) {
                        callback(err);
                    }
                    callback(undefined);
                    return;
                });
            } else {
                callback(undefined);
            }
        });
    }

    /*
     * Set the ammount of login attempts the user has left
     * Arguments: (userId: string, attempts: number, callback)
     * Error codes:
     *       -1: Invalid userid
     *      -10: MySQL error
     * Callback arguments: (error: Error)
     */
    public setLoginAttempts(userId: string, attempts: number, callback: (err: Err) => void): void {
        if (attempts < 0 || attempts > MAX_LOGIN_ATTEMPTS) {
            throw new Error("Attempted to set an invalid number of login attempts: " + attempts);
        }
        const query: string = "UPDATE users SET login_attempts = " + attempts + " WHERE id = '" + userId + "'";
        conn.query(query, (err: MysqlError, result: any) => {
            if (err) {
                callback(new Err("MySQL Error trying to set login attempts", -10));
                return;
            }
            if (result.affectedRows < 1) {
                callback(new Err("Tried to set login attempts for an invalid userId: " + userId, -1));
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
    public getUserQuestions(userId: string, callback: (questions: Question[], err: Err) => void): void {
        const query: string = "SELECT question, questions.id security_answers.incorrect_guess\
                        FROM questions JOIN security_answers ON QUESTIONS.ID = SECURITY_ANSWERS.FK_QUESTION_ID\
                        WHERE FK_USER_ID = '" + userId + "'";
        conn.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            let questions: Question[] = [];
            questions = results.map((question: any) => {
                return new Question(question.question, question.id, question.incorrect_guess);
            });
            callback(questions, undefined);
        });
    }

    /*
     * Returns a random unguessed question from a user
     * Error codes:
     *      -1: User has no unguessed questions
     *      -10: MySQL error
     * Callback argments: (question: Question, error: Error)
     */
    public getUserUnguessedQuestion(userId: string, callback: (question: Question, err: Err) => void): void {
        const query: string = "SELECT question, questions.id, security_answers.incorrect_guess\
                        FROM questions JOIN security_answers ON QUESTIONS.ID = SECURITY_ANSWERS.FK_QUESTION_ID\
                        WHERE FK_USER_ID = '" + userId + "'\
                        AND security_answers.incorrect_guess = 0";
        conn.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            if (results.length === 0) {
                callback(undefined, new Err("All security questions have been guessed wrong.", -1));
                return;
            }
            const rand: number = Math.floor(Math.random() * results.length);
            callback(new Question(results[rand].question, results[rand].id, results[rand].incorrect_guess), undefined);
        });
    }

    /*
     * Sets a user's answers to their questions
     * Arguments: (userId: string, questions: { qid: string, answer: string, guessedWrong: boolean }[], callback)
     * Error codes:
     *      -1: Invalid number of security questions
     *      -10: MySQL error
     * Callback argments: (error: Error)
     */
    public setUserQuestionAnswers(userId: string,
        questionAnswers: Array<{ qid: string, answer: string, guessedWrong: boolean }>,
        callback: (err: Err) => void): void {
        if (questionAnswers.length !== 3) {
            callback(new Err("Attempted to set an invalid amount of questions: " + questionAnswers.length, -1));
            return;
        }
        pool.getConnection((err: MysqlError, connection: PoolConnection) => {
            if (err) {
                callback(new Err(err.message, -10));
                connection.release();
                return;
            }
            connection.beginTransaction((err: MysqlError) => {
                if (err) {
                    callback(new Err(err.message, -10));
                    connection.rollback(() => connection.release());
                    return;
                }
                // let query = "DELETE FROM security_answers WHERE fk_user_id ='" + userId + "'";
                let query: string = "DELETE FROM security_answers WHERE fk_user_id ='" + userId + "'";
                connection.query(query, (err: MysqlError) => {
                    if (err) {
                        callback(new Err(err.message, -10));
                        connection.rollback(() => connection.release());
                        return;
                    }
                    // let query = "INSERT INTO security_answers (id, answer, fk_user_id, fk_question_id) VALUES ?";
                    query = "INSERT INTO security_answers\
                        (id, answer, fk_user_id, fk_question_id, incorrect_guess) VALUES ?";
                    const values: any[][] = [];
                    questionAnswers.forEach((q) => {
                        values.push([uuid(), q.answer, userId, q.qid, q.guessedWrong]);
                    });
                    // console.log(JSON.stringify(values, null, 4));
                    const queryVal: Query = connection.query(query, [values], (err: MysqlError) => {
                        if (err) {
                            callback(new Err(err.message, -10));
                            connection.rollback(() => connection.release());
                            return;
                        }
                        connection.commit((err: MysqlError) => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                callback(new Err(err.message, -10));
                                return;
                            }
                            callback(undefined);
                            connection.release();
                        });
                    });
                    // console.log(queryVal.sql);
                });
            });
        });
    }

    /*
     * Returns a user's answer object to the specified question
     * Error codes:
     *       -1: Invalid user or question id
     *      -10: MySQL error
     * Callback argments: (answer: SecurityAnswer, error: Error)
     */
    public getAnswer(userId: string, questionId: string,
        callback: (answer: SecurityAnswer, err: Err) => void): void {
        const query: string = "SELECT answer, security_answers.id FROM questions JOIN security_answers\
                        ON QUESTIONS.ID = SECURITY_ANSWERS.FK_QUESTION_ID\
                        WHERE FK_USER_ID = '" + userId + "' AND FK_QUESTION_ID ='" + questionId + "'";
        console.log(query);
        conn.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            if (results.length === 0) {
                callback(undefined, new Err("Invalid user or question id", -1));
                return;
            }
            callback(new SecurityAnswer(results[0].answer, userId, questionId, results[0].id), undefined);
        });
    }

    /*
     * Sets an answer's incorrect guess value to the specified boolean
     * Arguments: (answerId: string, correctGuess: boolean, callback)
     * Error codes:
     *       -1: Invalid answerId
     *      -10: MySQL error
     * Callback argments: (error: Error)
     */
    public setFailedGuessOnAnswer(answerId: string, inCorrectGuess: boolean, callback: (err: Err) => void): void {
        const query: string = "UPDATE security_answers SET incorrect_guess = " + inCorrectGuess +
            " WHERE id = '" + answerId + "'";
        console.log(query);
        conn.query(query, (err: MysqlError, result: any) => {
            if (err) {
                callback(new Err(err.message, -10));
                return;
            }
            if (result.affectedRows < 1) {
                callback(new Err("Invalid answerId", -1));
                return;
            }
            callback(undefined);
        });
    }

    /*
     * Sets all of a user's answers incorrect guess values to the specified boolean
     * Arguments: (answerId: string, correctGuess: boolean, callback)
     * Error codes:
     *       -1: Invalid userId or answerId
     *      -10: MySQL error
     * Callback argments: (error: Error)
     */
    public setFailedGuessOnAllAnswers(userId: string, inCorrectGuess: boolean, callback: (err: Err) => void): void {
        const query: string = "UPDATE security_answers SET incorrect_guess = " + inCorrectGuess +
            " WHERE fk_user_id = '" + userId + "'";
        conn.query(query, (err: MysqlError, result: any) => {
            if (err) {
                callback(new Err(err.message, -10));
                return;
            }
            if (result.affectedRows < 1) {
                callback(new Err("Invalid userId or answerId", -1));
                return;
            }
            callback(undefined);
        });
    }

    /*
     * Execute queries inside of a transaction
     * Parameters:
     *     lockType: string ( 'READ' | 'WRITE' )
     *     tableName: string - table to lock
     * Error codes:
     *       -1: Invalid lock type
     *      -10: MySQL error
     */
    public transaction(args: any,
        queries: (connection: PoolConnection, args: any,
            callback: (err: Err, results: any) => void) => void,
        transactionCallback: (results: any, err: Err) => void): void {
        let queryResults: any;
        pool.getConnection((err: MysqlError, connection: PoolConnection) => {
            if (err) {
                transactionCallback(undefined, new Err(err.message, -10));
                connection.release();
                return;
            }
            connection.beginTransaction((err: MysqlError) => {
                if (err) {
                    transactionCallback(undefined, new Err(err.message, -10));
                    connection.rollback(() => connection.release());
                    return;
                }
                queries(connection, args, (err: Err, results: any) => {
                    if (err) {
                        transactionCallback(undefined, new Err(err.message, -10));
                        connection.rollback(() => connection.release());
                        return;
                    }
                    queryResults = results;
                    connection.commit((err: MysqlError) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            transactionCallback(undefined, new Err(err.message, -10));
                            return;
                        }
                        transactionCallback(queryResults, undefined);
                        connection.release();
                    });
                });
            });
        });
    }

    /*
     * Creates an empty pattern, stores it in the database,
     * and returns it in the callback
     */
    public storeNewDomain(callback: (domainId: string, err: Err) => void): void {
        this.transaction(undefined, this.storeNewDomainTransaction,
            (results: any, err: Err) => {
                if (err) {
                    callback(undefined, err);
                } else {
                    callback(results as string, undefined);
                }
            });
    }

    /*
     * Creates an empty pattern, stores it in the database,
     * and returns it in the callback
     */
    public storeNewPattern(domainId: string, callback: (patternId: string, err: Err) => void): void {
        db.getDomainNode(domainId, (err: Err, domainNode: Node) => {
            if (err) {
                callback(undefined, err);
                return;
            }
            this.transaction({domainId}, this.storeNewPatternTransaction,
                (results: any, err: Err) => {
                    if (err) {
                        callback(undefined, err);
                    } else {
                        callback(results as string, undefined);
                    }
                });
        });
    }

    /*
     * Create a new node from the given parameters and add it into the database.
     * The new node is returned in the callback
     *
     * ***THIS METHOD DOES NOT VERIFY THE INTEGRITY OF THE NETWORK AFTER ITS COMPLETION***
     *
     * Error codes:
     *     -1: Invalid lock type
     *     10: MySQL error
     */
    public addNode(isActive: boolean, isConnector: boolean, patternId: string, domainId: string,
        callback: (node: Node, err: Err) => void): void {
        const args: any = {};
        args.isActive = isActive;
        args.isConnector = isConnector;
        args.patternId = patternId;
        args.domainId = domainId;
        this.transaction(args,
            this.addNodeTransaction.bind(this), (results: any, err: Err) => {
                if (err) {
                    callback(undefined, err);
                    return;
                }
                callback(results as Node, undefined);
            }
        );
    }

    /*
     * Connects two nodes
     * PRE: Node ids must be valid nodes
     *
     * ***THIS METHOD DOES NOT VERIFY THE INTEGRITY OF THE NETWORK AFTER ITS COMPLETION***
     *
     * Error codes:
     *     -1: invalid node id(s)
     *     -2: attempted to create connection fron non connector node to a node in a different pattern
     *     -3: attempted to create connection that already exists
     *     -10: MySQL error
     */
    public addConnection(nodeId: string, targetId: string, callback: (err: Err, connector: Connector) => void): void {
        // throw new Error("Make sure connection is not already added - this includes the inverse of the pattern.");
        // example nodeId = N06, targetId = N07 is equivalent to nodeId = N07, targetId = N06
        let query: string = "SELECT * FROM NODES WHERE id = '" + nodeId + "' OR id = '" + targetId + "'";
        console.log(query);
        conn.query(query, (err: MysqlError, results: IDbNode[]) => {
            if (err) {
                callback(new Err(err.message, -10), undefined);
                return;
            }
            if (results.length < 2) {
                callback(new Err("Attempted to add connection with invalid node id(s)", -1), undefined);
                return;
            }
            const node: IDbNode = results[0];
            const target: IDbNode = results[1];
            // connected nodes must be in the same pattern unless they are both connector nodes
            if (!node.is_connector || !target.is_connector) {
                if (!(node.fk_pattern_id === target.fk_pattern_id)) {
                    if (!node.id.match(/d.*/i) && !target.id.match(/d.*/i)) {
                        callback(new Err("Attempted to create connection from\
 non connector node to a node in a different pattern", -2), undefined);
                        return;
                    }
                }
            }

            query =
                "SELECT id FROM node_connections\
                WHERE (fk_node_id = '" + nodeId + "' AND fk_target_id = '" + targetId + "')\
                OR (fk_node_id = '" + targetId + "' AND fk_target_id = '" + nodeId + "')";
            conn.query(query, (err: MysqlError, results: any) => {
                if (err) {
                    callback(new Err(err.message, -10), undefined);
                    return;
                }
                if (results.length > 0) {
                    callback(new Err("Attempted to create connection that already exists", -3), undefined);
                    return;
                }
                const values: string[][] = [
                    [nodeId, targetId]
                ];
                query = "INSERT INTO node_connections (fk_node_id, fk_target_id) VALUES ?";
                conn.query(query, [values], (err: MysqlError) => {
                    if (err) {
                        callback(new Err(err.message, -10), undefined);
                        return;
                    }
                    callback(undefined, new Connector(nodeId, targetId));
                });
            });
        });
    }

    /*
     * Adds many connections into the database. Same effect of calling addConnection for
     * each connector.
     *
     * ***THIS METHOD DOES NOT VERIFY THE INTEGRITY OF THE NETWORK AFTER ITS COMPLETION***
     *
     * Error codes:
     *     -1: invalid node id(s)
     *     -2: attempted to create connection fron non connector node to a node in a different pattern
     *     -3: attempted to create connection that already exists
     *     -10: MySQL error
     */
    public addConnections(connectors: Connector[], callback: (err: Err) => void): void {
        const promises: Array<Promise<any>> = connectors.map((connector: Connector) => {
            return new Promise((resolve: (connector: Connector) => void, reject: (err: Err) => void) => {
                this.addConnection(connector.id, connector.targetId, (err: Err, connector: Connector) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(connector);
                });
            });
        });
        Promise.all(promises).then((result: any[]) => {
            console.log("promise chain completed");
            callback(undefined);
        }, (err: any) => {
            console.log(JSON.stringify("reject: " + err));
            callback(err);
        }).catch((err: any) => {
            console.log(JSON.stringify("catch: " + err));
            callback(err);
        });
    }

    /*
     * Gets a pattern by its id
     * Error codes:
     *       -1: Invalid pattern id(s)
     *      -10: MySQL error
     */
    public getPattern(patternId: string, callback: (pattern: Pattern, err: Err) => void): void {
        this.getPatterns([patternId], (patterns: Pattern[], err: Err) => {
            if (err) {
                callback(undefined, err);
                return;
            }
            if (patterns.length < 1) {
                callback(undefined, new Err("Error retrieving pattern", -1));
                return;
            }
            callback(patterns[0], undefined);
        });
    }

    /*
     * Returns a list of patterns from a list of pattern ids
     * Error codes:
     *       -1: Invalid node id(s)
     *      -10: MySQL error
     */
    public getPatterns(patternIds: string[], callback: (patterns: Pattern[], err: Err) => void): void {
        const fullPatterns: Pattern[] = [];
        const promises: Array<Promise<any>> = patternIds.map((pid: string) => {
            return new Promise((resolve: (nodes: Node[]) => void, reject: (err: Err) => void) => {
                this.getNodesByPatternId(pid, (nodes: Node[], err: Err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.getConnectionsByPatternId(pid, (connectors: Connector[], err: Err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        fullPatterns.push(new Pattern(pid, nodes, connectors));
                        resolve(nodes);
                    });
                });
            });
        });
        Promise.all(promises).then((result: any[]) => {
            console.log("promise chain completed");
            callback(fullPatterns, undefined);
        }, (err: any) => {
            console.log(JSON.stringify("reject: " + err));
            callback(undefined, err);
        }).catch((err: any) => {
            console.log(JSON.stringify("catch: " + err));
            callback(undefined, err);
        });
    }

    /*
     * Gets all patterns
     * Error codes:
     *      -10: MySQL error
     */
    public getAllPatterns(callback: (patterns: Pattern[], err: Err) => void): void {
        const query: string = "SELECT * FROM patterns";
        conn.query(query, (err: MysqlError, results: Array<{ id: string }>) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            const patternIds: string[] = results.map((r) => r.id);
            db.getPatterns(patternIds, callback);
        });
        return;
    }

    /*
     * Gets all patterns in domain
     * Error codes:
     *      -10: MySQL error
     */
    public getAllPatternsInDomain(domainId: string, callback: (patterns: Pattern[], err: Err) => void): void {
        const query: string = "SELECT * FROM patterns WHERE fk_domain_id = '" + domainId + "'";
        conn.query(query, (err: MysqlError, results: Array<{ id: string }>) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            const patternIds: string[] = results.map((r) => r.id);
            db.getPatterns(patternIds, callback);
        });
        return;
    }

    /*
     * Gets a node by its id
     * Error codes:
     *       -1: Invalid node id(s)
     *      -10: MySQL error
     */
    public getNode(nodeId: string, callback: (node: Node, err: Err) => void): void {
        this.getNodes([nodeId], (nodes: Node[], err: Err) => {
            if (err) {
                callback(undefined, err);
                return;
            }
            if (nodes.length < 1) {
                callback(undefined, new Err("No nodes found", -1));
                return;
            }
            callback(nodes[0], undefined);
        });
    }

    /*
     * Gets a list of nodes from a list of ids
     * Error codes:
     *       -1: Invalid node id(s)
     *      -10: MySQL error
     */
    public getNodes(nodeIds: string[], callback: (nodes: Node[], err: Err) => void): void {
        if (nodeIds.length === 0) {
            callback([], undefined);
            return;
        }
        const query: string = "SELECT * FROM nodes WHERE id IN (?)";
        conn.query(query, [nodeIds], (err: MysqlError, results: IDbNode[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            if (results.length < nodeIds.length) {
                callback(undefined, new Err("Invalid node id(s)", -1));
                return;
            }
            const nodes: Node[] = results.map((n) => new Node(n.is_active, n.is_connector, n.id));
            callback(nodes, undefined);
        });
    }

    /*
     * Gets a list of nodes from a list of ids
     * Error codes:
     *       -1: Invalid node id(s)
     *      -10: MySQL error
     */
    public getNodesByPatternId(patternId: string, callback: (nodes: Node[], err: Err) => void): void {
        const query: string = "SELECT * FROM nodes WHERE fk_pattern_id = '" + patternId + "'";
        conn.query(query, (err: MysqlError, results: IDbNode[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            const nodes: Node[] = results.map((n) => new Node(n.is_active, n.is_connector, n.id));
            callback(nodes, undefined);
        });
    }

    /*
     * Gets the domain node of a domain
     * Error codes:
     *       -1: domain node not found
     *      -10: MySQL error
     */
    public getDomainNode(domainId: string, callback: (err: Err, node: Node) => void): void {
        const query: string = "SELECT * FROM nodes WHERE fk_domain_id = '" + domainId + "'";
        conn.query(query, (err: MysqlError, results: IDbNode[]) => {
            if (err) {
                callback(new Err(err.message, -10), undefined);
            } else if (results.length === 0) {
                callback(new Err("domain node not found for the specified domain: " + domainId, -1), undefined);
            } else {
                callback(undefined, new Node(results[0].is_active, results[0].is_connector, results[0].id));
            }
        });
    }

    /*
     * Gets all INTERNAL connections within a pattern
     * Error codes:
     *      -10: MySQL error
     */
    public getConnectionsByPatternId(patternId: string, callback: (connectors: Connector[], err: Err) => void): void {
        const query: string =
            "SELECT DISTINCT fk_node_id, fk_target_id\
            FROM nodes JOIN node_connections\
            ON (nodes.id = fk_node_id OR nodes.id = fk_target_id)\
            AND nodes.is_connector = 0\
            WHERE fk_pattern_id = '" + patternId + "'";
        console.log(query);
        conn.query(query, (err: MysqlError, results: IDbConnector[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            const connectors: Connector[] = results.map((c) => new Connector(c.fk_node_id, c.fk_target_id));
            callback(connectors, undefined);
        });
    }

    /*
     * Gets all connections between connector nodes
     * Error codes:
     *      -10: MySQL error
     */
    public getPatternToPatternConnections(callback: (connectors: Connector[], err: Err) => void): void {
        const query: string =
            "SELECT DISTINCT fk_node_id, fk_target_id\
                FROM node_connections JOIN nodes\
                ON (nodes.id = fk_node_id OR nodes.id = fk_target_id)\
                AND nodes.is_connector = 1\
                WHERE fk_target_id IN\
                    (SELECT id FROM nodes WHERE is_connector = 1)\
                AND fk_node_id IN\
                    (SELECT id FROM nodes WHERE is_connector = 1)";
        conn.query(query, (err: MysqlError, results: IDbConnector[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            const connectors: Connector[] = results.map((res) => new Connector(res.fk_node_id, res.fk_target_id));
            callback(connectors, undefined);
        });
    }

    /*
     * Gets all connections between connector nodes
     * Error codes:
     *      -10: MySQL error
     */
    public getPatternToPatternConnectionsInDomain(domainId: string,
        callback: (connectors: Connector[], err: Err) => void): void {
        const query: string =
            "SELECT DISTINCT fk_node_id, fk_target_id\
                FROM node_connections JOIN nodes\
                ON (nodes.id = fk_node_id OR nodes.id = fk_target_id)\
                AND nodes.is_connector = 1\
                WHERE fk_target_id IN\
                    (SELECT id FROM nodes WHERE is_connector = 1)\
                AND fk_node_id IN\
                    (SELECT id FROM nodes WHERE is_connector = 1)\
                AND fk_pattern_id IN\
                    (SELECT id FROM patterns WHERE fk_domain_id = '" + domainId + "')";
        console.log(query);
        conn.query(query, (err: MysqlError, results: IDbConnector[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            const connectors: Connector[] = results.map((res) => new Connector(res.fk_node_id, res.fk_target_id));
            callback(connectors, undefined);
        });
    }

    /*
     * Gets all connections between connector nodes and the domain
     * node in the given domainId
     * Error codes:
     *      -10: MySQL error
     */
    public getPatternToDomainNodeConnectionsByDomain(domainId: string,
        callback: (connectors: Connector[], err: Err) => void): void {
        const query: string =
        "SELECT fk_node_id, fk_target_id\
            FROM nodes JOIN node_connections\
            ON fk_node_id = nodes.id OR fk_target_id = nodes.id\
            WHERE fk_domain_id = '" + domainId + "'\
            AND (fk_node_id LIKE 'D%' XOR fk_target_id LIKE 'D%')\
            AND (fk_node_id in (SELECT id FROM nodes WHERE is_connector = 1)\
                XOR fk_target_id IN (SELECT id FROM nodes WHERE is_connector = 1))\
        ";
        conn.query(query, (err: MysqlError, results: IDbConnector[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            const connectors: Connector[] = results.map((res) => new Connector(res.fk_node_id, res.fk_target_id));
            callback(connectors, undefined);
        });
    }

    /*
     * Gets all connections between connector nodes and the domain
     * node in the given domainId
     * Error codes:
     *      -10: MySQL error
     */
    // public getAllConnectionsInDomain(domainId: string,
    //     callback: (connectors: Connector[], err: Err) => void): void {
    //     const query: string = "";
    //     // "SELECT fk_node_id, fk_target_id\
    //     //     FROM nodes JOIN node_connections\
    //     //     ON fk_node_id = nodes.id OR fk_target_id = nodes.id\
    //     //     WHERE fk_domain_id = '" + domainId + "'\
    //     //     AND (fk_node_id LIKE 'D%' XOR fk_target_id LIKE 'D%')\
    //     //     AND (fk_node_id in (SELECT id FROM nodes WHERE is_connector = 1)\
    //     //         XOR fk_target_id IN (SELECT id FROM nodes WHERE is_connector = 1))\
    //     // ";
    //     conn.query(query, (err: MysqlError, results: IDbConnector[]) => {
    //         if (err) {
    //             callback(undefined, new Err(err.message, -10));
    //             return;
    //         }
    //         const connectors: Connector[] = results.map((res) => new Connector(res.fk_node_id, res.fk_target_id));
    //         callback(connectors, undefined);
    //     });
    // }

    /*
     * Gets all connections between connector nodes and the given domain node
     * Error codes:
     *      -10: MySQL error
     */
    public getPatternToDomainNodeConnections(domainNodeId: string,
        callback: (connectors: Connector[], err: Err) => void): void {
        const query: string =
        "SELECT DISTINCT fk_node_id, fk_target_id\
            FROM nodes JOIN node_connections\
            ON fk_node_id = nodes.id OR fk_target_id = nodes.id\
            WHERE (fk_node_id = '" + domainNodeId + "'\
                XOR fk_target_id = '" + domainNodeId + "')\
            AND (fk_node_id in (SELECT id FROM nodes WHERE is_connector = 1)\
                XOR fk_target_id IN (SELECT id FROM nodes WHERE is_connector = 1))\
        ";
        conn.query(query, (err: MysqlError, results: IDbConnector[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            const connectors: Connector[] = results.map((res) => new Connector(res.fk_node_id, res.fk_target_id));
            callback(connectors, undefined);
        });
    }

    /*
     * Gets all connections between domain nodes
     * Error codes:
     *      -10: MySQL error
     */
    public getDomainToDomainConnections(callback: (connectors: Connector[], err: Err) => void): void {
        const query: string =
        "SELECT fk_node_id, fk_target_id\
            FROM node_connections\
            WHERE fk_node_id like 'D%'\
            AND fk_target_id like 'D%'\
        ";
        conn.query(query, (err: MysqlError, results: IDbConnector[]) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            const connectors: Connector[] = results.map( (res) => new Connector(res.fk_node_id, res.fk_target_id));
            callback(connectors, undefined);
        });
    }

    /*
     * Returns a domain from the given Id
     * Error codes:
     *       -1: internal error
     *      -10: MySQL error
     */
    // public getDomainById(id: string, callback: (err: Err, domain: Domain) => void): void {
    //     db.getAllPatternsInDomain(id, (patterns: Pattern[], err: Err) => {
    //         if (err) {
    //             callback(err, undefined);
    //             return;
    //         }
    //         db.getPatternToPatternConnectionsInDomain(id, (connections: Connector[], err: Err) => {
    //             if (err) {
    //                 callback(err, undefined);
    //                 return;
    //             }
    //             db.getDomainNode(id, (err: Err, node: Node) => {
    //                 if (err) {
    //                     callback(err, undefined);
    //                     return;
    //                 }
    //                 callback(undefined, new Domain(id, patterns, node, connections));
    //             });
    //         });
    //     });
    // }
    public getDomainById(id: string, callback: (err: Err, domain: Domain) => void): void {
        db.getDomainsByIds([id], (err: Err, domains: Domain[]) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, domains[0]);
        });
    }

    /*
     * #FIXME: must get connections from domainNode to connector nodes
     * Returns a list of domains corresponding to the list of ids
     * Error codes:
     *      -10: MySQL error
     */
    public getDomainsByIds(ids: string[], callback: (err: Err, domains: Domain[]) => void): void {
        const getDomainPromises: Array<Promise<Domain>> = ids.map((domainId: string) => {
            return new Promise((resolve: (domain: Domain) => void, reject: (err: Err) => void) => {
                this.getAllPatternsInDomain(domainId, (patterns: Pattern[], err: Err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.getPatternToPatternConnectionsInDomain(domainId, (pConnections: Connector[], err: Err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        this.getPatternToDomainNodeConnectionsByDomain(domainId,
                            (dConnectors: Connector[], err: Err) => {
                            this.getDomainNode(domainId, (err: Err, node: Node) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                dConnectors.forEach( (dc) => pConnections.push(dc));
                                resolve(new Domain(domainId, patterns, node, pConnections));
                            });
                        });
                    });
                });
            });
        });
        Promise.all(getDomainPromises).then((domains: Domain[]) => {
            callback(undefined, domains);
        }, (err: any) => {
            console.log(JSON.stringify("reject: " + err));
            callback(err, undefined);
        }).catch((err: any) => {
            console.log(JSON.stringify("catch: " + err));
            callback(err, undefined);
        });
    }

    /*
     * Returns all domains
     * Error codes:
     *      -10: MySQL error
     */
    public getAllDomains(callback: (err: Err, domains: Domain[]) => void): void {
        const query: string = "SELECT id FROM domains";
        conn.query(query, (err: MysqlError, results: Array<{id: string}>) => {
            if (err) {
                callback(new Err(err.message, -10), undefined);
            }
            const domainIds: string[] = results.map((r) => r.id);
            db.getDomainsByIds(domainIds, callback);
        });
    }

    public getNetwork(callback: (err: Err, network: Network) => void): void {
        // get all domains
        // get all domainConnections
        db.getAllDomains((err: Err, domains: Domain[]) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            db.getDomainToDomainConnections((connectors: Connector[], err: Err) => {
                if (err) {
                    callback(err, undefined);
                    return;
                }
                callback(undefined, new Network(domains, connectors));
            });
        });
    }

    /*
     * Deletes the specified pattern, deletes all nodes within the specified pattern,
     *     deletes all connectors that touch any node on the pattern,
     *     and adds the pattern id and all affected node ids to the free id lists.
     *
     * ***THIS METHOD DOES NOT VERIFY THE INTEGRITY OF THE NETWORK AFTER ITS COMPLETION***
     *
     * Error codes:
     *      -10: MySQL error
     */
    public deletePattern(patternId: string, callback: (err: Err) => void): void {
        const query: string = "DELETE FROM patterns WHERE id = '" + patternId + "'";
        conn.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(new Err(err.message, -10));
                return;
            }
            callback(undefined);
        });
    }

    /*
     * Deletes the specified node, deletes all connectors that touch the node,
     *     and adds the node id to the free nodeId list.
     *
     * ***THIS METHOD DOES NOT VERIFY THE INTEGRITY OF THE NETWORK AFTER ITS COMPLETION***
     *
     * Error codes:
     *      -10: MySQL error
     */
    public deleteNode(nodeId: string, callback: (err: Err) => void): void {
        const query: string = "DELETE FROM nodes WHERE id = '" + nodeId + "'";
        conn.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(new Err(err.message, -10));
                return;
            }
            callback(undefined);
        });
    }

    /*
     * Deletes the specified connector between the given nodes

     * ***THIS METHOD DOES NOT VERIFY THE INTEGRITY OF THE NETWORK AFTER ITS COMPLETION***

     * Error codes:
     *      -10: MySQL error
     */
    public deleteConnection(nodeId: string, targetId: string, callback: (err: Err) => void): void {
        const query: string =
            "DELETE FROM node_connections\
            WHERE (fk_node_id = '" + nodeId + "' AND fk_target_id = '" + targetId + "')\
            OR (fk_node_id = '" + targetId + "' AND fk_target_id = '" + nodeId + "')";
        conn.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(new Err(err.message, -10));
                return;
            }
            callback(undefined);
        });
    }
    private bit(bool: boolean): number {
        return bool ? 1 : 0;
    }

    private storeNewDomainTransaction(connection: PoolConnection, args: any,
        callback: (err: Err, results: any) => void): void {
        let query: string = "SELECT id FROM domainIds WHERE isFree = 1 LIMIT 1 FOR UPDATE";
        let domainId: string;
        connection.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(new Err(err.message, -10), undefined);
                return;
            }
            if (results.length < 1) {
                callback(new Err("Not enough free domain ids", -1), undefined);
                return;
            }
            domainId = results[0].id;
            query = "UPDATE domainIds SET isFree = 0 WHERE id = '" + domainId + "'";
            connection.query(query, (err: MysqlError) => {
                if (err) {
                    callback(new Err(err.message, -10), undefined);
                    return;
                }
                query = "INSERT INTO domains(id) VALUES ?";
                const values: string[][] = [[domainId]];
                connection.query(query, [values], (err: MysqlError) => {
                    if (err) {
                        callback(new Err(err.message, -10), undefined);
                        return;
                    }
                    callback(undefined, domainId);
                });
            });
        });
    }

    private storeNewPatternTransaction(connection: PoolConnection, args: any,
        callback: (err: Err, results: any) => void): void {
        let query: string = "SELECT id FROM patternIds WHERE isFree = 1 LIMIT 1 FOR UPDATE";
        let patternId: string;
        connection.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(new Err(err.message, -10), undefined);
                return;
            }
            if (results.length < 1) {
                callback(new Err("Not enough free pattern ids", -1), undefined);
                return;
            }
            patternId = results[0].id;
            query = "UPDATE patternIds SET isFree = 0 WHERE id = '" + patternId + "'";
            connection.query(query, (err: MysqlError) => {
                if (err) {
                    callback(new Err(err.message, -10), undefined);
                    return;
                }
                query = "INSERT INTO patterns(id, fk_domain_id) VALUES ?";
                const values: string[][] = [[patternId, args.domainId]];
                connection.query(query, [values], (err: MysqlError) => {
                    if (err) {
                        callback(new Err(err.message, -10), undefined);
                        return;
                    }
                    callback(undefined, patternId);
                });
            });
        });
    }

    private addNodeTransaction(connection: PoolConnection,
        // args: {pattern: Pattern, isActive: boolean, isConnector: boolean, patternId: string, domainId: boolean},
        args: any,
        callback: (err: Err, results: any) => void): void {
        const pattern: Pattern = args.pattern as Pattern;
        let query: string = "";
        if (args.domainId) {
            query = "SELECT id FROM nodeIds WHERE isFree = 1 AND id LIKE 'D%' LIMIT 1 FOR UPDATE";
        } else {
            query = "SELECT id FROM nodeIds WHERE isFree = 1 AND id LIKE 'N%' LIMIT 1 FOR UPDATE";
        }
        const bit: (bool: boolean) => number = this.bit;
        connection.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(new Err(err.message, -10), undefined);
                return;
            }
            if (results.length < 1) {
                callback(new Err("Not enough free node ids", -1), undefined);
                return;
            }
            query = "UPDATE nodeIds SET isFree = 0 WHERE id = '" + results[0].id + "'";
            connection.query(query, (err: MysqlError) => {
                if (err) {
                    callback(new Err(err.message, -10), undefined);
                    return;
                }
                const node: Node = new Node(args.isActive, args.isConnector, results[0].id);
                if (!args.patternId) {
                    args.patternId = null;
                }
                if (!args.domainId) {
                    args.domainId = null;
                }
                query = "INSERT INTO nodes(id, is_active, is_connector, fk_pattern_id, fk_domain_id) VALUES ?";
                const values: string[][] = [[
                    node.id,
                    bit(node.isActive),
                    bit(node.isConnector),
                    args.patternId,
                    args.domainId
                ]];
                const q: Query = connection.query(query, [values], (err: MysqlError) => {
                    if (err) {
                        callback(new Err(err.message, -10), undefined);
                        return;
                    }
                    callback(undefined, node);
                });
                // console.log(q.sql);
            });
        });
    }

}

const db: DB = new DB();
module.exports.db = db; // javascript compatibility
export { db };
