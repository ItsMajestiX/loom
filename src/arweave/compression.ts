import zlib from "zlib";
import util from "util";

import Arweave from 'arweave';
import deepHash from 'arweave/node/lib/deepHash';

import ArweaveBundles, { DataItemJson } from "arweave-bundles";

import colors from "colors/safe";

const arBundles = ArweaveBundles({
    utils: Arweave.utils,
    crypto: Arweave.crypto,
    deepHash: deepHash,
});

export async function compressBundle(bundle: { items: DataItemJson[] }): Promise<Buffer> {
    const brotliCompressPromise = util.promisify(zlib.brotliCompress);
    try {
        return await brotliCompressPromise(JSON.stringify(bundle));
    }
    catch (e) {
        console.error(colors.red("Error compressing bundle: " + e));
        process.exit(-1);
    }
}

export async function decompressBundle(bundle: string): Promise<DataItemJson[]> {
    const brotliDecompressPromise = util.promisify(zlib.brotliDecompress);
    try {
        const data = await brotliDecompressPromise(bundle);
        return arBundles.unbundleData(data);
    }
    catch (e) {
        console.error(colors.red("Error decompressing bundle: " + e));
        process.exit(-1);
    }
}