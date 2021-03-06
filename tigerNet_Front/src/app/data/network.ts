import { Connector } from './connector';
import { Pattern } from './pattern';
import { Domain } from './domain';
import { Node } from './node';
import { PatternsComponent } from '../component/patterns/patterns.component';
export class Network {
    public domainConnections: Connector[];
    public domains: Domain[];
    private cytoscape: any;
    constructor(domains: Domain[], domainConnections: Connector[]) {
        // this.domains = domains.map(p => new Pattern(p.id, p.nodes, p.connections));
        this.domains = domains.map(d => new Domain(d.id, d.patterns, d.domainNode, d.patternConnections));
        this.domainConnections = domainConnections.map(dc => new Connector(dc.id, dc.targetId));
    }

    public getPatternByChildNodeId(id: string): Pattern {
        let p: Pattern;
        for (let i = 0; i < this.domains.length; i++) {
            p = this.domains[i].getPatternByChildNodeId(id);
            if (p) {
                return p;
            }
        }
        return undefined;
    }

    public getDomainByChildNodeId(id: string): Domain {
        let p: Pattern;
        for (let i = 0; i < this.domains.length; i++) {
            if(this.domains[i].domainNode.id === id) {
                return this.domains[i];
            }
            p = this.domains[i].getPatternByChildNodeId(id);
            if (p) {
                return this.domains[i];
            }
        }
        return undefined;
    }

    public getDomainByPatternId(id: string): Domain {
        for (let domain of this.domains) {
            if(domain.patterns.find( p => p.id === id)) {
                return domain;
            }
        }
        return undefined;
    }

    public getNodeById(id: string): Node {
        for( let domain of this.domains) {
            if(domain.domainNode.id === id) {
                return domain.domainNode;
            }
            for( let pattern of domain.patterns ) {
                let node: Node = pattern.getNodeById(id);
                if(node) {
                    return node;
                }
            }
        }
        return undefined;
    }

    public getPatternById(id: string): Pattern {
        let p: Pattern;
        for (let i = 0; i < this.domains.length; i++) {
            p = this.domains[i].getPatternById(id);
            if (p) {
                return p;
            }
        }
        return undefined;
    }

    public getDomainById(id: string): Domain {
        return this.domains.find(d => d.id === id);
    }

    public getDomainNodeById(id: string): Node {
        return this.domains.find(d => d.domainNode.id === id).domainNode;
    }

    public addCytoscape(cytoscape: any) {
        this.cytoscape = cytoscape;
        this.domains.forEach( d => d.addCytoscape(cytoscape));
    }

    public isValid(): boolean {
        if (this.domains.find(d => !d.isValid())) {
            return false;
        }
        // no duplicate connectors
        if (!Connector.checkDuplicateConnection(this.domainConnections)) {
            return false;
        }

        // connectors must all be valid
        for (const connector of this.domainConnections) {
            if (!connector.validateConnector()) {
                return false;
            }
        }

        // connectors must all connect to the network's domain nodes
        let domainNodeIds: string[] = this.domains.map(d => d.domainNode.id);
        for (const connector of this.domainConnections) {
            if (!domainNodeIds.find(id => id === connector.id) && !domainNodeIds.find(id => id === connector.targetId)) {
                return false;
            }
        }


        if (this.domains.length < 2 && this.domainConnections.length == 0) {
            return true;
        }
        if (this.domains.length < 2) {
            return this.domainConnections.length === 0;
        } else {
            if (this.domainConnections.length === 0) {//more than two domains but no connections
                return false;
            }
        }

        // all domains must be connected in some way
        let network: Connector[] = [];

        let removeConnectedConnector: (connectors: Connector[], connectedTo: Connector) => void = (connectors, connectedTo) => {
            let index: number = connectors.findIndex(cn => cn.sharesEnd(connectedTo));
            if(index === -1) {
                return;
            }
            connectors.splice(1,1);
        }
        
        // // ###FIXME bug here
        // for (const connector of this.domainConnections) {
        //     if (network.length === 0 || network.find(cn => cn.sharesEnd(connector))) {
        //         network.push(connector);
        //     }
        // }

        if(!this.checkDomainIsolate()){
          return false;
        }

        let done: boolean = false;
        let conns = this.domainConnections.slice();
        network.push(conns.pop());
        while (!done) {
            done = true;
            let matchIndex: number = -1;

            for (let i = 0; i < network.length; i++) {
                matchIndex = conns.findIndex(c => c.sharesEnd(network[i]));
                if (matchIndex > -1) {
                    network.push(conns[matchIndex])
                    conns.splice(matchIndex, 1);
                    done = false;
                }
            }
        }

        //these are stray connectors that share no nodes with the connectors in network
        if (conns.length > 0) {
            return false;
        }

        return true;
    }

