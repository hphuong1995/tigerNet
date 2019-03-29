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

        //domain must not be empty
        if(this.patterns.length === 0) {
            return false;
        }

        

        //validate pattern connections

        return true;
    }
}
