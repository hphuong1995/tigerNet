export class Node {
    public id: string;
    public isActive: boolean;
    public isConnector: boolean;
    constructor(isActive: boolean, isConnector: boolean, id: string) {
        this.id = id;
        this.isActive = isActive;
        this.isConnector = isConnector;
    }
}
