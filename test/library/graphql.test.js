const library = require("../../out/library");

const chain = require("../../out/substrate/substratechain").SubstrateChain;

const expect = require("chai").expect;

const loom = library.init({
    host: 'arweave.dev',
    port: 443,
    protocol: 'https'
});

describe('GraphQL', function() {
	it('sendGraphQLQuery works', async function() {
		const test = await loom.sendGraphQLQuery('query { transactions(tags: [{ name: "User-Agent", values: ["Loom"] }]){ edges { node { id }}}}')
	});
	it('Transaction filters work (except for pagination)', async function() {
		const test = await loom.getBlocksFromArweave({number: ["3901724"]}, {
			owners: ["03aQICRfLDTMXmJ9cIk9AAtZyOQYFNkpsCwD8w4o4mw"],
			block: { min: 632465, max: 632465},
			first: 1,
			sort: library.SortOrder.HEIGHT_ASC
		});
		expect(test[0]).to.not.be.undefined;
	});
	it('Pagination works', async function() {
		this.timeout(10000);
		const cursor = await loom.getBlocksFromArweave({"User-Agent": ["Loom"]}, {
			owners: ["03aQICRfLDTMXmJ9cIk9AAtZyOQYFNkpsCwD8w4o4mw"],
			first: 1,
			sort: library.SortOrder.HEIGHT_ASC
		});
		expect(cursor[0]).to.not.be.undefined;
		const test = await loom.getBlocksFromArweave({"User-Agent": ["Loom"]}, {
			owners: ["03aQICRfLDTMXmJ9cIk9AAtZyOQYFNkpsCwD8w4o4mw"],
			first: 1,
			after: cursor[0].info.cursor,
			sort: library.SortOrder.HEIGHT_ASC
		});
		expect(test[0]).to.not.be.undefined;
		expect(test[0].block.number).to.eq(3901661, "Number was " + test[0].block.number.toString());
	});
	it('getBlocksFromArweave has basic functionality', async function() {
		this.timeout(10000);
		const substrate = await chain.create("wss://rpc.polkadot.io");
		const extrinsicIdReal = await substrate.getBlock(3901724);
		expect(extrinsicIdReal.extrinsicsRoot.toString()).to.be.eq("0xb83ddbdf1b655e7bf36970176cfc7bdf86ea8d9220a0d0e7ce4c521fb7e021a1");
		const extrinsicId = await loom.getBlocksFromArweave({number: ["3901724"]});
		expect(extrinsicId[0].block.extrinsicsRoot.toString()).to.be.eq("0xb83ddbdf1b655e7bf36970176cfc7bdf86ea8d9220a0d0e7ce4c521fb7e021a1");
	});
	it('getBundlesFromArweave has basic functionality', async function() {
		const test = await loom.getBundlesFromArweave({
			startBlock: ["3763370"]
		});
		expect(test[0]).to.not.be.undefined;
	});
});
