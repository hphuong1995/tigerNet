import { Node } from './node';
import { Connector } from './connector'
import { NodesComponent } from '../component/nodes/nodes.component';
export class Pattern {
    public id: string;
    public nodes: Node[];
    public connections: Connector[];
    constructor(id: string, nodes: Node[], connections: Connector[]) {
        //add code to validate pattern
        this.id = id;
        this.nodes = nodes;
        this.connections = connections;
    }
    // public getConnectorNode(): Node {
    //     return this.nodes.find( (node: Node) => {
    //         return node.isConnector;
    //     });
    // }
    public static getConnectorNode(pattern: Pattern): Node {
        return pattern.nodes.find( (node: Node) => {
            return node.isConnector;
        });
    }
}