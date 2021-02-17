export class BlockLog {
    readonly index: number;

    readonly type: string;
    readonly value: string;

    constructor(type: string, value: string, index: number) {
        this.type = type;
        this.value = value;

        this.index = index;
    }
}