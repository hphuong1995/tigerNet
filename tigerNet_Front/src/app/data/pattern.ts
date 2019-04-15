import { Node } from './node';
import { Connector } from './connector';



declare global {
    interface Array<T> {
        transfer( transfer: (x: T) => boolean ): Array<T>;
    }
}

export class Pattern {
    public id: string;
    public nodes: Node[];
    public connections: Connector[];

    constructor(id: string, nodes: Node[], connections: Connector[]) {
        //add code to validate pattern
        this.id = id;
        this.nodes = nodes.map(n => new Node(n.isActive, n.isConnector, n.id));
        this.connections = connections.map(c => new Connector(c.id, c.targetId));
        let nums: number[] = [0,,0];
        
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
        if (this.nodes.length >= 3 && this.nodes.length < 7) {
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
