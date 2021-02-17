import { Block } from "./block";

import { ApiPromise, WsProvider } from "@polkadot/api";
import { VoidFn } from "@polkadot/api/types";

import colors from "colors/safe";

export class SubstrateChain {
    readonly api: ApiPromise

    readonly chain: string;

    readonly genHash: string;

    private constructor(api: ApiPromise, chain: string, genHash: string) {
        this.api = api
        this.chain = chain
        this.genHash = genHash
    }

    /**
     * Creates a new instance of SubstrateChain
     * @param wsUrl The WebSockets RPC URL of the node to connect to.
     */
    public static async create(wsUrl: string): Promise<SubstrateChain | undefined> {
        const wsProvider = new WsProvider(wsUrl);
        try {
            const api = await ApiPromise.create({ provider: wsProvider });
            const constructed = new SubstrateChain(api, api.genesisHash.toHex(), (await api.rpc.system.chain()).toString());
            if (!(constructed.api instanceof ApiPromise)) {
                return undefined;
            }
            return constructed;
        }
        catch (e) {
            console.error(colors.red("Error connecting to Substrate node: " + e))
        }
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
        const hash = await this.api.rpc.chain.getBlockHash(number);
        const block = await this.api.derive.chain.getBlock(hash);
        return new Block(block!, hash!, chain, this.api.genesisHash.toHex());
    }

    /**
     * Listens for new blocks and calls a callback function when one is recieved.
     * @param callback The function to call when a new block is recieved. Funtion must take one parameter of type Block and return void.
     */
    public async livestreamBlocks(callback: (block: Block) => void | Promise<void>): Promise<VoidFn> {
        this.api = <ApiPromise>this.api;
        return await this.api.derive.chain.subscribeNewBlocks((block) => {
            this.api = <ApiPromise>this.api;
            callback(new Block(block, block.block.header.hash,));
        });
    }
}
