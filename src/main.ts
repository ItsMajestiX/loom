import { SubstrateChain } from "./substrate/substratechain";
import { ArweaveHandler } from "./arweave/arweavehandler"
import Transaction from 'arweave/node/lib/transaction';;
import { DataItemJson } from "arweave-bundles";
import { argv } from "./cli/commands";
import { FileManager } from "./cli/files";

async function main(): Promise<void> {
    let substrate = await SubstrateChain.create(argv.n);
    let arweave = await new ArweaveHandler({
        host: argv.A.hostname,
        port: argv.A.port,
        protocol: argv.A.protocol.slice(0, argv.A.protocol.length - 2)
    }, argv.k);
    let files = new FileManager(argv.d);


    let s = Infinity;
    let e = -Infinity;
    let blocksAdded = 0;

    let streamWhenDone = false;

    if (argv.s === undefined) {
        // Block loop
        if (argv.E === undefined) {
            argv.E = await substrate!.getCurrentBlockNumber();
            streamWhenDone = true;
        }
        for (let i = argv.S!; i <= argv.E!; i++) {
            // Library mode check
            if (argv.l) {
                let txn = <Transaction>await arweave.createTxnFromBlock(await substrate!.getBlock(i)!, false);
                // Test mode check
                if (!argv.t) {
                    arweave.submitTxn(txn);
                }
                else {
                    console.log(txn.toJSON());
                }
            }
            else {
                // Get a block and save it
                let block = await substrate!.getBlock(i);
                let dataItem = <DataItemJson>await arweave.createTxnFromBlock(block, true);
                await files.writeBlock(dataItem, block!.number);

                // Increment block counter, print info
                blocksAdded++;
                console.log(blocksAdded.toString() + "/" + argv.b!.toString() + " blocks added.");

                // Check whether to set new boundary (this isn't really needed, but just in case)
                if (block.number < s) {
                    s = block.number;
                }
                if (block.number > e) {
                    e = block.number;
                }
                if (blocksAdded >= argv.b!) {
                    // Read blocks from disk
                    let blocks = new Array<DataItemJson>();
                    for (let i = s; i <= e; i++) {
                        let block = await files.readBlock(i);
                        if (block === undefined) {
                            blocks.push(<DataItemJson>await arweave.createTxnFromBlock(await substrate!.getBlock(i), true));
                        }
                        else {
                            blocks.push(block);
                        }
                    }
                    let txn = await arweave.createTxnFromBundle(blocks, s, e, true);
                    // Test mode check
                    if (!argv.t) {
                        arweave.submitTxn(txn);
                        await files.wipeBlocks();
                    }
                    else {
                        console.log(txn.toJSON());
                        await files.wipeBlocks();
                    }

                    blocksAdded = 0;
                    blocks = [];
                    s = Infinity;
                    e = -Infinity;
                }
            }
        }
    }
    // Streaming mode
    if (argv.s || streamWhenDone) {
        substrate!.livestreamBlocks(async (block) => {
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
                // Save block
                let dataItem = <DataItemJson>await arweave.createTxnFromBlock(block, true);
                await files.writeBlock(dataItem, block.number);

                // Increment block counter, print info
                blocksAdded++;
                console.log(blocksAdded.toString() + "/" + argv.b!.toString() + " blocks added.");

                if (block.number < s) {
                    s = block.number;
                }
                if (block.number > e) {
                    e = block.number;
                }
                // Blocks per bundle
                if (blocksAdded >= argv.b!) {
                    // Read blocks from disk
                    let blocks = new Array<DataItemJson>();
                    for (let i = s; i <= e; i++) {
                        let block = await files.readBlock(i);
                        if (block === undefined) {
                            blocks.push(<DataItemJson>await arweave.createTxnFromBlock(await substrate!.getBlock(i), true));
                        }
                        else {
                            blocks.push(block);
                        }
                    }
                    let txn = await arweave.createTxnFromBundle(blocks, s, e, true);
                    // Test mode check
                    if (!argv.t) {
                        arweave.submitTxn(txn);
                        await files.wipeBlocks();
                    }
                    else {
                        console.log(txn.toJSON());
                        await files.wipeBlocks();
                    }

                    blocksAdded = 0
                    blocks = [];
                    s = Infinity;
                    e = -Infinity;
                }
            }
        });
    }
}

main();