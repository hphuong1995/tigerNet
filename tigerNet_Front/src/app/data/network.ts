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

    public getDomainByChildNodeId( id: string) : Domain {
      let p : Pattern;
      for( let i = 0; i < this.domains.length; i++){
        p = this.domains[i].getPatternByChildNodeId(id);
        if(p) {
            return this.domains[i];
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
        if(this.domains.find(d => !d.isValid())) {
            return false;
        }
        // no duplicate connectors
        if(!Connector.checkDuplicateConnection(this.domainConnections)) {
            return false;
        }

        // connectors must all be valid
        for (const connector of this.domainConnections) {
            if(!connector.validateConnector()) {
                return false;
            }
        }

        // connectors must all connect to the network's domain nodes
        let domainNodeIds: string[] = this.domains.map( d => d.id );
        for (const connector of this.domainConnections) {
            if(!domainNodeIds.find( id => id === connector.id) && !domainNodeIds.find( id => id === connector.targetId)) {
                return false;
            }
        }


        if(this.domains.length < 2 && this.domainConnections.length == 0) {
            return true;
        }

        // all domains must be connected in some way
        let network: Connector[] = [];
        

        for(const connector of this.domainConnections) {
            if(network === [] || network.find( cn => cn.sharesEnd(connector))) {
                network.push(connector);
            }
        }
        if(network.length !== this.domainConnections.length) {
            return false;
        }

        let done: boolean = false;
        let conns = this.domainConnections.slice();
        network.push(conns.pop());
        while(!done) {
            done = true;
            let matchIndex: number = -1;
            // for(const connector of network) {//iterator may break when network is modified
            //     matchIndex = conns.findIndex( c => c.sharesEnd(connector));
            //     if(matchIndex) {
            //         network.push(conns[matchIndex])
            //         conns = conns.splice(matchIndex, 1);
            //         done = false;
            //     }
            // }
            for(let i = 0; i < network.length; i++) {
                matchIndex = conns.findIndex( c => c.sharesEnd(network[i]));
                if(matchIndex > -1) {
                    network.push(conns[matchIndex])
                    conns = conns.splice(matchIndex, 1);
                    done = false;
                }
            }
        }

        //these are stray connectors that share no nodes with the connectors in network
        if(conns.length > 0) {
            return false;
        }

        return true;
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
