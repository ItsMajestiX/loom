import { SubstrateChain } from "./substrate/substratechain";
import { ArweaveHandler } from "./arweave/arweavehandler"
import Transaction from 'arweave/node/lib/transaction';;
import { DataItemJson } from "arweave-bundles";
import { argv } from "./cli/commands";

async function main(): Promise<void> {
    let substrate = await SubstrateChain.create(argv.n);
    let arweave = await new ArweaveHandler({
        host: argv.A.hostname,
        port: argv.A.port,
        protocol: argv.A.protocol.slice(0, argv.A.protocol.length - 2)
    }, argv.k);

    let blocks: DataItemJson[] = new Array<DataItemJson>();
    let s = Infinity;
    let e = -Infinity;

    let streamWhenDone = false;

    if (!argv.s === undefined) {
        // Block loop
        if (argv.E === undefined) {
            argv.E = await substrate?.getCurrentBlockNumber();
            streamWhenDone = true;
        }
        for (let i = argv.S!; i <= argv.E!; i++) {
            // Library mode check
            if (argv.l) {
                let txn = <Transaction>await arweave.createTxnFromBlock(await substrate?.getBlock(i)!, false);
                // Test mode check
                if (!argv.t) {
                    arweave.submitTxn(txn);
                }
                else {
                    console.log(txn.toJSON());
                }
            }
            else {
                let block = await substrate?.getBlock(i)!;
                blocks.push(<DataItemJson>await arweave.createTxnFromBlock(await substrate?.getBlock(i)!, true));
                console.log(blocks.length.toString() + "/" + argv.b?.toString() + " blocks added.");
                console.log(block.number);
                if (block.number < s) {
                    s = block.number;
                }
                if (block.number > e) {
                    e = block.number;
                }
                if (blocks.length >= argv.b!) {
                    let txn = await arweave.createTxnFromBundle(blocks, s, e, true);
                    // Test mode check
                    if (!argv.t) {
                        arweave.submitTxn(txn);
                    }
                    else {
                        console.log(txn.toJSON());
                    }
                    blocks = [];
                    s = Infinity;
                    e = -Infinity;
                }
            }
        }
    }
    // Streaming mode
    if (argv.s || streamWhenDone) {
        substrate?.livestreamBlocks(async (block) => {
            // Library mode check
            if (argv.l) {
                let txn = <Transaction>await arweave.createTxnFromBlock(block, false);
                // Test mode check
                if (!argv.t) {
                    arweave.submitTxn(txn);
                }
                else {
                    console.log(txn.toJSON());
                }
            }
            else {
                blocks.push(<DataItemJson>await arweave.createTxnFromBlock(block, true));
                console.log(blocks.length.toString() + "/" + argv.b?.toString() + " blocks added.");
                if (block.number < s) {
                    s = block.number;
                }
                if (block.number > e) {
                    e = block.number;
                }
                // Blocks per bundle
                if (blocks.length >= argv.b!) {
                    let txn = await arweave.createTxnFromBundle(blocks, s, e, true);
                    // Test mode check
                    if (!argv.t) {
                        arweave.submitTxn(txn);
                    }
                    else {
                        console.log(txn.toJSON());
                    }
                    blocks = [];
                    s = Infinity;
                    e = -Infinity;
                }
            }
        });
    }
}

main();