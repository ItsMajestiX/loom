import { Block } from '../substrate/block';
import { compressBundle } from './compression';

import Arweave from 'arweave/node';
import Transaction from 'arweave/node/lib/transaction';
import deepHash from 'arweave/node/lib/deepHash';
import { ApiConfig } from 'arweave/node/lib/api';

import ArweaveBundles, { DataItemJson } from 'arweave-bundles';
import { JWKPublicInterface } from 'arweave-bundles/lib/interface-jwk'

import colors from "colors/safe";

interface BundleSettings {
    compressed: boolean;
    startBlock: string;
    endBlock: string;
    chain: string;
    genHash: string;
}

export class ArweaveHandler {
    readonly arBundles = ArweaveBundles({
        utils: Arweave.utils,
        crypto: Arweave.crypto,
        deepHash: deepHash,
    });

    readonly arweave: Arweave;
    readonly wallet: JWKPublicInterface;

    /**
     * Creates a new instance of ArweaveHandler
     * @param wallet A JSON string representing an Arweave wallet.
     */
    public constructor(config: ApiConfig, wallet: string) {
        // Initialize Arweave connection and parse the wallet
        this.arweave = Arweave.init(config);
        try {
            this.wallet = <JWKPublicInterface>JSON.parse(wallet);
        }
        catch (e) {
            console.error(colors.red(e))
            throw new Error();
        }
    }

    public async getBalance(): Promise<string> {
        return this.arweave.ar.winstonToAr(await this.arweave.wallets.getBalance(await this.arweave.wallets.jwkToAddress(this.wallet)), { formatted: true });
    }

    // Two separate methods for two different ways to add tags
    private addTransactionTags(block: Block, txn: Transaction): void {
        txn.addTag("User-Agent", "Loom");
        txn.addTag("chain", block.chain);
        txn.addTag("genHash", block.genHash);

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
        // Required tags
        txn.addTag('Bundle-Format', 'json');
        txn.addTag('Bundle-Version', '1.0.0');
        txn.addTag('Content-Type', 'application/json');

        // Extra data
        txn.addTag("User-Agent", "Loom");
        txn.addTag("chain", settings.chain);
        txn.addTag("genHash", settings.genHash);
        txn.addTag("compressed", settings.compressed ? "true" : "false");
        txn.addTag("startBlock", settings.startBlock);
        txn.addTag("endBlock", settings.startBlock);
    }

    /**
     * Turns a block object into either a Transaction or a DataItemJson.
     * @param block The block to convert.
     * @param asDataItem Whether to convert to a DataItemJson. Defaults to false.
     */
    public async createTxnFromBlock(block: Block, asDataItem = false): Promise<Transaction | DataItemJson> {
        if (asDataItem) {
            const txn = await this.arBundles.createData({ data: JSON.stringify(block) }, this.wallet);
            this.addDataItemTags(block, txn);
            await this.arBundles.sign(txn, this.wallet);
            return txn;
        }
        else {
            const txn = await this.arweave.createTransaction({ data: JSON.stringify(block) }, this.wallet);
            this.addTransactionTags(block, txn);
            await this.arweave.transactions.sign(txn, this.wallet);
            return txn;
        }
    }

    /**
     * Takes a list of DataItemJson objects and bundles them into a Transaction.
     * @param items List of DataItemJson objects.
     * @param chain The name of the chain being archived.
     * @param genHash The genesis hash of the chain being archived.
     * @param start Block number of earliest block.
     * @param end Block number of last block.
     * @param compress Whether to compress the block or not.
     */

    public async createTxnFromBundle(items: DataItemJson[], chain: string, genHash: string, start: number, end: number, compress = true): Promise<Transaction> {
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
            endBlock: start.toString(),
            chain: chain,
            genHash: genHash
        });
        await this.arweave.transactions.sign(txn, this.wallet);
        return txn;
    }

    /**
     * Submits a transaction to Arweave and gives status reports.
     * @param txn The transaction to send.
     */
    public async submitTxn(txn: Transaction): Promise<void> {
        const uploader = await this.arweave.transactions.getUploader(txn);
        while (!uploader.isComplete) {
            await uploader.uploadChunk();
            if (uploader.isComplete) {
                console.log(colors.green("Uploaded data to Arweave. ID: " + txn.id));
            }
            else if (uploader.lastResponseError !== "") {
                console.log(colors.red("Error uploading blocks to Arweave. " + uploader.lastResponseError));
            }
            else {
                console.log(uploader.pctComplete.toString() + "% done uploading, " + uploader.uploadedChunks + '/' + uploader.totalChunks + ' chunks.');
            }
        }
    }
}