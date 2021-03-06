const chai = require("chai");

const polkadotjs = require("@polkadot/api");
const WsProvider = require("@polkadot/api").WsProvider;
const ApiPromise = require("@polkadot/api").ApiPromise;


exports.expect = chai.expect;

exports.RPC_URL = "wss://rpc.polkadot.io";

// Block the event is in, plus extrinsic ID
exports.EVENTUTIL_SUCCESS = [3833583, 1];
exports.EVENTUTIL_FAILURE = [3833502, 1];

exports.BLOCK_NUMBER = 3861467;
exports.BLOCK_PROPERTIES = {
    number: 3861467,
    hash: "0xf1a38694844c84b658eabd0aa042ab4afc32a7f44a60da3f33b7be7fd118264f",
    parentHash: "0xadb0d62b8064feb702571c380a80388d1af57719650cc12ca594d90c3d54979d",
    stateRoot: "0x5a85b977beb319615ebe8978796ac773a8e42060ebc1f521d4b3c535aab5b3f3",
    extrinsicsRoot: "0x9a0add151b67506333f3b93df33868021855353404a45b0846f5ef3750b012b5",
    author: "1zugcawsx74AgoC4wz2dMEVFVDNo7rVuTRjZMnfNp9T49po",
};
exports.BLOCK_EXTRINSIC = [1, {
    index: 1,
    hash: "0x8010c4216ca9db3fc53cb268531c0f1074686c479020623fc4591f8c80242768",
    module: "balances",
    method: "transfer",
    from: "12xtAYsRUrmbniiWQqJtECiBQrMn8AypQcXhnQAc6RB6XkLW",
    nonce: 38028,
    signature: "0x86430163e8630e1057e4dab104b38d53c02ad49e0cb17cd54de835cce44b1b29e716189788626ad4d81cfcc2be33855b884a04b3fb86a60a1113d3f7dd3e0e8a",
    success: true,
    eventRange: [1, 5]
}];
exports.BLOCK_EVENT = [1, {
    index: 1,
    extrinsic: 1,
    module: "system",
    method: "NewAccount"
}];
exports.BLOCK_LOG = [0, {
    index: 0,
    type: "PreRuntime"
}];


const wsProvider = new WsProvider(exports.RPC_URL);
exports.api = ApiPromise.create({ provider: wsProvider });