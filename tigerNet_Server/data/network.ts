import { Connector } from './connector';
import { Pattern } from './pattern';
export class Network {
    public patternConnections: Connector[];
    public patterns: Pattern[];
    constructor(patterns: Pattern[], patternConnections: Connector[]) {
        //add code to validate network
        this.patterns = patterns;
        this.patternConnections = patternConnections;
    }

    // public getPatternById(id: string): Pattern {
    //     return this.patterns.find( p => p.id === id );
    // }
    public static getPatternById(net: Network, id: string): Pattern {
        return net.patterns.find( p => p.id === id );
    }
}