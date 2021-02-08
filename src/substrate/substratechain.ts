import { ApiPromise, WsProvider } from "@polkadot/api";
import { Block } from "./block";

export class SubstrateChain {
    api: Promise<ApiPromise | void> | ApiPromise | void;

    private constructor(wsUrl: string) {
        const wsProvider = new WsProvider(wsUrl);
        this.api = ApiPromise.create({ provider: wsProvider }).catch((e) => { console.error(e); });
    }

    public static async create(wsUrl: string): Promise<SubstrateChain | undefined> {
        let constructed = new SubstrateChain(wsUrl);
        constructed.api = await constructed.api;
        if (!(constructed.api instanceof ApiPromise)) {
            return undefined;
        }
        return constructed;
    }

    public async getBlock(number: number): Promise<Block> {
        this.api = <ApiPromise>this.api;
        let hash = await this.api.rpc.chain.getBlockHash(number);
        let block = await this.api.derive.chain.getBlock(hash);
        return new Block(block!, hash!);
    }
}
