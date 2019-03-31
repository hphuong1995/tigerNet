import { Connector } from "./connector";
import { Node } from "./node";
import { Pattern } from "./pattern";
export class Domain {
    public id: string;
    public patternConnections: Connector[];
    public patterns: Pattern[];
    public domainNode: Node;
    constructor(id: string, patterns: Pattern[], domainNode: Node, patternConnections: Connector[]) {
        this.id = id;
        this.patterns = patterns;
        this.patternConnections = patternConnections;
        this.domainNode = domainNode;
    }

    public getPatternById(id: string): Pattern {
        return this.patterns.find((p) => p.id === id);
    }

    public getPatternByChildNodeId(id: string): Pattern {
        return this.patterns.find((p) => !!p.getNodeById(id));
    }

    public isValid(): boolean {
        // must have exactly 1 domain node
        if (!this.domainNode) {
            return false;
        }
        if (!this.domainNode.isDomainNode) {
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
}
