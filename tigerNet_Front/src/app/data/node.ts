export class Node {
    public id: string;
    public isActive: boolean;
    public isConnector: boolean;
    constructor(id: string, isActive: boolean, isConnector: boolean) {
        this.id = id;
        this.isActive = isActive;
        this.isConnector = isConnector;
    }
}