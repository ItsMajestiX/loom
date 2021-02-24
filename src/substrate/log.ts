export class BlockLog {
    readonly index: number;

    readonly type: string;
    readonly data: string;

    constructor(type: string, data: string, index: number) {
        this.type = type;
        this.data = data;

        this.index = index;
    }
}