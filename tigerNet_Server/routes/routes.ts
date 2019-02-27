
import express from "express";
import { NextFunction, Request, Response } from "express";
const router: any = express.Router();

import { ClientQuestion } from "../data/clientQuestion";
import { Node } from "../data/node";
import { Question } from "../data/question";
import { SecurityAnswer } from "../data/securityAnswer";
import { User } from "../data/user";
import { Err } from "./../data/err";
import { Session } from "./../data/session";
import { db } from "./../services/database/db";

function validUid( userId: string, req: Request ) {
    return userId === req.session.user._id;
}
/*
 * This is an example get endpoint
 * for other methods, use router.post, router.put, router.delete, etc...
 *
 * Displayed is only the partial path. The rest of the path is in the app.ts file
 * All endpoints in this file start with /api/v1/
 * This endpoint's full path is /api/v1/exampleEndpoint/:pathparam
 *
 * Please add a comment on the parameters an endpoint accepts
 * This endpoint contains the following parameters:
 * query: color
 * body: cold
 * The endpoint also accepts a path parameter but that can be seen below
 */
router.get( "/exampleEndpoint/:pathparam", ( req: Request, res: Response, next: NextFunction ) => {
    /*
     * Grab the user object from the session.
     * This object persists until the user logs out or the session expires (a long timeout)
     * The user object is validated in the authentication endpoints - no need to double check that
     */
    const user: User = req.session.user;
    // access body parameters using req.body.<parameter name>
    if (typeof req.body.cold  !== "boolean") {
        /*
         * Sends a response with a 400 (Bad Request) status code with a message
         */
        res.status(400).send("Invalid format of cold parameter");
        /*
         * Don't forget to return after sending a response,
         * otherwise the server may attempt to send more responses
         */
        return;
    }
    if (!req.query.color) {
        res.status(400).send("color query parameter missing");
    }
    const cold: boolean = req.body.cold;
    if (cold) {
        if (req.query.color === "blue") {
            /*
             * res.send sends a 200 (OK) status by default, use this for normal responses
             */
            res.send("Correct combination of parameters");
            return;
        }
    } else {
        // access path parameters with req.params.<parameter name>
        if (req.params.pathparam === "hi") {
            res.send("success");
            return;
        }
    }
    const err: Err = new Err("failure", -1);
    /*
     * When catching errors from the database either send back a 500 status (MySql error)
     * or a 404 if something isn't found. Either send back the error message.
     * Sending back these errors makes debugging easier
     */
    if (err) {
        if (err.status === -1) {
            res.status(500).send(err.message);
        } else {
            res.status(404).send(err.message);
        }
    }
} );

/*
 * Get all patterns
 */
router.get( "/network", ( req: Request, res: Response, next: NextFunction ) => {
    /*
     * Grab the user object from the session.
     * This object persists until the user logs out or the session expires (a long timeout)
     * The user object is validated in the authentication endpoints - no need to double check that
     */

    const hardCodedPattern: string =     '{\
        "patterns": [\
            {\
                "id": "P01",\
                "nodes": [\
                    {\
                        "id": "N01",\
                        "isActive": true,\
                        "isConnector": false\
                    },\
                    {\
                        "id": "N02",\
                        "isActive": true,\
                        "isConnector": false\
                    },\
                    {\
                        "id": "N03",\
                        "isActive": true,\
                        "isConnector": true\
                    }\
                ],\
                "connections": [\
                    {\
                        "id": "N01",\
                        "targetId": "N02"\
                    },\
                    {\
                        "id": "N02",\
                        "targetId": "N03"\
                    },\
                    {\
                        "id": "N03",\
                        "targetId": "N01"\
                    }\
                ]\
            },\
            {\
                "id": "P02",\
                "nodes": [\
                    {\
                        "id": "N04",\
                        "isActive": true,\
                        "isConnector": true\
                    },\
                    {\
                        "id": "N05",\
                        "isActive": true,\
                        "isConnector": false\
                    },\
                    {\
                        "id": "N06",\
                        "isActive": true,\
                        "isConnector": false\
                    }\
                ],\
                "connections": [\
                    {\
                        "id": "N04",\
                        "targetId": "N05"\
                    },\
                    {\
                        "id": "N05",\
                        "targetId": "N06"\
                    },\
                    {\
                        "id": "N06",\
                        "targetId": "N04"\
                    }\
                ]\
            },\
            {\
                "id": "P03",\
                "nodes": [\
                    {\
                        "id": "N07",\
                        "isActive": true,\
                        "isConnector": true\
                    },\
                    {\
                        "id": "N08",\
                        "isActive": true,\
                        "isConnector": false\
                    },\
                    {\
                        "id": "N09",\
                        "isActive": true,\
                        "isConnector": false\
                    }\
                ],\
                "connections": [\
                    {\
                        "id": "N07",\
                        "targetId": "N08"\
                    },\
                    {\
                        "id": "N08",\
                        "targetId": "N09"\
                    },\
                    {\
                        "id": "N09",\
                        "targetId": "N07"\
                    }\
                ]\
            }\
        ],\
        "patternConnections": [\
            {\
                "id": "P01",\
                "targetId": "P02"\
            },\
            {\
                "id": "P02",\
                "targetId": "P03"\
            },\
            {\
                "id": "P03",\
                "targetId": "P01"\
            }\
        ]\
    }';
    const examplePattern: any = JSON.parse(hardCodedPattern);
    res.send(examplePattern);
} );

export { router as routes };
