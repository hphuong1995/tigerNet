import { Node } from './node';
import { Connector } from './connector'
import { nodeChildrenAsMap } from '@angular/router/src/utils/tree';
export class Pattern {
    public id: string;
    public nodes: Node[];
    public connections: Connector[];

    constructor(id: string, nodes: Node[], connections: Connector[]) {
        //add code to validate pattern
        this.id = id;
        this.nodes = nodes.map(n => new Node(n.isActive, n.isConnector, n.id));
        this.connections = connections.map(c => new Connector(c.id, c.targetId));
    }

    public getConnectorNode(): Node {
        return this.nodes.find((node: Node) => {
            return node.isConnector;
        });
    }

    public getNodeById(id: string): Node {
        return this.nodes.find((node: Node) => {
            return node.id === id;
        });
    }



    public isValid(): boolean {
        // If one noed - it must be a connector
        if (this.nodes.length === 1) {
            if (this.nodes[0].id !== this.getConnectorNode().id) {
                alert("If pattern have 1 node, it must be connectorNode");
                return false;
            }
            //    If one node - no connectors
            if (this.connections.length !== 0) {
                alert("If pattern have 1 node, There must not be any connection");
                return false;
            }
        }
        // If two nodes - one connector, one not connector
        if (this.nodes.length === 2) {
            //    If two nodes - exactly one connector connecting the nodes
            if (this.connections.length !== 1) {
                alert("If pattern have 2 node, There must 1 connection");
                return false;
            }
            var tempCon: Connector = new Connector(this.nodes[0].id, this.nodes[1].id);
            if (!tempCon.compareTo(this.connections[0])) {
                alert("If pattern have 2 node, There must 1 connection that connect 2 node");
                return false;
            }

            if (!this.connectorNodeConnectionCheck()) {
                return false;
            }
        }
        // If 3 to 7 nodes - exactly 1 connector node
        if (this.nodes.length > 3 && this.nodes.length < 7) {
            // No duplicate connections
            if (!Connector.checkDuplicateConnection(this.connections)) {
                alert("There is duplicate connection in the pattern");
                return false;
            }

            if (!this.connectionWithinPattern()) {
                alert("All connection must connect to a node within that pattern");
                return false;
            }

            if (!this.connectorNodeConnectionCheck()) {
                return false;
            }
            //If three nodes - connectors and nodes must form a triangle
        }

        //4 to 7 nodes
        if (this.nodes.length >= 4 && this.nodes.length < 7) {
            //  All non connector nodes must have exactly two connections to other non connector nodes
            // if (!this.maxTwoConnectorEachNode(this.getConnectorNode().id)) {
            //     alert("With 4-7 nodes, each node will connect to exact 2 nodes.");
            //     return false;
            // }
            if (!this.maxTwoEdgesPerNode()) {
                // alert("With 4-7 nodes, each node will connect to exact 2 nodes.");
                alert("Invalid network modification");
                return false;
            }

            if (!this.connectorNodeConnectionCheck()) {
                return false;
            }
        }
        return true;
    }



    private connectorNodeConnectionCheck(): boolean {
        var connectorId = this.getConnectorNode().id;
        var count = 0;

        this.connections.forEach(con => {
            if (con.id === connectorId || con.targetId === connectorId) {
                count++;
            }
        });

        if (this.nodes.length === 1) {
            if (count !== 0) {
                alert("There is only one node, cant have any connection");
                return false;
            }
        }
        else if (this.nodes.length === 2) {
            if (count !== 1) {
                alert("There is 2 node, there must be only 1 connection between the connector to the nonConnector node");
                return false;
            }
        }
        else if (this.nodes.length > 2) {
            if (count === 0) {
                alert("There must be at least 1 connector between connector node to non connector node");
                return false;
            }
            else if (count > 3) {
                alert("There must be at most 3 connector between connector node to non connector node");
                return false;
            }
        }

        return true;
    }



    private maxTwoEdgesPerNode(): boolean {
        // var retFlag: boolean = true;

        // this.nodes.forEach(node => {
        //     var count = 0;
        //     this.connections.forEach(con => {
        //         if (con.id !== connectorId && con.targetId !== connectorId) {
        //             if (con.id === node.id || con.targetId === node.id) {
        //                 count++;
        //             }
        //         }
        //     });
        //     if (count !== 2) {
        //         retFlag = false;
        //     }
        // });

        // return retFlag;
        var connectorId = this.getConnectorNode().id;
        var edgeConnectors = this.connections.filter( (conn: Connector) => {
            return conn.id !== connectorId && conn.targetId !== connectorId;
        });

        for( let i = 0; i < this.nodes.length; i++) {
            let count = 0;
            let node = this.nodes[i];
            if(node.id === connectorId) {
                continue;
            }
            edgeConnectors.forEach( (edge: Connector) => {
                if(edge.id === node.id || edge.targetId === node.id) {
                    count++;
                }
            })
            if(count !== 2) {
                return false;
            }
        }
        return true;
    }

    private connectionWithinPattern(): boolean {
        var connections: Connector[] = this.connections;
        var nodes: Node[] = this.nodes;
        let nodeIds: string[] = nodes.map(n => n.id);
        let connectorIds: string[] = [];
        for (var i = 0; i < connections.length; i++) {
            var connector = connections[i];
            if (!connectorIds.includes(connector.id)) {
                connectorIds.push(connector.id);
            }
            if (!connectorIds.includes(connector.targetId)) {
                connectorIds.push(connector.targetId);
            }
            if (!nodeIds.includes(connector.id) || !nodeIds.includes(connector.targetId)) {
                return false;
            }
        }

        for (var i = 0; i < nodeIds.length; i++) {
            if (!connectorIds.includes(nodeIds[i])) {
                return false;
            }
        }

        return true;

        // for( var connector in connections) {
        //     if(!connectorIds.includes(connector.id)) {
        //         connectorIds.push(connector.id);
        //     }
        //     if(!connectorIds.includes(connector.targetId)) {
        //         connectorIds.push(connector.targetId);
        //     }
        //     if(!nodeIds.includes(connector.id)) {

        //     }
        // }


        // connections.forEach( (connector: Connector) => {
        //     if(!connectorIds.includes(connector.id)) {
        //         connectorIds.push(connector.id);
        //     }
        //     if(!connectorIds.includes(connector.targetId)) {
        //         connectorIds.push(connector.targetId);
        //     }
        //     if(!nodeIds.includes(connector.id)) {

        //     }
        // });



        // return false;
    }

    // private connectionWithinPattern() {
    //     var connections = this.connections;
    //     var nodes = this.nodes;
    //     var flag: boolean = true;
    //     var nodesId: string[] = [];

    //     nodes.forEach(node => {
    //         nodesId.push(node.id);
    //     });

    //     connections.forEach(con => {
    //         if (!nodesId.includes(con.id) || !(nodesId.includes(con.targetId))) {
    //             flag = false;
    //         }
    //     });
    //     return flag;
    // }

    // private checkDuplicateConnection(connections: Connector[]) {
    //     var retFlag: boolean = true;
    //     connections.forEach(con => {
    //         var count = 0;
    //         connections.forEach(conToCheck => {
    //             if (con.compareTo(conToCheck)) {
    //                 count++;
    //             }
    //         });
    //         if (count === 2) {
    //             retFlag = false;
    //         }
    //     });
    //     return retFlag;
    // }




}