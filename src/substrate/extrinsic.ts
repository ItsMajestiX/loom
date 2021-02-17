import { isSuccess, TxWithEvent } from './eventutil';

export class BlockExtrinsic {
    readonly index: number;
    readonly hash: string;
    readonly module: string;
    readonly method: string;

    readonly data: string;

    readonly from: string;
    readonly nonce: number;
    readonly signature: string;

    readonly success: boolean;
    readonly eventRange: [number, number];

    constructor(extrinsic: TxWithEvent, index: number, eventStart: number) {
        this.index = index;
        this.hash = extrinsic.extrinsic.hash.toHex()
        this.module = extrinsic.extrinsic.method.section;
        this.method = extrinsic.extrinsic.method.method;

        this.data = JSON.stringify(extrinsic.extrinsic.args);

        this.from = extrinsic.extrinsic.signer.toString();
        this.nonce = extrinsic.extrinsic.nonce.toNumber();
        this.signature = extrinsic.extrinsic.signature.toHex();

        this.success = isSuccess(extrinsic.events);
        this.eventRange = [eventStart, eventStart + extrinsic.events.length - 1]
    }
}