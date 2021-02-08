import Arweave from 'arweave';
import Transaction from 'arweave/node/lib/transaction';
import { TransactionUploader } from 'arweave/node/lib/transaction-uploader';
import deepHash from 'arweave/node/lib/deepHash';
import ArweaveBundles, { DataItemJson } from 'arweave-bundles';
import { Block } from '../substrate/block';
import { JWKPublicInterface } from 'arweave-bundles/lib/interface-jwk';
import { BlockExtrinsic } from '../substrate/extrinsic';
import { BlockEvent } from '../substrate/event';
import { BlockLog } from '../substrate/log';

import colors from "colors/safe";
import async from "async";

export class ArweaveHandler {
    arBundles = ArweaveBundles({
        utils: Arweave.utils,
        crypto: Arweave.crypto,
        deepHash: deepHash,
    });

    arweave: Arweave;
    wallet: JWKPublicInterface;

    public constructor(wallet: string) {
        this.arweave = Arweave.init({
            host: 'arweave.net',
            port: 443,
            protocol: 'https'
        });
        try {
            this.wallet = <JWKPublicInterface>JSON.parse(wallet);
        }
        catch {
            console.error(colors.red("ERROR: The JSON file that was provided does not contain a valid Arweave private key."))
            process.exit(-1);
        }
    }

    private addBlockTags(block: Block, txn: Transaction): void {
        txn.addTag("number", block.number.toString());
    
        txn.addTag("hash", block.hash.toString());
        txn.addTag("parentHash", block.parentHash.toString());
        txn.addTag("stateRoot", block.stateRoot.toString());
        txn.addTag("extrinsicsRoot", block.extrinsicsRoot.toString());
        
        if (block.time !== undefined) {
            txn.addTag("time", block.time.toString());
        }
        if (block.author !== undefined) {
            txn.addTag("author", block.author);
        }
    }

    private addExtrinsicTags(extrisic: BlockExtrinsic, item: DataItemJson): void {
        this.arBundles.addTag(item, "index", extrisic.index.toString());
        this.arBundles.addTag(item, "hash", extrisic.hash);
        this.arBundles.addTag(item, "module", extrisic.module);
        this.arBundles.addTag(item, "method", extrisic.method);

        this.arBundles.addTag(item, "from", extrisic.from);
        this.arBundles.addTag(item, "nonce", extrisic.nonce.toString());
        this.arBundles.addTag(item, "signature", extrisic.signature);

        this.arBundles.addTag(item, "success", extrisic.index.toString());
        this.arBundles.addTag(item, "eventStart", extrisic.eventRange[0].toString());
        this.arBundles.addTag(item, "eventEnd", extrisic.eventRange[1].toString());
    }

    private addEventTags(event: BlockEvent, item: DataItemJson): void {
        this.arBundles.addTag(item, "index", event.index.toString());
        this.arBundles.addTag(item, "extrinsic", event.extrinsic.toString());
        this.arBundles.addTag(item, "module", event.module);
        this.arBundles.addTag(item, "method", event.method);
    }

    private addLogTags(log: BlockLog, item: DataItemJson): void {
        this.arBundles.addTag(item, "index", log.index.toString());
        this.arBundles.addTag(item, "type", log.type);
    }

    public async createTxnFromBlock(block: Block): Promise<Transaction> {
        let taggedExtrinsics = new Array<DataItemJson>();
        let taggedEvents = new Array<DataItemJson>();
        let taggedLogs = new Array<DataItemJson>();

        await async.each(block.extrinsics, async extrinsic => {
            let temp = await this.arBundles.createData({data: extrinsic.data}, this.wallet);
            this.addExtrinsicTags(extrinsic, temp);
            taggedExtrinsics.push(await this.arBundles.sign(temp, this.wallet));
        });
        await async.each(block.events, async event => {
            let temp = await this.arBundles.createData({data: event.data}, this.wallet);
            this.addEventTags(event, temp);
            taggedEvents.push(await this.arBundles.sign(temp, this.wallet));
        });
        await async.each(block.logs, async log => {
            let temp = await this.arBundles.createData({data: log.value}, this.wallet);
            this.addLogTags(log, temp);
            taggedLogs.push(await this.arBundles.sign(temp, this.wallet));
        });

        let bundle = await this.arBundles.bundleData(new Array<DataItemJson>().concat(taggedExtrinsics).concat(taggedEvents).concat(taggedLogs));
        //what's shown on github doesn't work, so use the solution found here: https://github.com/TheLoneRonin/SolarweaveBridge/blob/f1877a0c4a594cc2302623712a6c974828cf8aa0/src/service/Arweave.service.ts#L44
        let txn = await this.arweave.createTransaction({ data: JSON.stringify(bundle) }, this.wallet);

        txn.addTag('Bundle-Format', 'json');
        txn.addTag('Bundle-Version', '1.0.0');
        txn.addTag('Content-Type', 'application/json');

        this.addBlockTags(block, txn);
        await this.arweave.transactions.sign(txn, this.wallet);

        return txn;
    }

    public async submitTxn(txn: Transaction, callback: (callback: TransactionUploader) => void): Promise<void> {
        let uploader = await this.arweave.transactions.getUploader(txn);
        while (!uploader.isComplete) {
            await uploader.uploadChunk();
            callback(uploader);
        }
    }
    
}