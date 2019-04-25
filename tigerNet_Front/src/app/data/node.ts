import { Message } from './message';
import { Position } from './position';
export class Node {
    public id: string;
    public isActive: boolean;
    public isConnector: boolean;
    public messages: Message[] = [];
    private cytoscape: any;
    
    public get isDomainNode(): boolean {
        if (!this.id) { return false; }
        return !!this.id.match(/d.*/i);
    }

    public get CytoNode(): any {
        return this.cytoscape.$('#' + this.id);
    }

    public get Position(): Position {
        return <Position>this.CytoNode.position();
    }

    public set Position( position: Position) {
        this.CytoNode.position(position);
    }

    constructor(isActive: boolean, isConnector: boolean, id: string) {
        this.id = id;
        this.isActive = isActive;
        this.isConnector = isConnector;
    }

    public addMessage(message: Message): boolean {
        if(message.destination === this.id && !this.messages.find(m => m.id === message.id)) {
            this.messages.push(message);
            return true;
        }
        return false;
    }

    public addCytoscape(cytoscape: any) {
        this.cytoscape = cytoscape;
    }
}