import Arweave from 'arweave';
import async from 'async';
import { Block } from '../substrate/block';
import { BlockInfo, BundleInfo, BundleList, GraphQLResponseType, GraphQLSearchOptions, PaginatedBlock} from './interfaces';
import deepHash from 'arweave/node/lib/deepHash';
import ArweaveBundles, { DataItemJson } from 'arweave-bundles';
import { decompressBundle } from '../arweave/compression';

const deps = {
  utils: Arweave.utils,
  crypto: Arweave.crypto,
  deepHash: deepHash,
}

const arBundles = ArweaveBundles(deps);

// This is super inefficient and complicated but it works
// https://stackoverflow.com/q/29600539, https://www.nadershamma.dev/blog/2019/how-to-access-object-properties-dynamically-using-bracket-notation-in-typescript/
function constructGraphQLQuery<A extends BlockInfo | BundleInfo, B extends GraphQLSearchOptions>(tags: A, filters?: B): string {
    let searchOptionString = "";
    if (filters) {
        Object.keys(filters).forEach(key => {
            // Can't use .toString, so use JSON.stringify instead
            searchOptionString += key + ': ' + JSON.stringify(filters[key as keyof B]) + ','
        });
        searchOptionString = searchOptionString.slice(0, searchOptionString.length - 1);
        searchOptionString = searchOptionString.replace('"min"', 'min');
        searchOptionString = searchOptionString.replace('"max"', 'max');
        searchOptionString = searchOptionString.replace('"HEIGHT_ASC"', 'HEIGHT_ASC');
        searchOptionString = searchOptionString.replace('"HEIGHT_DESC"', 'HEIGHT_DESC');

    }
    let tagString = "";
    Object.keys(tags).forEach(key => {
        tagString += '{name: "' + key + '", values: ' + JSON.stringify(tags[key as keyof A]) + '},'
    });
    tagString = tagString.slice(0, tagString.length - 1);
    return 'query { transactions(tags: [' + tagString + '], ' + searchOptionString + ') { edges { node { tags { name value } id } cursor }}}'
}

export async function sendGraphQLQuery(ar: Arweave, query: string): Promise<GraphQLResponseType> {
    const response = await ar.api.post("/graphql", { query: query});
    return <GraphQLResponseType> response.data;
}

export async function getBlocksFromArweave(ar: Arweave, query: BlockInfo, filters?: GraphQLSearchOptions): Promise<PaginatedBlock[]> {
    let blocks = new Array<PaginatedBlock>();
    const response = await sendGraphQLQuery(ar, constructGraphQLQuery(query, filters));
    await async.each(response.data.transactions.edges, async edge => {
        const block = <string> await ar.transactions.getData(edge.node.id, {decode: true, string: true});
        blocks.push({info: {id: edge.node.id, cursor: edge.cursor}, block: <Block> JSON.parse(block)});
    });
    return blocks;
}

export async function getBundlesFromArweave(ar: Arweave, query: BundleInfo, filters?: GraphQLSearchOptions): Promise<BundleList[]> {
    let bundles = new Array<BundleList>();
    const response = await sendGraphQLQuery(ar, constructGraphQLQuery(query, filters));
    await async.each(response.data.transactions.edges, async edge => {
        let bundle: DataItemJson[];
        let bundleData = <Uint8Array> await ar.transactions.getData(edge.node.id, {decode: true, string: false});
        let compression = edge.node.tags.find(test => { if (test.name === "compressed") { return test } })?.value;
        if (compression === "true") {
            bundle = await decompressBundle(bundleData);
        }
        else {
            bundle = await arBundles.unbundleData(new TextDecoder().decode(bundleData));
        }
        bundles.push({info: {id: edge.node.id, cursor: edge.cursor}, items: bundle});
    });
    return bundles;
}