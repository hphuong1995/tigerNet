export class Node {
    public id: string;
    public isActive: boolean;
    public isConnector: boolean;
    public get isDomainNode(): boolean {
        if (!this.id) { return false; }
        return !!this.id.match(/d.*/i);
    }
    constructor(isActive: boolean, isConnector: boolean, id: string) {
        this.id = id;
        this.isActive = isActive;
        this.isConnector = isConnector;
    }
}
