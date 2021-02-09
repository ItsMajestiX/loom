import { SubstrateChain } from "./substrate/substratechain";
import fs from "fs"
import { ArweaveHandler } from "./arweave/arweavehandler";

async function main() {
    let substrate = await SubstrateChain.create('wss://rpc.polkadot.io');
    let jwk = fs.readFileSync(process.env.ARWEAVE_KEY_LOCATION!).toString();
    let arweave = await new ArweaveHandler(jwk);
    substrate?.livestreamBlocks(async (block) => { console.log(await arweave.createTxnFromBlock(block)); });
}

main();