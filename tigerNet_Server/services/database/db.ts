import bcrypt from "bcrypt";
import { MysqlError, PoolConnection, Query } from "mysql";
import uuid from "uuid/v1";
import { Connector } from "../../data/connector";
import { Err } from "../../data/err";
import { Node } from "../../data/node";
import { Pattern } from "../../data/pattern";
import { Question } from "../../data/question";
import { SecurityAnswer } from "../../data/securityAnswer";
import { Session } from "../../data/session";
import { User } from "../../data/user";
// import { pool } from "./connect";
import pool from "./connect";

pool.getConnection((err: MysqlError, connection: PoolConnection) => {
    if (err) {
        throw err;
    }
    pool.releaseConnection(connection);
});

const MAX_LOGIN_ATTEMPTS: number = 3;

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
        pool.query(query, (err: MysqlError, results: any[]) => {
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
        pool.query(query, (err: MysqlError, results: any) => {
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
            pool.query(query, [values], (err: MysqlError, result: any) => {
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
        pool.query(query, (err: MysqlError) => {
            if (err) {
                callback(new Err(err.message, -10));
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
    public getUserById(userId: string, callback: (user: User, err: Err) => void): void {
        const query: string = "SELECT * from users WHERE id ='" + userId + "'";
        pool.query(query, (err, results, fields) => {
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
        pool.query(query, (err: MysqlError, results: any) => {
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
        pool.query(query, (err: MysqlError, results: any) => {
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
        pool.query(query, (err: MysqlError, result: any) => {
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
        pool.query(query, (err: MysqlError, result: any) => {
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
        pool.query(query, (err: MysqlError, results: any) => {
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
        pool.query(query, (err: MysqlError, results: any) => {
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
     * Returns a user's list of questions
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
                    const queryVal: Query = connection.query(query, [values], (err) => {
                        if (err) {
                            callback(new Err(err.message, -10));
                            connection.rollback(() => connection.release());
                            return;
                        }
                        connection.commit((err: MysqlError) => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                callback(new Err(err.message, -10));
                                throw err;
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
        pool.query(query, (err: MysqlError, results: any) => {
            if (err) {
                callback(undefined, new Err(err.message, -10));
                return;
            }
            if (results.length === 0) {
                callback(undefined, new Err("Invalid user or question id", -1));
                return;
            }
            // callback(results[0].answer, undefined);
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
        pool.query(query, (err: MysqlError, result: any) => {
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
        pool.query(query, (err: MysqlError, result: any) => {
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
     * Execute queries inside of a transaction protected by a lock
     * Parameters:
     *     lockType: string ( 'READ' | 'WRITE' )
     *     tableName: string - table to lock
     * Error codes:
     *       -1: Invalid lock type
     *      -10: MySQL error
     */
    public criticalTransaction(lockType: string, tableName: string, args: any,
        criticalQueries: (connection: PoolConnection, args: any,
            callback: (err: Err, results: any) => void) => void,
        transactionCallback: (results: any, err: Err) => void): void {
        let criticalQueryResults: any;
        if (lockType !== "READ" && lockType !== "WRITE") {
            transactionCallback(undefined, new Err("Invalid lock type: " + lockType, -1));
            return;
        }
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
                let query: string = "LOCK TABLES " + tableName + " " + lockType;
                connection.query(query, (err: MysqlError) => {
                    if (err) {
                        transactionCallback(undefined, new Err(err.message, -10));
                        connection.rollback(() => connection.release());
                        return;
                    }
                    criticalQueries(connection, args, (err: Err, results: any) => {
                        if (err) {
                            transactionCallback(undefined, new Err(err.message, -10));
                            connection.rollback(() => connection.release());
                            return;
                        }
                        criticalQueryResults = results;
                        query = "UNLOCK TABLES";
                        connection.query(query, (err: MysqlError) => {
                            if (err) {
                                transactionCallback(undefined, new Err(err.message, -10));
                                connection.rollback(() => connection.release());
                                return;
                            }
                            connection.commit((err: MysqlError) => {
                                if (err) {
                                    connection.rollback(() => connection.release());
                                    transactionCallback(undefined, new Err(err.message, -10));
                                    return;
                                }
                                transactionCallback(criticalQueryResults, undefined);
                                connection.release();
                            });
                        });
                    });
                });
            });
        });
    }

    /*
 * Execute queries inside of a transaction protected by a lock
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
    public storeNewPattern(callback: (patternId: string, err: Err) => void): void {
        this.transaction(undefined, this.storeNewPatternTransaction,
            (results: any, err: Err) => {
                if (err) {
                    callback(undefined, err);
                } else {
                    callback(results as string, undefined);
                }
            });
    }

    /*
     * Create a new node from the given parameters and add it into the database.
     * The new node is returned in the callback
     * Error codes:
     *     -1: Invalid lock type
     *     10: MySQL error
     */
    public addNode(isActive: boolean, isConnector: boolean, patternId: string,
        callback: (node: Node, err: Err) => void): void {
        const args: any = {};
        args.isActive = isActive;
        args.isConnector = isConnector;
        args.patternId = patternId;
        this.transaction(args,
            this.addNodeTransaction.bind(this), (results: any, err: Err) => {
                if (err) {
                    callback(undefined, err);
                    return;
                }
                callback(results as Node, undefined);
            });
    }

    private bit(bool: boolean): number {
        return bool ? 1 : 0;
    }

    // public unblockUser(userId: string, callback: (err: Err) => void): void {
    //     const query: string = "UPDATE users SET is_blocked = 0 WHERE id ='" + userId + "'";
    //     pool.query(query, (err: MysqlError, results: any) => {
    //         if (err) {
    //             callback(new Err(err.message, -10));
    //         }
    //         this.setFailedGuessOnAllAnswers(userId, false, (err: Err) => {
    //             if (err) {
    //                 callback(new Err(err.message, -10));
    //             }
    //             callback(undefined);
    //         });
    //     });
    // }

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
                query = "INSERT INTO patterns(id) VALUES ?";
                const values: string[][] = [[patternId]];
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

    private addNodeTransaction(connection: PoolConnection, args: any,
        callback: (err: Err, results: any) => void): void {
        const pattern: Pattern = args.pattern as Pattern;
        let query: string = "SELECT id FROM nodeIds WHERE isFree = 1 LIMIT 1 FOR UPDATE";
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
                query = "INSERT INTO nodes(id, is_active, is_connector, fk_pattern_id) VALUES ?";
                const values: string[][] = [[node.id, bit(node.isActive), bit(node.isConnector), args.patternId]];
                const q: Query = connection.query(query, [values], (err: MysqlError) => {
                    if (err) {
                        callback(new Err(err.message, -10), undefined);
                        return;
                    }
                    callback(undefined, node);
                });
                console.log(q.sql);
            });
        });
    }

    /*
     * Connects two nodes
     * PRE: Node ids must be valid nodes
     * Error codes:
     *     -1: invalid node id(s)
     *     -2: attempted to create connection fron non connector node to a node in a different pattern
     *     -10: MySQL error
     */
    public addConnection(nodeId: string, targetId: string, callback: (err: Err, connector: Connector) => void ): void {
        let query: string = "SELECT * FROM NODES WHERE id = '" + nodeId + "' OR id = '" + targetId + "'";
        console.log(query);
        pool.query(query, (err: MysqlError, results: IDbNode[]) => {
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
                    callback(new Err("attempted to create connection fron\
                        non connector node to a node in a different pattern", -2), undefined);
                    return;
                }
            }
            const values: string[][] = [
                [nodeId, targetId]
            ];
            query = "INSERT INTO node_connections (fk_node_id, fk_target_id) VALUES ?";
            pool.query(query, [values], (err: MysqlError) => {
                if (err) {
                    callback(new Err(err.message, -10), undefined);
                    return;
                }
                callback(undefined, new Connector(nodeId, targetId));
            });
        });
    }

    // query = "INSERT INTO sessions(id, csrf) VALUES ?";
    // const values: string[][] = [
    //     [session.sid, session.csrf]
    // ];
    // pool.query(query, [values], (err: MysqlError, result: any) => {

    /*
     * Generates a unique pattern id
     * Error codes:
     *      -10: MySQL error
     */
    // public generatePatternId(amountToGenerate: number, callback: (id: string[], err: Err) => void): void {
    //     pool.getConnection((err: MysqlError, connection: PoolConnection) => {
    //         if (err) {
    //             callback(undefined, new Err(err.message, -10));
    //             connection.release();
    //             return;
    //         }
    //         connection.beginTransaction((err: MysqlError) => {
    //             if (err) {
    //                 callback(undefined, new Err(err.message, -10));
    //                 connection.rollback(() => connection.release());
    //                 return;
    //             }
    //             let query: string = "LOCK TABLE id WRITE";
    //             connection.query(query, (err: MysqlError) => {
    //                 if (err) {
    //                     callback(undefined, new Err(err.message, -10));
    //                     connection.rollback(() => connection.release());
    //                     return;
    //                 }
    //                 query = "SELECT patternId FROM id";
    //                 connection.query(query, (err: MysqlError, results: any) => {
    //                     if (err) {
    //                         callback(undefined, new Err(err.message, -10));
    //                         connection.rollback(() => connection.release());
    //                         return;
    //                     }
    //                     let pid: string = "" + results[0].patternId;
    //                     while (pid.length < 2) {
    //                         pid = "0" + pid;
    //                     }
    //                     pid = "P" + pid;
    //                     query = "UPDATE id SET patternId = patternId + 1";
    //                     connection.query(query, (err: MysqlError) => {
    //                         if (err) {
    //                             callback(undefined, new Err(err.message, -10));
    //                             connection.rollback(() => connection.release());
    //                             return;
    //                         }
    //                         query = "UNLOCK TABLES";
    //                         connection.query(query, (err: MysqlError) => {
    //                             if (err) {
    //                                 callback(undefined, new Err(err.message, -10));
    //                                 connection.rollback(() => connection.release());
    //                                 return;
    //                             }
    //                             connection.commit((err: MysqlError) => {
    //                                 if (err) {
    //                                     connection.rollback(() => connection.release());
    //                                     callback(undefined, new Err(err.message, -10));
    //                                     return;
    //                                 }
    //                                 callback([pid], undefined);
    //                                 connection.release();
    //                             });
    //                         });
    //                     });
    //                 });
    //             });
    //         });
    //     });
    // }

    // /*
    //  * Generates a unique node id
    //  * Arguments: (answerId: string, correctGuess: boolean, callback)
    //  * Error codes:
    //  *      -10: MySQL error
    //  * Callback argments: (error: Error)
    //  */
    // public generateNodeId(callback: (id: string, err: Err) => void): void {
    //     pool.getConnection((err: MysqlError, connection: PoolConnection) => {
    //         if (err) {
    //             callback(undefined, new Err(err.message, -10));
    //             connection.release();
    //             return;
    //         }
    //         connection.beginTransaction((err: MysqlError) => {
    //             if (err) {
    //                 callback(undefined, new Err(err.message, -10));
    //                 connection.rollback(() => connection.release());
    //                 return;
    //             }
    //             let query: string = "LOCK TABLE id WRITE";
    //             connection.query(query, (err: MysqlError) => {
    //                 if (err) {
    //                     callback(undefined, new Err(err.message, -10));
    //                     connection.rollback(() => connection.release());
    //                     return;
    //                 }
    //                 query = "SELECT nodeId FROM id";
    //                 connection.query(query, (err: MysqlError, results: any) => {
    //                     if (err) {
    //                         callback(undefined, new Err(err.message, -10));
    //                         connection.rollback(() => connection.release());
    //                         return;
    //                     }
    //                     let pid: string = "" + results[0].nodeId;
    //                     while (pid.length < 2) {
    //                         pid = "0" + pid;
    //                     }
    //                     pid = "P" + pid;
    //                     query = "UPDATE id SET nodeId = nodeId + 1";
    //                     connection.query(query, (err: MysqlError) => {
    //                         if (err) {
    //                             callback(undefined, new Err(err.message, -10));
    //                             connection.rollback(() => connection.release());
    //                             return;
    //                         }
    //                         query = "UNLOCK TABLES";
    //                         connection.query(query, (err: MysqlError) => {
    //                             if (err) {
    //                                 callback(undefined, new Err(err.message, -10));
    //                                 connection.rollback(() => connection.release());
    //                                 return;
    //                             }
    //                             connection.commit((err: MysqlError) => {
    //                                 if (err) {
    //                                     connection.rollback(() => connection.release());
    //                                     callback(undefined, new Err(err.message, -10));
    //                                     return;
    //                                 }
    //                                 callback(pid, undefined);
    //                                 connection.release();
    //                             });
    //                         });
    //                     });
    //                 });
    //             });
    //         });
    //     });
    // }

    // /*
    //  * Generates a unique message id
    //  * Arguments: (answerId: string, correctGuess: boolean, callback)
    //  * Error codes:
    //  *      -10: MySQL error
    //  * Callback argments: (error: Error)
    //  */
    // public generateMessageId(callback: (id: string, err: Err) => void): void {
    //     pool.getConnection((err: MysqlError, connection: PoolConnection) => {
    //         if (err) {
    //             callback(undefined, new Err(err.message, -10));
    //             connection.release();
    //             return;
    //         }
    //         connection.beginTransaction((err: MysqlError) => {
    //             if (err) {
    //                 callback(undefined, new Err(err.message, -10));
    //                 connection.rollback(() => connection.release());
    //                 return;
    //             }
    //             let query: string = "LOCK TABLE id WRITE";
    //             connection.query(query, (err: MysqlError) => {
    //                 if (err) {
    //                     callback(undefined, new Err(err.message, -10));
    //                     connection.rollback(() => connection.release());
    //                     return;
    //                 }
    //                 query = "SELECT messageId FROM id";
    //                 connection.query(query, (err: MysqlError, results: any) => {
    //                     if (err) {
    //                         callback(undefined, new Err(err.message, -10));
    //                         connection.rollback(() => connection.release());
    //                         return;
    //                     }
    //                     let pid: string = "" + results[0].messageId;
    //                     while (pid.length < 2) {
    //                         pid = "0" + pid;
    //                     }
    //                     pid = "P" + pid;
    //                     query = "UPDATE id SET messageId = messageId + 1";
    //                     connection.query(query, (err: MysqlError) => {
    //                         if (err) {
    //                             callback(undefined, new Err(err.message, -10));
    //                             connection.rollback(() => connection.release());
    //                             return;
    //                         }
    //                         query = "UNLOCK TABLES";
    //                         connection.query(query, (err: MysqlError) => {
    //                             if (err) {
    //                                 callback(undefined, new Err(err.message, -10));
    //                                 connection.rollback(() => connection.release());
    //                                 return;
    //                             }
    //                             connection.commit((err: MysqlError) => {
    //                                 if (err) {
    //                                     connection.rollback(() => connection.release());
    //                                     callback(undefined, new Err(err.message, -10));
    //                                     return;
    //                                 }
    //                                 callback(pid, undefined);
    //                                 connection.release();
    //                             });
    //                         });
    //                     });
    //                 });
    //             });
    //         });
    //     });
    // }
}

const db: DB = new DB();
module.exports.db = db; // javascript compatibility
export { db };
