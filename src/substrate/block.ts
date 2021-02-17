import { BlockEvent } from "./event";
import { BlockExtrinsic } from "./extrinsic";
import { BlockLog } from "./log";

import { SignedBlockExtended } from "@polkadot/api-derive/type";
import { BlockHash } from "@polkadot/types/interfaces";

export class Block {
    readonly time: number | undefined;
    readonly number: number;

    readonly hash: BlockHash;
    readonly parentHash: BlockHash;
    readonly stateRoot: BlockHash;
    readonly extrinsicsRoot: BlockHash;

    readonly author: string | undefined;

    readonly extrinsics: BlockExtrinsic[];
    readonly events: BlockEvent[];
    readonly logs: BlockLog[];

    constructor(block: SignedBlockExtended, hash: BlockHash, chain: string, genHash: string) {
        if (block?.block.extrinsics.length) {
            this.time = +block?.block.extrinsics[0].args[0].toString();
        }

        this.number = block.block.header.number.toNumber();

        this.hash = hash;
        this.parentHash = block.block.header.parentHash;
        this.stateRoot = block.block.header.stateRoot;
        this.extrinsicsRoot = block.block.header.extrinsicsRoot;
        this.author = block.author?.toString();
        let eventCount = 0;
        this.extrinsics = new Array<BlockExtrinsic>();
        this.events = new Array<BlockEvent>();
        this.logs = new Array<BlockLog>();

        block.extrinsics.forEach((extrisic, index) => {
            this.extrinsics.push(new BlockExtrinsic(extrisic, index, eventCount));
            extrisic.events.forEach((e) => {
                this.events.push(new BlockEvent(e, eventCount, index));
                eventCount += 1;
            }, this);
        }, this);
        block.block.header.digest.logs.forEach((e, index) => {
            this.logs.push(new BlockLog(e.type, e.value.toString(), index));
        }, this);
    }
}