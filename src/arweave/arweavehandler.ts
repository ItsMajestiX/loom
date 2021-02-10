import Arweave from 'arweave';
import Transaction from 'arweave/node/lib/transaction';
import { TransactionUploader } from 'arweave/node/lib/transaction-uploader';
import deepHash from 'arweave/node/lib/deepHash';
import ArweaveBundles, { DataItemJson } from 'arweave-bundles';
import { Block } from '../substrate/block';
import { JWKPublicInterface }  from 'arweave-bundles/lib/interface-jwk'

import colors from "colors/safe";
import { compressBundle } from './compression';

interface BundleSettings {
    compressed: boolean;
    startBlock: string;
    endBlock: string;
}

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

    private addTransactionTags(block: Block, txn: Transaction): void {
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

    private addDataItemTags(block: Block, txn: DataItemJson): void {
        this.arBundles.addTag(txn, "number", block.number.toString());
    
        this.arBundles.addTag(txn, "hash", block.hash.toString());
        this.arBundles.addTag(txn, "parentHash", block.parentHash.toString());
        this.arBundles.addTag(txn, "stateRoot", block.stateRoot.toString());
        this.arBundles.addTag(txn, "extrinsicsRoot", block.extrinsicsRoot.toString());
        
        if (block.time !== undefined) {
            this.arBundles.addTag(txn, "time", block.time.toString());
        }
        if (block.author !== undefined) {
            this.arBundles.addTag(txn, "author", block.author);
        }
    }

    private addBundleTags(txn: Transaction, settings: BundleSettings): void {
        //required tags
        txn.addTag('Bundle-Format', 'json');
        txn.addTag('Bundle-Version', '1.0.0');
        txn.addTag('Content-Type', 'application/json');

        txn.addTag("compressed", settings.compressed ? "true" : "false");
        txn.addTag("startBlock", settings.startBlock);
        txn.addTag("endBlock", settings.startBlock);
    }

    public async createTxnFromBlock(block: Block, asDataItem: boolean = false): Promise<Transaction | DataItemJson> {
        if (asDataItem) {
            let txn = await this.arBundles.createData({ data: JSON.stringify(block) }, this.wallet);
            this.addDataItemTags(block, txn);
            await this.arBundles.sign(txn, this.wallet);
            return txn;
        }
        else {
            let txn = await this.arweave.createTransaction({ data: JSON.stringify(block) }, this.wallet);
            this.addTransactionTags(block, txn);
            await this.arweave.transactions.sign(txn, this.wallet);
            return txn;
        }
    }
    public async createTxnFromBundle(items: DataItemJson[], start: number, end: number, compress: boolean = true): Promise<Transaction> {
        let txn: Transaction;
        if (compress) {
            txn = await this.arweave.createTransaction({ data: await compressBundle(await this.arBundles.bundleData(items)) }, this.wallet);
        }
        else {
            txn = await this.arweave.createTransaction({ data: JSON.stringify(await this.arBundles.bundleData(items)) }, this.wallet);
        }
        this.addBundleTags(txn, {
            compressed: compress,
            startBlock: start.toString(),
            endBlock: start.toString()
        });
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