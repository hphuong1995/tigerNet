export class Message {
    public id: string;
    public sender: string;
    public destination: string;
    private _body: string;

    constructor(sender: string, destination: string, body: string, id: string) {
        this.id = id;
        this.sender = sender;
        this.destination = destination;
        this.body = body;
    }

    public get body(): string {
        return this._body;
    }
    public set body(value: string) {
        if (!value) {
            this._body = value;
        } else {
            this._body = value.substr(0, 49);
        }
    }
}
