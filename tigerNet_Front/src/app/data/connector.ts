export class Connector {
    public id: string;
    public targetId: string;
    constructor(id: string, targetId: string) {
        this.id = id;
        this.targetId = targetId;
    }

    public validateConnector(): boolean {
        return !(this.id === this.targetId);
    }

    public compareTo(other: Connector): boolean {
        if (this.id === other.id && this.targetId === other.targetId) {
            return true;
        }
        if (this.id === other.targetId && this.targetId === other.id) {
            return true;
        }
        return false;
    }

    public sharesEnd(other: Connector): boolean {
        return other.id === this.id
            || other.id === this.targetId
            || other.targetId === this.id
            || other.targetId === this.targetId
    }

    public hasEnd(id: string): boolean {
        return this.id === id || this.targetId === id;
    }

    public static compare(conn: Connector, other: Connector): boolean {
        if (conn.id === other.id && conn.targetId === other.targetId) {
            return true;
        }
        if (conn.id === other.targetId && conn.targetId === other.id) {
            return true;
        }
        return false;
    }

    /* Returns false for duplicates, true for no duplicates */
    public static checkDuplicateConnection(connections: Connector[]): boolean {
        var retFlag: boolean = true;
        connections.forEach(con => {
            var count = 0;
            connections.forEach(conToCheck => {
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
}
