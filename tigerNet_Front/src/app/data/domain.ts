import { Connector } from './connector';
import { Pattern } from './pattern';
import { Node } from './node';
import { PatternsComponent } from '../component/patterns/patterns.component';
export class Domain {
    public id: string;
    public patternConnections: Connector[];
    public patterns: Pattern[];
    public domainNode: Node;
    constructor(id: string, patterns: Pattern[], domainNode: Node, patternConnections: Connector[]) {
        this.id = id;
        this.domainNode = new Node(domainNode.isActive, domainNode.isConnector, domainNode.id);
        this.patterns = patterns.map(p => new Pattern(p.id, p.nodes, p.connections));
        this.patternConnections = patternConnections.map(pc => new Connector(pc.id, pc.targetId));
    }

    public getPatternById(id: string): Pattern {
        return this.patterns.find(p => p.id === id);
    }

    public getPatternByChildNodeId(id: string): Pattern {
        return this.patterns.find(p => !!p.getNodeById(id));
    }

    public isValid(): boolean {
        for(var i = 0; i < this.patterns.length; i++) {
            if(!this.patterns[i].isValid()) {
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
}
