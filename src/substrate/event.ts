import type { Event } from '@polkadot/types/interfaces';

export class BlockEvent {
    index: number;
    extrinsic: number;

    module: string;
    method: string;

    data: string;

    constructor(event: Event, index: number, extrinsicIndex: number) {
        this.index = index;
        this.extrinsic = extrinsicIndex;

        this.module = event.section;
        this.method = event.method;
        this.data = JSON.stringify(event.data);
    }
}