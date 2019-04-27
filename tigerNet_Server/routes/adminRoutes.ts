
import express from "express";
import { NextFunction, Request, Response } from "express";
const router: any = express.Router();

import { Result } from "range-parser";
import { ClientQuestion } from "../data/clientQuestion";
import { Domain } from "../data/domain";
import { Network } from "../data/network";
import { Question } from "../data/question";
import { SecurityAnswer } from "../data/securityAnswer";
import { User } from "../data/user";
import { Connector } from "./../data/connector";
import { Err } from "./../data/err";
import { Node } from "./../data/node";
import { Session } from "./../data/session";
import { db } from "./../services/database/db";

/*
 * This is an example get endpoint
 * for other methods, use router.post, router.put, router.delete, etc...
 *
 * Displayed is only the partial path. The rest of the path is in the app.ts file
 * All endpoints in this file start with /api/v1/admin/
 * This endpoint's full path is /api/v1/admin/exampleEndpoint/:pathparam
 *
 * Please add a comment on the parameters an endpoint accepts
 * This endpoint contains the following parameters:
 * query: color
 * body: cold
 * The endpoint also accepts a path parameter but that can be seen below
 */
router.get("/exampleEndpoint/:pathparam", (req: Request, res: Response, next: NextFunction) => {
    /*
     * Grab the user object from the session.
     * This object persists until the user logs out or the session expires (a long timeout)
     * The user object is validated in the authentication endpoints - no need to double check that
     */
    const user: User = req.session.user;
    // access body parameters using req.body.<parameter name>
    if (typeof req.body.cold !== "boolean") {
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
});

router.get("/users", (req: Request, res: Response) => {
    db.getAllUsers((users: User[], err: Err) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.send(users);
        }
    });
});

/*
 * Unblocks the specified user
 */
router.put("/users/:uid", (req: Request, res: Response) => {
    db.setUserBlocked(req.params.uid, false, (err: Err) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            // NEED TO RETURN NEW USER LIST TO UPDATE THE FRONT END
            db.getAllUsers((users: User[], err1: Err) => {
                if (err1) {
                    res.status(500).send(err1.message);
                } else {
                    res.send(users);
                }
            });
        }
    });
});

/*
 * add new pattern
 */
router.post("/patterns", (req: Request, res: Response) => {
    console.log(req.body.pid);
    // #FIXME: must give a domain id
    console.log(req.body);
    db.storeNewPattern(req.body.did, (pid: string, err: Err) => {
        if (err) {
            res.status(400).send(err.message);
        } else {
            db.addNode(true, true, pid, (node: Node, err: Err) => {
                if (err) {
                    if (err.status === -1) {
                        res.status(400).send("Pattern limit reached for this network, cannot create new pattern.");
                    } else if (err.status === -2) {
                        res.status(400).send("Node limit reached for this network, cannot create new pattern.");
                    } else {
                        res.status(500).send(err.message);
                    }
                    return;
                }
                let nodeIdList = [];
                const connectorList: Connector[] = [];

                nodeIdList = req.body.pid;
                nodeIdList.forEach((nid: string) => {
                    const newConnector = new Connector(node.id, nid);
                    connectorList.push(newConnector);
                });

                connectorList.push(new Connector(req.body.dnid, node.id));

                db.addConnections(connectorList, (err: Err) => {
                    if (err) {
                        res.status(400).send(err.message);
                    } else {
                        db.getNetwork((err: Err, network: Network) => {
                            if (err) {
                                res.status(400).send(err.message);
                            } else {
                                res.send(network);
                            }
                        });
                    }
                });
            });
        }
    });
});

/*
 * add new Node
 * Accepts parameter:
 * {
 *     pattern: string,             - id of the pattern
 *     nodes: string[],             - list of nodes ids from which to form a connection
 *     conNode: string,             - connector node id
 *     currentNodeNum: string       - current number of nodes in the pattern
 * }
 */
router.post("/patterns/:pid/nodes", (req: Request, res: Response) => {
    console.log(req.body);
    db.addNode(true, false, req.body.pattern, (node: Node, err: Err) => {
        if (err) {
            if (err.status === -1) {
                res.status(400).send("Node limit reached for this network");
            } else {
                res.status(500).send(err.message);
            }
            return;
        }
        let nodeIdList: any[] = [];
        const connectorList: Connector[] = [];

        nodeIdList = req.body.nodes;

        nodeIdList.forEach((nid: string) => {
            const newConnector = new Connector(node.id, nid);
            connectorList.push(newConnector);
        });

        db.addConnections(connectorList, (err: Err) => {
            if (err) {
                res.status(400).send(err.message);
                return;
            }
            const nonConNodes: string[] = [];
            nodeIdList.forEach((nid: string) => {
                if (nid !== req.body.conNode) {
                    nonConNodes.push(nid);
                }
            });
            if (nonConNodes.length !== 2 || req.body.currentNodeNum === 3) {
                // db.getDomainById("DN00", (err: Err, network: Domain) => {
                db.getNetwork((err: Err, network: Network) => {
                    if (err) {
                        res.status(400).send(err.message);
                    }
                    // if (network.isValid()) {
                    res.status(200).send(network);
                    // } else {
                    //     res.status(400).send("Invalid network modification");
                    // }
                });
            } else {
                db.deleteConnection(nonConNodes[0], nonConNodes[1], (err: Err) => {
                    if (err) {
                        res.status(400).send(err.message);
                        return;
                    }
                    // db.getDomainById("DN00", (err: Err, network: Domain) => {
                    db.getNetwork((err: Err, network: Network) => {
                        if (err) {
                            res.status(400).send(err.message);
                            return;
                        }
                        // if (network.isValid()) {
                        res.status(200).send(network);
                        // } else {
                        //     res.status(400).send("Invalid network modification");
                        // }
                    });
                });
            }
        });
    });
});

