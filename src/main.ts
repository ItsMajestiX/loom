import { SubstrateChain } from "./substrate/substratechain";
import { ArweaveHandler } from "./arweave/arweavehandler"
import Transaction from 'arweave/node/lib/transaction';
import { DataItemJson } from "arweave-bundles";
import { argv } from "./cli/commands";
import { FileManager } from "./cli/files";
import { Block } from "./substrate/block";

class State {
    readonly substrate: SubstrateChain;
    readonly arweave: ArweaveHandler;
    readonly files: FileManager;

    s: number = Infinity;
    e: number = -Infinity;

    globalS: number = 0;
    globalE: number = Infinity;

    blocksAdded: number = 0;

    streamWhenDone: boolean = false;
    catchUp: boolean = false;

    constructor (substrate: SubstrateChain, arweave: ArweaveHandler, files: FileManager) {
        this.substrate = substrate;
        this.arweave = arweave;
        this.files = files;
    }
}

async function submit(state: State) {
    // Read blocks from disk
    let blocks = new Array<DataItemJson>();
    for (let i = state.s; i <= state.e; i++) {
        const block = await state.files.readBlock(i);
        if (block === undefined) {
            // Restore missing/corrupted block
            blocks.push(<DataItemJson>await state.arweave.createTxnFromBlock(await state.substrate.getBlock(i), true));
        }
        else {
            blocks.push(block);
        }
    }
    const txn = await state.arweave.createTxnFromBundle(blocks, state.substrate.chain, state.substrate.genHash, state.s, state.e, true);
    // Test mode check
    if (!argv.t) {
        await state.arweave.submitTxn(txn);
        if (argv.w) {
            await state.files.wipeBlocks();
        }
        await catchUp(state);
    }
    else {
        console.log(txn.toJSON());
        if (argv.w) {
            await state.files.wipeBlocks();
        }
    }

    state.blocksAdded = 0
    blocks = [];
    state.s = Infinity;
    state.e = -Infinity;
}

async function catchUp(state: State): Promise<void> {
    state.catchUp = true;
    state.globalS = state.globalE + 1
    state.globalE = await state.substrate.getCurrentBlockNumber();

    // Check if we're already caught up
    if (state.globalE < state.globalS) {
        state.catchUp = false;
    }
}

async function submitOneBlock(block: Block, state: State): Promise<void> {
    // Library mode check
    if (argv.library) {
        const txn = <Transaction>await state.arweave.createTxnFromBlock(block, false);
        // Test mode check
        if (!argv.t) {
            await state.arweave.submitTxn(txn);
            await catchUp(state);
        }
        else {
            console.log(txn.toJSON());
        }
    }
    else {
        // Save block
        const dataItem = <DataItemJson>await state.arweave.createTxnFromBlock(block, true);
        await state.files.writeBlock(dataItem, block.number);

        // Increment block counter, print info
        state.blocksAdded++;
        console.log(state.blocksAdded.toString() + "/" + argv.b!.toString() + " blocks added.");

        if (block.number < state.s) {
            state.s = block.number;
        }
        if (block.number > state.e) {
            state.e = block.number;
        }
        // Blocks per bundle
        if (state.blocksAdded >= argv.b!) {
            await submit(state);
        }
    }
}

async function main(): Promise<void> {
    const substrate = await SubstrateChain.create(argv.n);
    const arweave = await new ArweaveHandler({
        host: argv.a.hostname,
        port: argv.a.port,
        protocol: argv.a.protocol.slice(0, argv.a.protocol.length - 2)
    }, argv.k);
    const files = new FileManager(argv.d);

    let state = new State(substrate, arweave, files);

    do {
        if (!argv.stream || state.catchUp) {
            // Block loop
            state.globalS = argv.s!;
            if (!argv.e) {
                state.globalE = await state.substrate.getCurrentBlockNumber();
                state.streamWhenDone = true;
            }
            for (let i = state.globalS!; i <= state.globalE!; i++) {
                await submitOneBlock(await state.substrate.getBlock(i), state);
            }
        }
        // Streaming mode
        if (argv.stream || state.streamWhenDone) {
            substrate.livestreamBlocks(async (block) => {
                await submitOneBlock(block, state);
            });
        }
    } while (state.catchUp || state.streamWhenDone);

    // Send remaining transactions, if there are any
    if (state.blocksAdded !== 0) {
        await submit(state);
    }
}

try {
    main();
}
catch {
    process.exit(-1);
}