    private checkDomainIsolate(){
      var domainNodeQueue : string[] = [];
      var readList : string[] = [];

      domainNodeQueue.push(this.domains[0].domainNode.id);

      while( domainNodeQueue.length != readList.length){
        var currentNode : string;
        var i;
        // find a domain that havent readList
        for(i = 0; i < domainNodeQueue.length; i++){
          if(!readList.includes(domainNodeQueue[i])){
            currentNode = domainNodeQueue[i];
            readList.push(currentNode);
            console.log(readList);
            break;
          }
        }

        this.domainConnections.forEach( (connection : Connector) =>{
          if(connection.id === currentNode && !domainNodeQueue.includes(connection.targetId)){
            domainNodeQueue.push(connection.targetId);
          }

          if(connection.targetId === currentNode && !domainNodeQueue.includes(connection.id)){
            domainNodeQueue.push(connection.id);
          }
        });
      }

      if(domainNodeQueue.length === this.domains.length){
        console.log("valid " + domainNodeQueue);
        return true;
      }
      else{
        console.log("invalid " + domainNodeQueue);
        return false;
      }

    }

    public getAllConnections(): Connector[] {
        let connectors: Connector[];
        this.domainConnections.forEach(dc => connectors.push(dc));
        this.domains.forEach((d) => {
            d.getAllConnections().forEach(dcn => connectors.push(dcn));
        });
        return connectors;
    }

    // Returns connectors for which both ends connected to active nodes
    private getActiveConnections(): Connector[] {
        return this.domainConnections.filter( cn => {
            // return this.getNodeById(cn.id).isActive && this.getNodeById(cn.targetId).isActive;
            return this.getDomainNodeById(cn.id).isActive && this.getDomainNodeById(cn.targetId).isActive
        });
    }

    /*
     * Returns a list of nodes representing the shortest path between and including the start and end nodes
     * The list is in reverse order like this:
     *     [end, node, node, node, start]
     * Calling list.pop() repeatedly dumps out the nodes in order.
     *
     * To get an in-order version of the array for iteration call the function like this:
     *     path: Node[] = network.getPath(...).reverse();
     * To get an in-order list of node ids of the path:
     *     path: string[] = network.getPath(...).map( n => n.id ).reverse();
     */
    public getPath(start: string, end: string) : Node[] {
        let path: Node[] = [];
        let startDomain: Domain = this.getDomainByChildNodeId(start);
        let endDomain: Domain = this.getDomainByChildNodeId(end);
        if(!startDomain || !endDomain) {
            return [];//invalid node
        }
        if(startDomain.id === endDomain.id) {
            return startDomain.getPath(start, end) || [];
        }
        let section: Node[] = [];
        path = startDomain.getPathToDomainNode(start);

        section = this.domToDomPath(startDomain.domainNode, endDomain.domainNode);
        if(!section) return [];
        section.pop();
        path = section.concat(path);

        section = endDomain.getPath(endDomain.domainNode.id, end);
        if(!section) return [];
        section.pop();
        path = section.concat(path);

        return path || [];
    }

    private domToDomPath(start: Node, end: Node): Node[] {
        return this._domToDomPath(start, end, this.getActiveConnections());
    }

    private _domToDomPath(current: Node, end: Node, untraversed: Connector[]): Node[] {
        let shortestPath: Node[] = [];
        let paths: Node[][] = [];
        if(current.id === end.id) {
            if(end.isActive) {
                return [end];
            } else {
                return undefined;
            }
        }
        if(!untraversed || untraversed.length === 0) {
            return undefined;
        }
        let traversing: Connector[] = untraversed.transfer( x => current.id === x.id || current.id === x.targetId );
        for(const c of traversing) {
            let nextNodeId = current.id === c.id? c.targetId : c.id;
            let p: Node[] = this._domToDomPath(this.getDomainNodeById(nextNodeId), end, untraversed.slice(0));
            if(p !== undefined/* && p.length > 0*/) {
                p.push(current);
                paths.push(p);
            }
        }
        if(paths.length === 0) {
            return undefined;
        }
        let shortestPathLen = 10000;
        for(const p of paths) {
            if(p.length < shortestPathLen) {
                shortestPathLen = p.length;
                shortestPath = p;
            }
        }
        return shortestPath;
    }
}
