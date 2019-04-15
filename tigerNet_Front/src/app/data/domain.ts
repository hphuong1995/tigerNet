import { Connector } from './connector';
import { Pattern } from './pattern';
import { Node } from './node';
import { PathLocationStrategy } from '@angular/common';

export class Domain {
    public id: string;
    public patternConnections: Connector[];
    public patterns: Pattern[] = [];
    public domainNode: Node;
    constructor(id: string, patterns: Pattern[], domainNode: Node, patternConnections: Connector[]) {
        this.id = id;
        this.domainNode = new Node(domainNode.isActive, domainNode.isConnector, domainNode.id);
        this.patterns = patterns.map(p => new Pattern(p.id, p.nodes, p.connections)) || [];
        this.patternConnections = patternConnections.map(pc => new Connector(pc.id, pc.targetId));
    }

    public getPatternById(id: string): Pattern {
        return this.patterns.find(p => p.id === id);
    }

    public getPatternByChildNodeId(id: string): Pattern {
        return this.patterns.find(p => !!p.getNodeById(id));
    }

    public isValid(): boolean {
        // must have exactly 1 domain node
        if (!this.domainNode) {
            return false;
        }
        if (!this.domainNode.isDomainNode) {
            return false;
        }

        //domains must contain at least one pattern
        if(!this.patterns || this.patterns.length < 1) {
            return false;
        }

        for ( const pattern of this.patterns) {
            if (!pattern.isValid()) { return false; }
            // each pattern's connector node must be connected to the domain node
            const findConnector: Connector = new Connector(this.domainNode.id, pattern.getConnectorNode().id);
            if (!this.patternConnections.find( (cn) => cn.compareTo(findConnector))) {
                return false;
            }
        }

        // domain must not be empty
        if (this.patterns.length === 0) {
            return false;
        }
        // no duplicate connections allowed
        if (!Connector.checkDuplicateConnection(this.patternConnections)) {
            return false;
        }

        // all connectors must be either connector node <--> connector node
        // or connector node <--> domain node
        const conNodeIds: string[] = this.patterns.map( (p) => p.getConnectorNode().id );
        for ( const con of this.patternConnections) {
            if(!con.validateConnector()) {
                return false;
            }
            if (con.id !== this.domainNode.id && !conNodeIds.find( (id) => id === con.id)) {
                return false;
            }
            if (con.targetId !== this.domainNode.id && !conNodeIds.find( (id) => id === con.targetId)) {
                return false;
            }
        }
        return true;
    }

    public getAllConnections(): Connector[] {
        let connectors: Connector[] = [];
        this.patternConnections.forEach( pc => connectors.push(pc));
        this.patterns.forEach( (p) => {
            p.connections.forEach( pcn => connectors.push(pcn));
        });
        return connectors;
    }

    private getConnectorOrDomainNodeById(id: string): Node {
        if(this.domainNode.id === id) {
            return this.domainNode;
        }
        let p: Pattern = this.patterns.find( p => p.getConnectorNode().id === id);
        return p.getConnectorNode();
    }

    public getPath(start: string, end: string): Node[] {
        //start and end in same pattern, return pattern path
        //start and end both connector nodes, return connector node paths (no need for pattern.path)
        //start pattern's path to connector node + path to end's connector node + end pattern's path to end node
        let path: Node[] = [];
        let startPattern = this.getPatternByChildNodeId(start);
        let endPattern = this.getPatternByChildNodeId(end);
        if(startPattern && endPattern) {
            if(startPattern.id === endPattern.id) {
                return startPattern.getPath(start, end);
            }
        }
        
        // if(startPattern) {
        //     path = startPattern.getPathToConnector(start);
        //     if(endPattern) {
        //         path = path.concat(this.connToConnPath(startPattern.getConnectorNode(), endPattern.getConnectorNode()));
        //         path = path.concat(endPattern.getPath(endPattern.getConnectorNode().id, end))
        //     } else {
        //         path = path.concat(this.connToConnPath(startPattern.getConnectorNode(), this.domainNode));
        //     }
        // } else {
        //     path = [this.domainNode];
        //     if(endPattern) {
        //         path = path.concat(this.connToConnPath(this.domainNode, endPattern.getConnectorNode()));
        //         path.concat(endPattern.getPath(endPattern.getConnectorNode().id, end));
        //     } else {

        //     }
        // }
        
        if(startPattern) {
            path = startPattern.getPathToConnector(start);
            // path.pop();
            if(endPattern) {
                // path = path.concat(this.connToConnPath(startPattern.getConnectorNode(), endPattern.getConnectorNode()));
                // path = path.concat(endPattern.getPath(endPattern.getConnectorNode().id, end))

                path = this.connToConnPath(startPattern.getConnectorNode(), endPattern.getConnectorNode()).concat(path);
                // path.pop();
                path = endPattern.getPath(endPattern.getConnectorNode().id, end).concat(path);
                // path.pop();
            } else {
                // path = path.concat(this.connToConnPath(startPattern.getConnectorNode(), this.domainNode));
                path = this.connToConnPath(startPattern.getConnectorNode(), this.domainNode).concat(path);
            }
        } else {
            path = [this.domainNode];
            // path.pop();
            if(endPattern) {
                path = this.connToConnPath(this.domainNode, endPattern.getConnectorNode()).concat(path);
                // path.pop();
                endPattern.getPath(endPattern.getConnectorNode().id, end).concat(path);
                // path.pop();
            } else {

            }
        }
        
        return path;
    }

    //PRE start and end are connector or domain nodes
    private connToConnPath(start: Node, end: Node): Node[] {
        return this._connToConnPath(start, end, this.patternConnections.slice(0));
    }

    //warning: untraversed will get modifed
    private _connToConnPath(current: Node, end: Node, untraversed: Connector[]): Node[] {
        let shortestPath: Node[] = [];
        let paths: Node[][] = [];
        if(current.id === end.id) {
            return [end];
        }
        if(!untraversed || untraversed.length === 0) {
            return undefined;
        }
        let traversing: Connector[] = untraversed.transfer( x => current.id === x.id || current.id === x.targetId );
        for(const c of traversing) {
            let nextNodeId = current.id === c.id? c.targetId : c.id;
            let p: Node[] = this._connToConnPath(this.getConnectorOrDomainNodeById(nextNodeId), end, untraversed.slice(0));
            if(p !== undefined) {
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
