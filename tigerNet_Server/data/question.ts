import uuid from "uuid/v1";
export class Question {
    public id: string;
    public question: string;
    public incorrectlyGuessed: boolean;
    constructor(question: string, id?: string, incorrectGuess?: boolean) {
        this.id = id || uuid();
        this.question = question;
        if (incorrectGuess) {
            this.incorrectlyGuessed = true;
        } else {
            this.incorrectlyGuessed = false;
        }
    }
}
