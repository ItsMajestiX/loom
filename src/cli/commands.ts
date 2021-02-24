import fs from 'fs';

import yargs from 'yargs';

import colors from "colors/safe";


const raw = yargs(process.argv.slice(2)).options({
	k: {
		alias: "key",
		demandOption: "Please specify a path to your Arweave keyfile.",
		desc: "The location of your Arweave keyfile.",
		coerce: (arg) => {
			try {
				const file = fs.readFileSync(arg);
				if (file === undefined) {
					console.error(colors.red("Your Arweave keyfile could not be read."));
					throw new Error();
				}
				return file.toString();
			}
			catch (e) {
				console.error(colors.red("There was an error reading your Arweave keyfile: " + e));
				throw new Error();
			}
		},
		type: 'string'
	},
	n: {
		alias: "node",
		demandOption: "Please specify the websocket addresses of a substrate node running in archive mode to pull block data from.",
		desc: "A websocket URL of a substrate node running in archive node.",
		type: "string"
	},
	a: {
		alias: "arweave",
		desc: "The URL of the Arweave node to connect to. Should contain a protocol and port as well as the hostname.",
		default: "https://arweave.net:443",
		coerce: (arg) => {
			try {
				return new URL(arg);
			}
			catch (e) {
				console.error(colors.red("There was an error processing your Arweave URL: " + e));
				throw new Error();
			}
		}
	},
	library: {
		alias: "library-mode",
		desc: "Enable library mode. Either this or --archive must be set. Will allow blocks uploaded to be queried via ArQL/GraphQL. However, this is less efficient and costs more in transaction fees.",
		conflicts: ['archive', 'b', 'c'],
		type: "boolean"
	},
	archive: {
		alias: "archive-mode",
		desc: "Enable archive mode. Either this or --library must be set. Uploads two or more blocks at a time as a bundle. However, blocks uploaded this way cannot be interacted with directly.",
		conflicts: ['library'],
		implies: ['b', 'c'],
		type: "boolean"
	},
	stream: {
		alias: "livestream",
		desc: "Enable streaming mode. As soon as your node receives a new block, it will either be added to the current bundle or immediately uploaded.",
		conflicts: ['s', 'e'],
		type: "boolean"
	},
	b: {
		alias: "bundle-size",
		desc: "Sets the size of the bundle in blocks.",
		conflicts: ['library'],
		implies: ['archive'],
		type: "number"
	},
	s: {
		alias: "start",
		desc: "The block to start archiving at. Defaults to 0 if not set.",
		conflicts: ['stream'],
		type: "number"
	},
	e: {
		alias: "end",
		desc: "The block to end archiving at. If not specified, will switch to livestream mode after all blocks uploaded.",
		conflicts: ['stream'],
		type: "number"
	},
	c: {
		alias: "compression",
		desc: "Enable compression in archive mode. Highly recommended.",
		conflicts: ['library'],
		implies: ['archive'],
		type: "boolean"
	},
	t: {
		alias: "test",
		desc: "Turns on test mode, which disables transactions and prints debug info.",
		type: "boolean"
	},
	d: {
		alias: "datadir",
		desc: "The directory to save data to, such as downloaded blocks and program state. Will be created if it does not exist.",
		default: "./.loomdata/",
		type: "string"
	},
	w: {
		alias: ["wipe", "clear"],
		desc: "Whether to clear the data in the datadir when done. Recommended to have this set when using a local node.",
		type: "boolean"
	}
}).argv;

function getArgs(): CommandType {
	if (!raw.library && !raw.archive) {
		console.error(colors.red("ERROR: One of --library or -archive must be specified."));
		throw new Error();
	}
	if (raw.archive && !raw.stream && !raw.s) {
		raw.s = 0;
	}
	if (!raw.library && !raw.b) {
		raw.b = 10;
	}
	return raw;
}

export const argv = getArgs();

export interface CommandType {
	[x: string]: unknown;
	/**
	 * key
	 */
	k: string;
	/**
	 * node
	 */
	n: string;
	/**
	 * Arweave
	 */
	a: URL;
	/**
	 * library
	 */
	library: boolean | undefined;
	/**
	 * archive
	 */
	archive: boolean | undefined;
	/**
	 * stream
	 */
	stream: boolean | undefined;
	/**
	 * blocksize
	 */
	b: number | undefined;
	/**
	 * start
	 */
	s: number | undefined;
	/**
	 * end
	 */
	e: number | undefined;
	/**
	 * compress
	 */
	c: boolean | undefined;
	/**
	 * test
	 */
	t: boolean | undefined;
	/**
	 * datadir
	 */
	d: string;
	/**
	 * wipe
	 */
	w: boolean | undefined;

	_: (string | number)[];
	$0: string;
}