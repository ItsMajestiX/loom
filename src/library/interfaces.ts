/**
 * Properties that Arweave transactions have.
 */

import { DataItemJson } from "arweave-bundles";
import { Block } from "../substrate/block";


/**
 * The interface an object should conform to when using it as a filter for things like GraphQL or searching for blocks in a bundle.
 */
export interface BlockInfo {
    "User-Agent"?: ["Loom"];
    chain?: [string];
    genHash?: [string];
    time?: [string];
    number?: [string];
    hash?: [string];
    parentHash?: [string];
    stateRoot?: [string];
    extrinsicsRoot?: [string];
    author?: [string];

}

/**
 * The interface an object should conform to when using it as a filter for searching for bundles.
 */
export interface BundleInfo {
    "User-Agent"?: string;
    compressed: ["true"] | ["false"] | ["true", "false"];
    startBlock?: [string];
    endBlock?: [string];
}

export interface BlockRange {
    min: number;
    max: number;
}

export enum SortOrder {
    HEIGHT_ASC = "HEIGHT_ASC",
    HEIGHT_DESC = "HEIGHT_DESC"
}

export interface GraphQLSearchOptions {
    owners?: [string];
    block?: BlockRange;
    first?: number;
    sort?: SortOrder;
    after?: string;
}

export interface ItemInfo {
    id: string;
    cursor: string;
}

export interface GraphQLResponseType {
    "data": {
        "transactions": {
            "edges": [{
                "node": {
                    "tags": [{
                        "name": string;
                        "value": string;
                    }]
                    "id": string;
                }
                "cursor": string;
            }]
        }
    }
}

export interface BundleList {
    info: ItemInfo;
    items: DataItemJson[];
}

export interface PaginatedBlock {
    info: ItemInfo;
    block: Block;
}