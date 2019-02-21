import { Question } from "./question";
export class ClientQuestion {
    public id: string;
    public question: string;
    constructor(question: Question) {
        this.id = question.id;
        this.question = question.question;
    }
}
