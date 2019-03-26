import { Connector } from "./connector";
import { Node } from "./node";
import { Pattern } from "./pattern";
export class Domain {
    public id: string;
    public patternConnections: Connector[];
    public patterns: Pattern[];
    public domainNode: Node;
    constructor(id: string, patterns: Pattern[], domainNode: Node, patternConnections: Connector[]) {
        // add code to validate domain
        this.id = id;
        this.patterns = patterns;
        this.patternConnections = patternConnections;
        this.domainNode = domainNode;
    }

    public getPatternById(id: string): Pattern {
        return this.patterns.find((p) => p.id === id);
    }

    public getPatternByChildNodeId(id: string): Pattern {
        return this.patterns.find((p) => {
            if (p.getNodeById(id)) {
                return true;
            } else {
                return false;
            }
        });
    }

    public isValid(): boolean {
        for (const pattern of this.patterns) {
            if (!pattern.isValid()) {
                return false;
            }
        }
        return true;
    }
}
