import { Node } from './node';
import { Connector } from './connector'
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
    public static getConnectorNode(pattern: Pattern): Node {
        return pattern.nodes.find( (node: Node) => {
            return node.isConnector;
        });
    }
}