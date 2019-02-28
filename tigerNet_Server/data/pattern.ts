import { Connector } from "./connector";
import { Node } from "./node";
export class Pattern {
    public static getConnectorNode(pattern: Pattern): Node {
        return pattern.nodes.find( (node: Node) => {
            return node.isConnector;
        });
    }
    public id: string;
    public nodes: Node[];
    public connections: Connector[];
    constructor(id: string, nodes: Node[], connections: Connector[]) {
        // add code to validate pattern
        this.id = id;
        this.nodes = nodes;
        this.connections = connections;
    }
}
