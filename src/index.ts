import { SubstrateChain } from "./substrate/substratechain";
import { ArweaveHandler } from "./arweave/arweavehandler"
import Transaction from 'arweave/node/lib/transaction';;
import { DataItemJson } from "arweave-bundles";
import { CommandType, argv } from "./cli/commands";
import colors from "colors/safe";

async function main(args: CommandType): Promise<void> {
    let substrate = await SubstrateChain.create(args.n);
    let arweave = await new ArweaveHandler(args.k);
    if (args.s) {
        let blocks: DataItemJson[] = new Array<DataItemJson>();
        let s = Infinity;
        let e = -Infinity;
        substrate?.livestreamBlocks(async (block) => { 
            if (args.l) {
                let txn = <Transaction>await arweave.createTxnFromBlock(block, false);
                if (!args.t) {
                    arweave.submitTxn(txn, (uploader) => {
                        if (uploader.isComplete) {
                            console.log(colors.green("Uploaded block " + block.number.toString() + " as library to Arweave."))
                        }
                        else if (uploader.lastResponseError !== "") {
                            console.log(colors.red("Error uploading blocks to Arweave. " + uploader.lastResponseError));
                        }
                        else {
                            console.log(uploader.pctComplete.toString() + "% done uploading, " + uploader.uploadedChunks + '/' + uploader.totalChunks + ' chunks.');
                        }
                    })
                }
                else {
                    console.log(txn.toJSON());
                }
            }
            /*blocks.push(<DataItemJson>await arweave.createTxnFromBlock(block, true));
            if (block.number < s) {
                s = block.number;
            }
            if (block.number > e) {
                e = block.number;
            }
            if (blocks.length >= args.b!) {
                console.log(await arweave.createTxnFromBundle(blocks, s, e, true));
                blocks = [];
                s = Infinity;
                e = -Infinity;
            }*/
        });
    }
    else {

    }
}

main(argv);