const helpers = require("./helpers");

const eventUtil = require("../../out/substrate/eventutil");
const substrateChain = require("../../out/substrate/substratechain").SubstrateChain;

before(async function() {
	this.timeout(5000);
	await helpers.api;
});

describe('Substrate', function() {
	describe('eventutil.ts', function() {
		it('isSuccess should return true when the last event is ExtrinsicSuccess', async function() {
			this.timeout(5000);
			const api = await helpers.api;
			const hash = await api.rpc.chain.getBlockHash(helpers.EVENTUTIL_SUCCESS[0]);
			const block = await api.derive.chain.getBlock(hash);
			helpers.expect(eventUtil.isSuccess(block.extrinsics[helpers.EVENTUTIL_SUCCESS[1]].events)).to.equal(true);
		});
		it('isSuccess should return false when the last event is ExtrinsicFailure', async function() {
			const api = await helpers.api;
			const hash = await api.rpc.chain.getBlockHash(helpers.EVENTUTIL_FAILURE[0]);
			const block = await api.derive.chain.getBlock(hash);
			helpers.expect(eventUtil.isSuccess(block.extrinsics[helpers.EVENTUTIL_FAILURE[1]].events)).to.equal(false);
		});
	});
	describe("substratechain.ts", function() {
			it("Creating a chain with no problems shouldn't return an error", async function() {
				this.timeout(5000);
				await substrateChain.create(helpers.RPC_URL);
			});
			it("Creating a chain with a non-websocket address should return an error", async function() {
				this.timeout(50000);
				var success;
				try {
					await substrateChain.create("https://8.8.8.8/");
					success = false;
				}
				catch (e) {
					success = true;
				}
				if (!success) {
					throw new Error("Creation successful when it shouldn't be.");
				}
			});
			it("Creating a chain with a non-node websocket should return an error", async function() {
				this.timeout(50000);
				let success;
				try {
					await substrateChain.create("wss://echo.websocket.org");
					success = false;
				}
				catch {
					success = true;
				}
				if (!success) {
					throw new Error("Creation successful when it shouldn't be.");
				}
			});
	});
	describe("block.ts + related", function() {
		let block;
		before(async function() {
			this.timeout(10000);
			const substrate = await substrateChain.create(helpers.RPC_URL);
			block = await substrate.getBlock(helpers.BLOCK_NUMBER);
		});
		it("Block object should have the correct properties", function() {
			Object.keys(helpers.BLOCK_PROPERTIES).forEach((s) => {
				try {
					if (!((s === "author" || s === "time") && block[s] === undefined)) {
						if (helpers.BLOCK_PROPERTIES[s].toString() !== block[s].toString()) {
							throw new Error("Specified " + s + " of " + helpers.BLOCK_PROPERTIES[s].toString() + "did not equal retrieved " + s + " of " + block[s].toString() + ".");
						}
					}
				}
				catch (e) {
					console.error("Test failed on key " + s + ".");
					throw e;
				}
			});
		});
		it("Extrinsic object should have the correct properties", function() {
			Object.keys(helpers.BLOCK_EXTRINSIC[1]).forEach((s) => {
				if (helpers.BLOCK_EXTRINSIC[1][s].toString() !== block.extrinsics[helpers.BLOCK_EXTRINSIC[0]][s].toString()) {
					throw new Error("Specified " + s + " of " + helpers.BLOCK_EXTRINSIC[1][s].toString() + " did not equal retrieved " + s + " of " + block.extrinsics[helpers.BLOCK_EXTRINSIC[0]][s].toString() + ".");
				}
			});
		});
		it("Event object should have the correct properties", function() {
			Object.keys(helpers.BLOCK_EVENT[1]).forEach((s) => {
				if (helpers.BLOCK_EVENT[1][s].toString() !== block.events[helpers.BLOCK_EVENT[0]][s].toString()) {
					throw new Error("Specified " + s + " of " + helpers.BLOCK_EVENT[1][s].toString() + " did not equal retrieved " + s + " of " + block.events[helpers.BLOCK_EVENT[0]][s].toString() + ".");
				}
			});
		});
		it("Log object should have the correct properties", function() {
			Object.keys(helpers.BLOCK_LOG[1]).forEach((s) => {
				if (helpers.BLOCK_LOG[1][s].toString() !== block.logs[helpers.BLOCK_LOG[0]][s].toString()) {
					throw new Error("Specified " + s + " of " + helpers.BLOCK_LOG[1][s].toString() + " did not equal retrieved " + s + " of " + block.logs[helpers.BLOCK_LOG[0]][s].toString() + ".");
				}
			});
		});
	});
});