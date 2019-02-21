export class Err {
    public message: string;
    public status: number;
    constructor(message: string, statusCode: number) {
        this.message = message;
        this.status = statusCode;
    }
}
