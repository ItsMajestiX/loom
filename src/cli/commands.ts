import fs from 'fs';

import yargs, { choices } from 'yargs';
//esm doesn't work for some reason
const { hideBin } = require('yargs/helpers');

import colors from "colors/safe";


const raw = yargs(hideBin(process.argv)).options({
	k: {
		alias: "key",
		demandOption: "Please specify a path to your Arweave keyfile.",
		desc: "The location of your Arweave keyfile.",
		coerce: (arg) => {
			try {
				let file = fs.readFileSync(arg);
				if (file === undefined) {
					console.error(colors.red("Your Arweave keyfile could not be read."));
					process.exit(-1);
				}
				return file.toString();
			}
			catch (e) {
				console.error(colors.red("There was an error reading your Arweave keyfile: " + e));
				process.exit(-1);
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
	A: {
		alias: "arweave",
		desc: "The URL of the Arweave node to connect to. Should contain a protocol and port as well as the hostname.",
		default: "https://arweave.net:443",
		coerce: (arg) => {
			try {
				return new URL(arg);
			}
			catch (e) {
				console.error(colors.red("There was an error processing your Arweave URL: " + e));
				process.exit(-1);
			}
		}
	},
	l: {
		alias: "library",
		desc: "Enable library mode. Either this or -a must be set. Will allow blocks uploaded to be queried via ArQL/GraphQL. However, this is less efficent and costs more in transaction fees.",
		conflicts: ['a', 'b', 'c'],
		type: "boolean"
	},
	a: {
		alias: "archive",
		desc: "Enable archive mode. Either this or -l must be set. Uploads two or more blocks at a time as a bundle. However, blocks uploaded this way cannot be interacted with directly.",
		conflicts: ['l'],
		implies: ['b', 'c'],
		type: "boolean"
	},
	s: {
		alias: "stream",
		desc: "Enable streaming mode. As soon as your node recieves a new block, it will either be added to the current bundle or immidiately uploaded.",
		conflicts: ['S', 'E'],
		type: "boolean"
	},
	b: {
		alias: "bundle-size",
		desc: "Set the size of the bundle in blocks.",
		conflicts: ['l'],
		implies: ['a'],
		type: "number"
	},
	S: {
		alias: "start",
		desc: "The block to start archiving at.",
		conflicts: ['s'],
		type: "number"
	},
	E: {
		alias: "end",
		desc: "The block to end archiving at. If not specified, will switch to livestream mode after all blocks uploaded.",
		conflicts: ['s'],
		type: "number"
	},
	c: {
		alias: "compression",
		desc: "Enable compression in archive mode. Highly recommended.",
		conflicts: ['l'],
		implies: ['a'],
		type: "boolean"
	},
	t: {
		alias: "test",
		desc: "Turns on test mode, which disables transactions and prints debug info.",
		default: true,
		type: "boolean"
	},
	d: {
		alias: "datadir",
		desc: "The directory to save temp data to, such as downloaded blocks and program state. Will be created if it does not exist.",
		default: "./.loomdata/",
		type: "string"
	}
}).argv;

function getArgs(): CommandType {
	if (raw.l === undefined && raw.a === undefined) {
		console.error(colors.red("ERROR: One of -l/--library or -a/--archive must be specifed."));
		process.exit(-1);
	}
	if (raw.a && raw.S === undefined) {
		raw.S = 0;
	}
	if (!raw.l) {
		raw.b = 10;
	}
	if (raw.s === undefined) {
		raw.s === false;
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
	A: URL;
	/**
	 * library
	 */
	l: boolean | undefined;
	/**
	 * archive
	 */
	a: boolean | undefined;
	/**
	 * stream
	 */
	s: boolean | undefined;
	/**
	 * blocksize
	 */
	b: number | undefined;
	/**
	 * start
	 */
	S: number | undefined;
	/**
	 * end
	 */
	E: number | undefined;
	/**
	 * compress
	 */
	c: boolean | undefined;
	/**
	 * test
	 */
	t: boolean;
	/**
	 * datadir
	 */
	d: string;
	_: (string | number)[];
	$0: string;
}