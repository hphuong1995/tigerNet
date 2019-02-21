import uuid from "uuid/v1";
export class SecurityAnswer {
    public id: string;
    public answer: string;
    public userId: string;
    public questionId: string;
    constructor(answer: string, userId: string, questionId: string, id?: string) {
        this.id = id || uuid();
        this.answer = answer;
        this.userId = userId;
        this.questionId = questionId;
    }
}
