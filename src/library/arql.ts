import Arweave from 'arweave/node';
import { BlockInfo } from './interfaces';

interface GraphQLResponseType {

}

async function sendGraphQLQuery(ar: Arweave, query: string) {
    const response = await ar.api.post("/graphql", query);
}

export async function getBlocksFromArweave(ar: Arweave, query: BlockInfo): Promise<Block[]> {

}