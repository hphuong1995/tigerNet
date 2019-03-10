
import express from "express";
import { NextFunction, Request, Response } from "express";
const router: any = express.Router();
import uuid from "uuid";

import { ClientQuestion } from "../data/clientQuestion";
import { Question } from "../data/question";
import { SecurityAnswer } from "../data/securityAnswer";
import { User } from "../data/user";
import { Err } from "./../data/err";
import { Session } from "./../data/session";
import { db } from "./../services/database/db";

/*
 * Login, generate session and csrf token.
 */
router.post( "/api/v1/login", ( req: Request, res: Response ) => {
    req.session.regenerate( ( err1: any ) => {
        db.getUserByLogin( req.body.username, req.body.password, (user: User, err2: Err) => {
            if (err2) {
                res.status(403).send(err2.message);
                return;
            }
            const sess = new Session( req.session.id, uuid());
            req.session.user = user;
            res.cookie("X-CSRF", sess.csrf, { expires: new Date(Date.now() + 1_200_000)});
            db.storeSession(sess, (session: Session, err3: Err) => {
                if (err3) {
                    endSession(req, res, (e: Err) => {
                        res.status(500).send(err3);
                    });
                    return;
                }

                db.getUserUnguessedQuestion(user.id, (question: Question, err4: Err) => {
                    if (err4) {
                        res.status(403).send(err4.message);
                        return;
                    }
                    let response: {
                        id: string,
                        username: string,
                        isAdmin: boolean,
                        loginQuestion: ClientQuestion
                    };
                    req.session.securityQuestion = question;
                    // user will not be fully authenticated untill a security question is answered
                    req.session.fullyAuthenticated = false;
                    response = {
                        id: user.id,
                        username: user.username,
                        isAdmin: user.isAdmin,
                        loginQuestion: new ClientQuestion(question)
                    };
                    res.send(response);
                });
            });
        });
    } );
} );

/*
 * Validate session and csrf
 */
router.all( "/*", ( req: Request, res: Response, next: NextFunction ) => {
    const csrf: string = req.header( "X-CSRF" );
    const sid = req.session.id;
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, CSRF");
    db.getSession(sid, csrf, (session: Session, err: Err) => {
        if (err) {
            endSession(req, res, (err_session) => {
                res.status(403).send(err.message);
                return;
            });
            return;
        }
        next();
    });
} );

router.post( "/api/v1/logout", ( req: Request, res: Response ) => {
    endSession( req, res, ( err: any ) => {
        if ( err ) {
            throw err;
        }
        res.json( new Error( "success" ) );
    } );
} );

/*
 * Check if account is active.
 * If not active, deny access to the api
 */
router.all( "/*", ( req: Request, res: Response, next: NextFunction ) => {
    db.getUserById(req.session.user.id, (user: User, err: Err) => {
        if (err) {
            endSession(req, res, () => {
                res.status(403).send(err);
            });
            return;
        }
        if (user.isBlocked) {
            endSession(req, res, () => {
                res.status(403).send("You are not authorized to view this resource");
                return;
            });
            return;
        }
        req.session.user = user; // refresh session user object
        next();
    });
} );

router.get( "/api/v1/login/question", ( req: Request, res: Response ) => {
    if (!req.session.securityQuestion.incorrectlyGuessed) {// question must be guessed before getting a new one
        res.status(403).send("Please answer question before attempting to get a new one");
        return;
    }
    db.getUserUnguessedQuestion(req.session.user.id, (question: Question, err: Err) => {
        if (err) {
            if (err.status === -1) {
                res.status(403).send("User is blocked");
                return;
            }
            res.status(500).send(err);
            return;
        }
        req.session.securityQuestion = question;
        res.send(new ClientQuestion(question));
    });
});

/*
 * Accepts one body parameter:
 * answer - the answer to the previously sent question
 */
router.post("/api/v1/login/question", ( req: Request, res: Response ) => {
    if (!req.body.answer) {
        res.status(400).send("Requires an answer");
        return;
    }
    const question: Question = req.session.securityQuestion;
    db.getAnswer(req.session.user.id, question.id, (answer: SecurityAnswer, err: Err) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        if (req.body.answer === answer.answer) {// correct guess
            db.setFailedGuessOnAllAnswers(req.session.user.id, false, (err1: Err) => {
                if (err1) {
                    res.status(500).send(err1.message);
                    return;
                }
                req.session.fullyAuthenticated = true;
                res.send({ valid: true });
                return;
            });
        } else {// incorrect guess
            db.setFailedGuessOnAnswer(answer.id, true, (err1: Err) => {
                if (err1) {
                    res.status(500).send(err1.message);
                    return;
                }
                db.getUserUnguessedQuestion(req.session.user.id, (q: Question, err2: Err) => {
                    if (err2) {
                        if (err2.status !== -1) {
                            res.status(500).send(err2);
                            return;
                        }

                        db.setUserBlocked(req.session.user.id, true, (err3: Err) => {
                            if (err3) {
                                res.status(500).send(err3.message);
                                return;
                            }
                            res.status(403).send("User is blocked");
                        });
                        return;
                    }
                    req.session.securityQuestion = q;
                    res.send(new ClientQuestion(q));
                });
            });
        }
    });
});

/*
 * Check if account is fully authenticated
 * (security question successfully answered)
 */
router.all( "/*", ( req: Request, res: Response, next: NextFunction ) => {
    if (!req.session.fullyAuthenticated) {
        res.status(403).send("Access denied. User is not fully authenticated");
        return;
    }
    next();
} );

/*
 * Ensure only admins access admin endpoints
 */
router.all("/api/v1/:role/*", ( req: Request, res: Response, next: NextFunction ) => {
    const user: User = req.session.user;
    if (req.params.role === "admin" && !user.isAdmin) {
        res.status(403).send("You are not authorized to view this resource");
        return;
    }
    next();
});

function endSession( req: Request, res: Response, cb: (err?: Err) => void ): void {
    const reqCSRF = req.header( "CSRF" );
    delete req.session.user; // not sure if needed
    req.session.fullyAuthenticated = false;
    db.deleteSession(req.session.id, (err1: Err) => {
        res.set("CSRF", "");
        req.session.destroy( ( err2: any ) => {
            cb( err2 );
        });
    });
}

export { router as authenticate };
