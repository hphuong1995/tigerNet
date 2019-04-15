
import express from "express";
import { NextFunction, Request, Response } from "express";
const router: any = express.Router();

import { NetConnectOpts } from "net";
import { isContext } from "vm";
import { ClientQuestion } from "../data/clientQuestion";
import { Domain } from "../data/domain";
import { Message } from "../data/message";
import { Network } from "../data/network";
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
 * Retrieve the network
 */
router.get( "/network", ( req: Request, res: Response, next: NextFunction ) => {
    /*
     * Grab the user object from the session.
     * This object persists until the user logs out or the session expires (a long timeout)
     * The user object is validated in the authentication endpoints - no need to double check that
     */
    // db.getDomainById("DN00", (err: Err, network: Domain) => {
    //     if (err) {
    //         res.status(500).send(err.message);
    //         return;
    //     }
    //     res.send(network);
    // });
    db.getNetwork((err: Err, network: Network) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }
        res.send(network);
    });

     // res.send(examplePattern);
} );

router.put("/nodes/:nid", (req: Request, res: Response) => {
  const activate: boolean = (req.query.active === "true");

  console.log(activate);
  db.setNodeActivated(req.params.nid, activate, (err: Err) => {
    if (err) {
      res.status(400).send(err.message);
    } else {
      res.status(200).send({});
    }
  });
});

router.post("/messages", (req: Request, res: Response) => {
  console.log(req.body);
  db.storeNewMessage(req.body.sender, req.body.receiver, req.body.message, (message, err: Err) => {
    if (err) {
      res.status(400).send(err.message);
    } else {
      res.status(200).send(message);
    }
  });
});

router.get("/nodes/:nid", (req: Request, res: Response) => {
  console.log(req.params.nid);
  db.getMessage(req.params.nid, (err: Err, messages: Message[]) => {
    if (err) {
      res.status(400).send(err.message);
    } else {
      res.status(200).send(messages);
    }
  });
});

router.get("/messages", (req: Request, res: Response) => {
  console.log(req.query.mid);
  
});

export { router as routes };
