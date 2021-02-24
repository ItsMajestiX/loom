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

    // This code copied from https://spin.atomicobject.com/2020/01/16/timeout-promises-nodejs/ and modified
    private static promiseWithTimeout <T>(timeoutMs: number, promise: Promise<T>, failureMessage?: string) { 
        let timeoutHandle: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((resolve, reject) => {
            timeoutHandle = setTimeout(() => reject(new Error(failureMessage)), timeoutMs);
        });
      
        return Promise.race([ 
            promise, 
            timeoutPromise, 
        ]).then((result) => {
            clearTimeout(timeoutHandle);
            return result;
        }); 
    }

    /**
     * Creates a new instance of SubstrateChain
     * @param wsUrl The WebSockets RPC URL of the node to connect to.
     */
    public static async create(wsUrl: string): Promise<SubstrateChain> {
        const wsProvider = new WsProvider(wsUrl);
        try {
            const api = await SubstrateChain.promiseWithTimeout(10000, ApiPromise.create({ provider: wsProvider }), 
            "Timed out connecting to the substrate node. Check your node address.");
            try {
                // Should catch non-archive nodes
                api.rpc.chain.getBlockHash(5);
            }
            catch {
                console.error(colors.red("The substrate node provided is not an archive node."));
                throw new Error();
            }
            const constructed = new SubstrateChain(api, (await api.rpc.system.chain()).toString(), api.genesisHash.toHex());
            return constructed;
        }
        catch (e) {
            console.error(colors.red("Error connecting to Substrate node: " + e));
            throw new Error();
        }
    }

    /**
     * Gets the current block number.
     */
    public async getCurrentBlockNumber(): Promise<number> {
        return (await this.api.rpc.chain.getHeader()).number.toNumber();
    }

    /**
     * Gets the specified block.
     * @param number The block to get.
     */
    public async getBlock(number: number): Promise<Block> {
        const hash = await this.api.rpc.chain.getBlockHash(number);
        const block = await this.api.derive.chain.getBlock(hash);
        return new Block(block!, hash!, this.chain, this.genHash);
    }

    /**
     * Listens for new blocks and calls a callback function when one is received.
     * @param callback The function to call when a new block is recieved. Function must take one parameter of type Block and return void.
     */
    public async livestreamBlocks(callback: (block: Block) => void | Promise<void>): Promise<VoidFn> {
        return await this.api.derive.chain.subscribeNewBlocks((block) => {
            callback(new Block(block, block.block.header.hash, this.chain, this.genHash));
        });
    }
}
