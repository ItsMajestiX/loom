import fs from "fs";

import { TransactionUploader } from "arweave/node/lib/transaction-uploader";

import colors from "colors/safe";

import hidefile from "hidefile";

export class FileManager {

    constructor(dir: string) {
        try {
            fs.statSync(dir);
        }
        catch (e) {
            let cast = <NodeJS.ErrnoException>e;
            if (cast.code === "ENOENT") {
                try {
                    fs.mkdirSync(dir);
                    hidefile.hideSync(dir);
                }
                catch (e) {
                    console.error(colors.red("Error creating/hiding the temp directory: " + e));
                    process.exit(-1);
                }
            }
            else {
                console.error(colors.red("Error checking if temp directory exists: " + e));
                process.exit(-1);
            }
        }
    }
}