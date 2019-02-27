import { Connector } from './connector';
import { Pattern } from './pattern';
export class Network {
    public patternConnections: Connector[];
    public patterns: Pattern[];
    constructor(patterns: Pattern[], patternConnections: Connector[]) {
        this.patterns = patterns.map( p =>  new Pattern(p.id, p.nodes, p.connections));
        this.patternConnections = patternConnections.map( pc =>  new Connector(pc.id, pc.targetId));
    }

    public getPatternById(id: string): Pattern {
        return this.patterns.find( p => p.id === id );
    }
    // public static getPatternById(net: Network, id: string): Pattern {
    //     return net.patterns.find( p => p.id === id );
    // }
}