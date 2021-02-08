import { SubstrateChain } from "./substrate/substratechain";
import fs from "fs"
import { ArweaveHandler } from "./arweave/bundle";

async function main() {
    let test = await SubstrateChain.create('ws://localhost:9944');
    let block = await test!.getBlock(1);
    let jwk = fs.readFileSync(process.env.ARWEAVE_KEY_LOCATION!).toString();
    let test2 = await new ArweaveHandler(jwk);
    let txn = await test2.createTxnFromBlock(block);
    console.log(txn.toJSON());
}

main().then(() => { process.exit(0); });