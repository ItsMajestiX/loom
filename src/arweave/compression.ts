import Arweave from 'arweave';
import deepHash from 'arweave/node/lib/deepHash';
import ArweaveBundles, { DataItemJson } from "arweave-bundles";
import zlib from "zlib";

const arBundles = ArweaveBundles({
    utils: Arweave.utils,
    crypto: Arweave.crypto,
    deepHash: deepHash,
});

export function compressBundle(bundle: { items: DataItemJson[] }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        zlib.brotliCompress(JSON.stringify(bundle), (err, buffer) => {
            if (err === null) {
                resolve(buffer);
            }
            else {
                reject(err);
            }
        })
    })
}

export function decompressBundle(bundle: DataItemJson[]): Promise<DataItemJson[]> {
    return new Promise((resolve, reject) => {
        zlib.brotliDecompress(JSON.stringify(bundle), (err, buffer) => {
            if (err === null) {
                resolve(arBundles.unbundleData(buffer.toString()));
            }
            else {
                reject(err);
            }
        })
    })
}