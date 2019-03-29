export class Connector {

    public static checkDuplicateConnection(connections: Connector[]): boolean {
        let retFlag: boolean = true;
        connections.forEach((con) => {
            let count = 0;
            connections.forEach((conToCheck) => {
                if (con.compareTo(conToCheck)) {
                    count++;
                }
            });
            if (count === 2) {
                retFlag = false;
            }
        });
        return retFlag;
    }

    public id: string;
    public targetId: string;
    constructor(id: string, targetId: string) {
        this.id = id;
        this.targetId = targetId;
    }

    public validateConnector() {
        return !(this.id === this.targetId);
    }

    public compareTo(other: Connector) {
        if (this.id === other.id && this.targetId === other.targetId) {
            return true;
        }
        if (this.id === other.targetId && this.targetId === other.id) {
            return true;
        }
        return false;
    }
}
