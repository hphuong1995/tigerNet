import uuid from "uuid/v1";
export class User {
    public username: string;
    public id: string;
    public isAdmin: boolean;
    public isBlocked: boolean;
    constructor( username: string, isAdmin: boolean, isBlocked: boolean, id?: string) {
        this.username = username;
        this.id = id || uuid();
        this.isBlocked = isBlocked;
        this.isAdmin = isAdmin;
    }
}
