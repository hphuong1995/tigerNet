import { Connector } from "./connector";
import { Pattern } from "./pattern";
export class Network {

    public patternConnections: Connector[];
    public patterns: Pattern[];
    constructor(patterns: Pattern[], patternConnections: Connector[]) {
        // add code to validate network
        this.patterns = patterns;
        this.patternConnections = patternConnections;
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
