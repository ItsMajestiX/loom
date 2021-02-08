export class BlockLog {
    index: number;

    type: string;
    value: string;

    constructor(type: string, value: string, index: number) {
        this.type = type;
        this.value = value;

        this.index = index;
    }
}