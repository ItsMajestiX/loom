import Arweave from "arweave";
import { ApiConfig } from "arweave/node/lib/api";
import { sendGraphQLQuery as _sendGraphQLQuery, getBlocksFromArweave as _getBlocksFromArweave, getBundlesFromArweave as _getBundlesFromArweave} from "./library/graphql";
import { BlockInfo, BundleInfo, BundleList, GraphQLResponseType, GraphQLSearchOptions, PaginatedBlock, SortOrder } from "./library/interfaces";

class Loom {
    ar: Arweave;

    constructor(config: ApiConfig) {
        this.ar = Arweave.init(config);
    }

    async sendGraphQLQuery(query: string): Promise<GraphQLResponseType> {
        return await _sendGraphQLQuery(this.ar, query);
    }

    async getBlocksFromArweave(query: BlockInfo, filters?: GraphQLSearchOptions): Promise<PaginatedBlock[]> {
        return await _getBlocksFromArweave(this.ar, query, filters);
    }

    async getBundlesFromArweave(query: BundleInfo, filters?: GraphQLSearchOptions): Promise<BundleList[]> {
        return await _getBundlesFromArweave(this.ar, query, filters);
    }
}

export { SortOrder }

export function init(config: ApiConfig): Loom {
    return new Loom(config);
}


