import { BlockEvent } from "./event";
import { BlockExtrinsic } from "./extrinsic";
import { BlockLog } from "./log";

import { SignedBlockExtended } from "@polkadot/api-derive/type";
import { BlockHash } from "@polkadot/types/interfaces";

export class Block {
    readonly chain: string;
    readonly genHash: string;

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
        if (block?.block.extrinsics.length && block?.block.extrinsics[0].method.section === "timestamp") {
            // remember to remove stupid console.log statements before committing
            this.time = +block?.block.extrinsics[0].args[0].toString();
        }

        this.chain = chain;
        this.genHash = genHash;
        
        this.number = block.block.header.number.toNumber();

        this.hash = hash;
        this.parentHash = block.block.header.parentHash;
        this.stateRoot = block.block.header.stateRoot;
        this.extrinsicsRoot = block.block.header.extrinsicsRoot;
        this.author = block.author?.toString();
        this.extrinsics = new Array<BlockExtrinsic>();
        this.events = new Array<BlockEvent>();
        this.logs = new Array<BlockLog>();

        let eventCount = 0;
        block.extrinsics.forEach((extrinsic, index) => {
            this.extrinsics.push(new BlockExtrinsic(extrinsic, index, eventCount));
            extrinsic.events.forEach((e) => {
                this.events.push(new BlockEvent(e, eventCount, index));
                eventCount += 1;
            }, this);
        }, this);
        block.block.header.digest.logs.forEach((e, index) => {
            this.logs.push(new BlockLog(e.type, e.value.toString(), index));
        }, this);
    }
}