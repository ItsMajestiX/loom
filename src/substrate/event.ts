import type { Event } from '@polkadot/types/interfaces';

export class BlockEvent {
    readonly index: number;
    readonly extrinsic: number;

    readonly module: string;
    readonly method: string;

    readonly data: string;

    constructor(event: Event, index: number, extrinsicIndex: number) {
        this.index = index;
        this.extrinsic = extrinsicIndex;

        this.module = event.section;
        this.method = event.method;
        this.data = JSON.stringify(event.data);
    }
}