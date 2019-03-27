import { Connector } from './connector';
import { Pattern } from './pattern';
import { Domain } from './domain';
import { PatternsComponent } from '../component/patterns/patterns.component';
export class Network {
    public domainConnections: Connector[];
    public domains: Domain[];
    constructor(domains: Domain[], domainConnections: Connector[]) {
        // this.domains = domains.map(p => new Pattern(p.id, p.nodes, p.connections));
        this.domains = domains.map(d => new Domain(d.id, d.patterns, d.domainNode, d.patternConnections));
        this.domainConnections = domainConnections.map(dc => new Connector(dc.id, dc.targetId));
    }

    

    public getPatternByChildNodeId(id: string): Pattern {
        let p: Pattern;
        for(let i = 0; i < this.domains.length; i++) {
            p = this.domains[i].getPatternByChildNodeId(id);
            if(p) {
                return p;
            }
        }
        return undefined;
    }

    public getPatternById(id: string): Pattern {
        let p : Pattern;
        for( let i = 0; i < this.domains.length; i++) {
            p = this.domains[i].getPatternById(id);
            if(p) {
                return p;
            }
        }
        return undefined;
    }

    public getDomainById(id: string): Domain {
        return this.domains.find(d => d.id === id);
    }

    public isValid(): boolean {
        return !!this.domains.find(d => !d.isValid());
    }

    public getAllConnections(): Connector[] {
        let connectors: Connector[];
        this.domainConnections.forEach( dc => connectors.push(dc));
        this.domains.forEach( (d) => {
            d.getAllConnections().forEach(dcn => connectors.push(dcn));
        });
        return connectors;
    }
}