/*
 * add new Node
 */
router.post("/connections", (req: Request, res: Response) => {
    db.addConnection(req.body.nodes[0], req.body.nodes[1], (err: Err, connector: Connector) => {
        if (err) {
            res.status(400).send(err.message);
        } else {
            // db.getDomainById("DN00", (err: Err, network: Domain) => {
            db.getNetwork((err: Err, network: Network) => {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    res.status(200).send(network);
                }
            });
        }
    });
});

router.delete("/connections", (req: Request, res: Response) => {
    console.log(req.query);
    db.deleteConnection(req.query.id, req.query.targetId, (err: Err) => {
        if (err) {
            res.status(400).send(err.message);
        } else {
            // db.getDomainById("DN00", (err: Err, network: Domain) => {
            db.getNetwork((err: Err, network: Network) => {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    res.status(200).send(network);
                }
            });
        }
    });
});

router.delete("/nodes", (req: Request, res: Response) => {
    console.log(req.query);
    db.deleteNode(req.query.nid, (err: Err) => {
        if (err) {
            res.status(400).send(err.message);
        }
        if (req.query.pid) {
            db.deletePattern(req.query.pid, (err: Err) => {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    db.getNetwork((err: Err, network: Network) => {
                        if (err) {
                            res.status(400).send(err.message);
                        } else {
                            res.status(200).send(network);
                        }
                    });
                }
            });
        } else if (req.query.id && req.query.targetId) {
            db.addConnection(req.query.id, req.query.targetId, (err: Err, con: Connector) => {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    db.getNetwork((err: Err, network: Network) => {
                        if (err) {
                            res.status(400).send(err.message);
                        } else {
                            res.status(200).send(network);
                        }
                    });
                }
            });
        } else {
            db.getNetwork((err: Err, network: Network) => {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    res.status(200).send(network);
                }
            });
        }
    });
});

router.delete("/patterns", (req: Request, res: Response) => {
    console.log(req.query);
    db.deletePattern(req.query.pid, (err: Err) => {
        if (err) {
            res.status(400).send(err.message);
        } else {
            db.getNetwork((err: Err, network: Network) => {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    res.status(200).send(network);
                }
            });
        }
    });
});

router.delete("/domains", (req: Request, res: Response) => {
    console.log(req.query);
    db.deleteDomain(req.query.did, (err: Err) => {
        if (err) {
            res.status(400).send(err.message);
        } else {
            db.getNetwork((err: Err, network: Network) => {
                if (err) {
                    res.status(400).send(err.message);
                } else {
                    res.status(200).send(network);
                }
            });
        }
    });
});

router.post("/domains", (req: Request, res: Response) => {
    console.log(req.body);
    db.storeNewDomain((domainId: string, err: Err) => {
        if (err) {
            res.status(400).send(err.message);
            return;
        }
        db.addDomainNode(true, domainId, (domainNode: Node, err: Err) => {
            if (err) {
                res.status(400).send(err.message);
                return;
            }
            let nodeIdList = [];
            const connectorList: Connector[] = [];

            nodeIdList = req.body.did;
            nodeIdList.forEach((nid: string) => {
                const newConnector = new Connector(domainNode.id, nid);
                connectorList.push(newConnector);
            });

            db.storeNewPattern(domainId, (patternId: string, err: Err) => {
                if (err) {
                    res.status(400).send(err.message);
                    return;
                }
                db.addNode(true, true, patternId, (conNode: Node, err: Err) => {
                    if (err) {
                        res.status(400).send(err.message);
                    }
                    connectorList.push(new Connector(domainNode.id, conNode.id));
                    console.log(connectorList);
                    db.addConnections(connectorList, (err: Err) => {
                        if (err) {
                            res.status(400).send(err.message);
                            return;
                        }
                        db.getNetwork((err: Err, network: Network) => {
                            if (err) {
                                res.status(400).send(err.message);
                            } else {
                                res.send(network);
                            }
                        });

                    });
                });
            });
        });
    });
});

export { router as adminRoutes };
