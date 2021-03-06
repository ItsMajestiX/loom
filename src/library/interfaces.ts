/**
 * Properties that Arweave transactions have.
 */
interface Base {
    "User-Agent": string | undefined;
    "chain": string | undefined;
    "genHash": string | undefined;
}

/**
 * The interface an object should conform to when using it as a filter for things like ArQL or searching for blocks in a bundle.
 */
export interface BlockInfo extends Base {
    chain: string | undefined;
    genHash: string | undefined;
    time: string | undefined;
    number: string | undefined;
    hash: string | undefined;
    parentHash: string | undefined;
    stateRoot: string | undefined;
    extrinsicsRoot: string | undefined;
    author: string | undefined;
}

/**
 * The interface an object should conform to when using it as a filter for searching for bundles.
 */
export interface BundleInfo extends Base {
    compressed: "true" | "false" | undefined,
    startBlock: string | undefined,
    endBlock: string | undefined
}