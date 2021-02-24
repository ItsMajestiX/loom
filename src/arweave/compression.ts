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

const compressSettings:zlib.BrotliOptions = {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: 10
}

export async function compressBundle(bundle: { items: DataItemJson[] }): Promise<Buffer> {
    const brotliCompressPromise = util.promisify(zlib.brotliCompress);
    try {
        const data = JSON.stringify(bundle);
        return await brotliCompressPromise(data, {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
            // https://www.lucidchart.com/techblog/2019/12/06/json-compression-alternative-binary-formats-and-compression-methods/
            [zlib.constants.BROTLI_PARAM_QUALITY]: 10,
            // Approximation
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length
        });
    }
    catch (e) {
        console.error(colors.red("Error compressing bundle: " + e));
        throw new Error();
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
        throw new Error();
    }
}