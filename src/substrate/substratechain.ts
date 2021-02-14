import { Block } from "./block";

import { ApiPromise, WsProvider } from "@polkadot/api";
import { SignedBlockExtended } from "@polkadot/api-derive"
import { VoidFn } from "@polkadot/api/types";

export class SubstrateChain {
    api: Promise<ApiPromise | void> | ApiPromise | void;

    private constructor(wsUrl: string) {
        const wsProvider = new WsProvider(wsUrl);
        this.api = ApiPromise.create({ provider: wsProvider }).catch((e) => { console.error(e); });
    }

    /**
     * Creates a new instance of SubstrateChain
     * @param wsUrl The WebSockets RPC URL of the node to connect to.
     */
    public static async create(wsUrl: string): Promise<SubstrateChain | undefined> {
        let constructed = new SubstrateChain(wsUrl);
        constructed.api = await constructed.api;
        if (!(constructed.api instanceof ApiPromise)) {
            return undefined;
        }
        return constructed;
    }

    /**
     * Gets the current block number.
     */
    public async getCurrentBlockNumber(): Promise<number> {
        this.api = <ApiPromise>this.api;
        return (await this.api.rpc.chain.getHeader()).number.toNumber();
    }

    /**
     * Gets the specified block.
     * @param number The block to get.
     */
    public async getBlock(number: number): Promise<Block> {
        this.api = <ApiPromise>this.api;
        let hash = await this.api.rpc.chain.getBlockHash(number);
        let block = await this.api.derive.chain.getBlock(hash);
        return new Block(block!, hash!);
    }

    /**
     * Listens for new blocks and calls a callback function when one is recieved.
     * @param callback The function to call when a new block is recieved. Funtion must take one parameter of type Block and return void.
     */
    public async livestreamBlocks(callback: (block: Block) => void | Promise<void>): Promise<VoidFn> {
        this.api = <ApiPromise>this.api;
        return await this.api.derive.chain.subscribeNewBlocks((block) => {
            callback(new Block(block, block.block.header.hash));
        });
    }
}
