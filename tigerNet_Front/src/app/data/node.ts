import { Message } from './message';
export class Node {
    public id: string;
    public isActive: boolean;
    public isConnector: boolean;
    public messages: Message[] = [];
    public get isDomainNode(): boolean {
        if (!this.id) { return false; }
        return !!this.id.match(/d.*/i);
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
}