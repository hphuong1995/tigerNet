export class Connector {
    public id: string;
    public targetId: string;
    constructor(id: string, targetId: string) {
        this.id = id;
        this.targetId = targetId;
    }
}