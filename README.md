# Loom
Loom is a program for downloading blocks from a Polkadot based chain (or really any Substrate based chain) and uploading them to Arweave.

# Get started
- Start a node for the chain you want to archive locally, or get the websocket address of one. Note that it must be running in archive mode. For an example of how to set a node like this up for Polkadot, go [here](https://wiki.polkadot.network/docs/en/maintain-sync).
- Acquire an Arweave wallet with sufficient tokens. You will need to upload a lot of data, even with compression, so make sure you have enough AR.
- Install loom with `npx --package @itsmajestix/loom loom`. You should get a list of command line options.
- Run Loom using `npx loom [options]...`

# Develop
- Clone the repository with `git clone https://github.com/ItsMajestiX/loom.git`
- `cd loom`, and then run `npm install` to install the needed packages.
- `npm run build` to build typescript.

# CLI Options
These options can be viewed with `npx loom --help`.

Required options:
- `-k`, `--key` (required): The location of your Arweave keyfile.
- `-n`, `--node` (required): A websocket URL of a substrate node running in archive node.
- `-a`, `--arweave` (defaults to "https://arweave.net:443"): The URL of the Arweave node to connect to. Should contain a protocol and port as well as the hostname.

Modes:
- `--library`, `--library-mode` (conflicts archive and its related options): Enable library mode. Either this or --archive must be set. Will allow blocks uploaded to be queried via ArQL/GraphQL. However, this is less efficient and costs more in transaction fees.
- `--archive`, `--archive-mode` (conflicts library mode): Enable archive mode. Either this or --library must be set. Uploads two or more blocks at a time as a bundle. However, blocks uploaded this way cannot be interacted with directly.

Block specifiers:
- `--stream`, `--livestream` (conflicts start/end): Enable streaming mode. As soon as your node receives a new block, it will either be added to the current bundle or immediately uploaded.
- `-s`, `--start` (conflicts stream): The block to start archiving at. Defaults to 0 if not set.
- `-e`, `--end` (conflicts stream): The block to end archiving at. If not specified, will switch to livestream mode after all blocks uploaded.

Archive settings:
- `-b`, `--bundle-size`: Sets the size of the bundle in blocks.
- `-c`, `--compression`: Enable compression in archive mode. Highly recommended.

Other settings:
- `-t`, `--test`: Turns on test mode, which disables transactions and prints debug info.
- `-d`, `--datadir` (defaults to "./.loomdata/"): The directory to save data to, such as downloaded blocks and program state. Will be created if it does not exist.
- `-w`, `--wipe`, `--clear`: Whether to clear the data in the datadir when done. Recommended to have this set when using a local node.

# What chains does it work with?
Loom should work with most chains that support Polkadot.JS. If you find one that doesn't, feel free to open an issue.

# ArQL Tags
These tags are available on top level transactions (library/bundle):
- `User-Agent`: Is always equal to `Loom` (for now).
- `chain`: The name of the chain that is archived. Determined internally by `(await api.rpc.system.chain()).toString()`
- `genHash`: The genesis hash of the chain that is archived. Determined internally by `api.genesisHash`

These tags are available on bundles in addition to those above:
- `compressed`: Is either equal to true or false. Specifies whether the data of the transaction has been compressed with Brotli.
- `startBlock`: The earliest block included in the bundle.
- `endBlock`: The latest block included in the bundle.

These tags are available on transactions containing blocks (library/bundle items):
- `number`: The number of the block.
- `hash`: The hash of the block as a hexadecimal string.
- `parentHash`: The hash of the parent block as a hexadecimal string.
- `stateRoot`: The state root as a hexadecimal string.
- `extrinsicsRoot`: The extrinsics root as a hexadecimal string.
- `time` (possibly nonexistent): The time in milliseconds since the unix epoch as given by the timestamp.set inherent.
- `author` (possible nonexistent): The author of the block.

# Block Format
Blocks contain data similar to their tags (minus the `User-Agent` tag), but have three JSON lists that contain the extrinsics (which includes inherents as well), events, and logs for the block. They are named `extrinsics`, `events`, and `logs`, and contain objects of type `BlockExtrinsic`, `BlockEvent`, and `BlockLog`.

## BlockExtrinsic
- `index` (number): The index of the extrinsic.
- `hash` (string): The hash of the extrinsic as a hexadecimal string.
- `module` (string): The module of the method being called.
- `method` (string): The method being called.
- `data` (string): The arguments for the extrinsic a JSON list of [SCALE](https://substrate.dev/docs/en/knowledgebase/advanced/codec) encoded arguments.
- `from` (string): The address who sent this transaction.
- `nonce` (number): The nonce of the transaction. Inherents normally have this set to 0.
- `signature` (string): The transaction signature.
- `success` (boolean): Whether the extrinsic succeeded or not.
- `eventRange` (list with two numbers): The range of events that this extrinsic triggered, both inclusive.

## BlockEvent
- `index` (number): The index of the event.
- `extrinsic` (number): The index of the extrinsic this event was triggered by.
- `module` (string): The module of the event being called.
- `method` (string): The event being called.
- `data` (string): The data for the event as a JSON list.

## BlockLog
- `index` (number): The index of the event.
- `type` (string): The type of log.
- `data` (string): The data for the log as a JSON list.

# Credits
- [Solarweave](https://github.com/TheLoneRonin/SolarweaveBridge): Inspiration for many parts of Loom.
- [Polkascan](https://polkascan.io/): Helped form block format, huge help when testing.