# Loom
Loom is a program for downloading blocks from a Polkadot based chain (or really any Substrate based chain) and uploading them to Arweave.

# Get started
- Start a node for the chain you want to archive locally, or get the address of one. Note that it must be running in archive mode. For an example of how to set a node like this up for Polkadot, go [here](https://wiki.polkadot.network/docs/en/maintain-sync).
- Acquire an Arweave wallet with sufficent tokens. You will need to upload a lot of data, even with compression, so make sure you have enough AR.
- (npm instructions go here when npm package is uploaded)
- (command options here once commands are finalized)

# What chains does it work with?
Loom should work with most chains that support Polkadot.JS. If you find one that doesn't, feel free to open an issue.

# ArQL Tags
These tags are available on top level transactions (library/bundle):
- `User-Agent`: Is always equal to `Loom`.
- `chain`: The name of the chain that is archived. Determined internally by `(await api.rpc.system.chain()).toString()`
- `genHash`: The genesis hash of the chain that is archived. Determined internally by `api.genesisHash`

These tags are available on bundles in addition to those above:
- `compressed`: Is either equal to true or false. Specifies whether the data of the transaction has been compresed with Brotli.
- `startBlock`: The earliest block included in the bundle.
- `endBlock`: The latest block included in the bundle.

These tags are available on transactions containing blocks (library/bundle items):
- `number`: The number of the block.
- `hash`: The hash of the block as a hexidecimal string.
- `parentHash`: The hash of the parent block as a hexidecimal string.
- `stateRoot`: The state root as a hexidecimal string.
- `extrinsicsRoot`: The extrinsics root as a hexidecimal string.
- `time` (possibly nonexistant): The time in milliseconds since the unix epoch as given by the timestamp.set inherent.
- `author` (possible nonexistant): The author of the block.