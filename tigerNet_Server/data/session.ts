export class Session {
    public sid: string;
    public csrf: string;
    constructor(sessionId: string, csrfToken: string) {
        this.sid = sessionId;
        this.csrf = csrfToken;
    }
}
