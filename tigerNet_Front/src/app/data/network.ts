import { Connector } from './connector';
import { Pattern } from './pattern';
import { PatternsComponent } from '../component/patterns/patterns.component';
export class Network {
    public patternConnections: Connector[];
    public patterns: Pattern[];
    constructor(patterns: Pattern[], patternConnections: Connector[]) {
        this.patterns = patterns.map(p => new Pattern(p.id, p.nodes, p.connections));
        this.patternConnections = patternConnections.map(pc => new Connector(pc.id, pc.targetId));
    }

    public getPatternById(id: string): Pattern {
        return this.patterns.find(p => p.id === id);
    }
    // public static getPatternById(net: Network, id: string): Pattern {
    //     return net.patterns.find( p => p.id === id );
    // }

    public getPatternByChildNodeId(id: string): Pattern {
        return this.patterns.find(p => {
            if (p.getNodeById(id)) {
                return true;
            }
            else {
                return false;
            }
        });
    }

    public isValid(): boolean {
        for(var i = 0; i < this.patterns.length; i++) {
            if(!this.patterns[i].isValid()) {
                return false;
            }
        }
        return true;
    }

}
