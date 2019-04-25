import { Node } from './node';
import { Connector } from './connector';
import { Position } from './position';


declare global {
    interface Array<T> {
        transfer( transfer: (x: T) => boolean ): Array<T>;
    }
}

export class Pattern {
    public id: string;
    public nodes: Node[];
    public connections: Connector[];
    
    private cytoscape: any;
    private posX: number[][] = [
        [],
        [],
        [],
        [],
        [0, 50, -50],
        [-40, 40, 40, -40],
        [-55, -28, 28, 50, 0],//pentagon
        [-55, -28, 28, 50, 28, -28]//hexagon
    ];

    private posY: number[][] = [
        [],
        [],
        [],
        [],
        [-60, 30, 30],
        [40, 40, -40, -40],
        [-10, 50, 50, -10, -50],//pentagon
        [0, 50, 50, 0, -50, -50]//hexagon
    ];

    constructor(id: string, nodes: Node[], connections: Connector[]) {
        //add code to validate pattern
        this.id = id;
        this.nodes = nodes.map(n => new Node(n.isActive, n.isConnector, n.id));
        this.connections = connections.map(c => new Connector(c.id, c.targetId));
        //let nums: number[] = [0,,0];
        
        if(!Array.prototype.transfer) {
            Array.prototype.transfer = function<T>(this: T[], transfer: (x: T) => boolean): Array<T> {
                let transfers : Array<T> = [];
                let original: Array<T> = [];

                let t: T = this.pop();
                while(t !== undefined) {
                    if(transfer(t)) {
                        transfers.push(t);
                    } else {
                        original.push(t);
                    }
                    t = this.pop();
                }
                t = original.pop();
                while(t !== undefined) {
                    this.push(t);
                    t = original.pop();
                }
                return transfers;
            }
        }
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

    public addCytoscape(cytoscape: any) {
        this.cytoscape = cytoscape;
        this.nodes.forEach( n => n.addCytoscape(cytoscape));
    }

    public arrange() {
        if(this.nodes.length < 4) {
            return;
        }
        let connectorPos: Position = this.getConnectorNode().Position;
        let posX: number[] = this.posX[this.nodes.length];
        let posY: number[] = this.posY[this.nodes.length];
        let positionIndex: number = 0;
        
        let visitedNodes: Node[] = [];
        let current: Node = this.getConnectorNode();
        let next: Node;
        
        while(visitedNodes.length < this.nodes.length - 1) {
            let connectionFromCurrent: Connector = this.connections.find( (cn: Connector) => {
                let connectedToCurrent: boolean = cn.hasEnd(current.id);
                let connectedToVisitedNode: boolean = !!visitedNodes.find( n => cn.hasEnd(n.id));
                return connectedToCurrent && !connectedToVisitedNode;
            });
            visitedNodes.push(current);
            if(!connectionFromCurrent) {
                throw "unable to traverse pattern";
            }
            if(current.id === connectionFromCurrent.id) {
                next = this.getNodeById(connectionFromCurrent.targetId);
            } else {
                next = this.getNodeById(connectionFromCurrent.id);
            }
            next.Position = { x: connectorPos.x + posX[positionIndex], y: connectorPos.y + posY[positionIndex++] };
            current = next;
        }

    }

    // /*
    //  * Performs an action on all nodes.
    //  * Goes through each node once starting with the connector node.
    //  * Traverses the pattern through connected nodes
    //  */
    // public forAllNodes( workerFunction: (node: Node) => void ): void {
    //     let nodes: Node[] = this.nodes.slice(0);
    //     let visitedNodes: Node[] = [];
    //     let connectors: Connector[] = this.connections.slice(0);
    //     let previous: Node = this.getConnectorNode();
    //     workerFunction(previous);
    //     visitedNodes.push(previous);
    //     let connectionToPrevious: Connector = this.connections.find( (cn: Connector) => {
    //         let connectedToPrevious: boolean = cn.id === previous.id || cn.targetId === previous.id;
    //         let connectedToVisitedNode: boolean = !!visitedNodes.find( n => n.id === cn.id || n.id === cn.targetId);
    //         return connectedToPrevious && !connectedToVisitedNode;
    //     });
    //     if(!connectionToPrevious) {
    //         throw "unable to traverse pattern";
    //     }
    //     while(visitedNodes.length <= this.nodes.length) {

    //     }
    // }

    /*
     * Performs an action on all nodes.
     * Goes through each node once starting with the connector node.
     * Traverses the pattern through connected nodes
     */
    public forAllNodes( workerFunction: (node: Node) => void ): void {
        let nodes: Node[] = this.nodes.slice(0);
        let visitedNodes: Node[] = [];
        let connectors: Connector[] = this.connections.slice(0);
        let previous: Node = this.getConnectorNode();
        workerFunction(previous);
        visitedNodes.push(previous);
        let connectionToPrevious: Connector = this.connections.find( (cn: Connector) => {
            let connectedToPrevious: boolean = cn.id === previous.id || cn.targetId === previous.id;
            let connectedToVisitedNode: boolean = !!visitedNodes.find( n => n.id === cn.id || n.id === cn.targetId);
            return connectedToPrevious && !connectedToVisitedNode;
        });
        if(!connectionToPrevious) {
            throw "unable to traverse pattern";
        }
        while(visitedNodes.length <= this.nodes.length) {

        }
    }

    public positionNodes() {

    }

    public isValid(): boolean {
        // If one node - it must be a connector
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
        if (this.nodes.length >= 3 && this.nodes.length <= 7) {
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
            if(this.nodes.length === 3){
               return this.connections.length === 3
            }
        }

        //4 to 7 nodes
        if (this.nodes.length >= 4 && this.nodes.length <= 7) {
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
        let connectorId = this.getConnectorNode().id;
        let count = 0;

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
        let connectorId = this.getConnectorNode().id;
        let edgeConnectors = this.connections.filter( (conn: Connector) => {
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
        let connections: Connector[] = this.connections;
        let nodes: Node[] = this.nodes;
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
    }

    // Returns connectors for which both ends connected to active nodes
    private getActiveConnections(): Connector[] {
        return this.connections.filter( cn => {
            return this.getNodeById(cn.id).isActive && this.getNodeById(cn.targetId).isActive;
        });
    }

    public getPath(start: string, end: string): Node[] {
        return this._getPath(this.getNodeById(start), this.getNodeById(end), this.getActiveConnections());
    }

    // public getPath(start: Node, end: Node): Node[] {

    //     return this._getPath(start, end, this.connections.slice(0));
    // }

    public getPathToConnector(start: string) : Node[] {
        return this._getPath(this.getNodeById(start), this.getConnectorNode(), this.getActiveConnections());
    }

    //warning: untraversed will get modifed
    private _getPath(current: Node, end: Node, untraversed: Connector[]): Node[] {
        let shortestPath: Node[] = [];
        let paths: Node[][] = [];
        if(current.id === end.id) {
            if(end.isActive) {
                return [end];
            } else {
                return undefined;
            }
        }
        if(!untraversed || untraversed.length === 0) {
            return undefined;
        }
        let traversing: Connector[] = untraversed.transfer( x => x.id === current.id || x.targetId === current.id );
        for(const c of traversing) {
            let nextNodeId = current.id === c.id? c.targetId : c.id;
            let p: Node[] = this._getPath(this.getNodeById(nextNodeId), end, untraversed.slice(0));
            if(p !== undefined/* && p.length > 0*/) {
                p.push(current);
                paths.push(p);
            }
        }
        if(paths.length === 0) {
            return undefined;
        }
        let shortestPathLen = 10000;
        for(const p of paths) {
            if(p.length < shortestPathLen) {
                shortestPathLen = p.length;
                shortestPath = p;
            }
        }
        return shortestPath;
    }
}
