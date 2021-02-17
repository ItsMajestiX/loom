import path from "path";
import fs from "fs";
import util from "util";

import colors from "colors/safe";

import async from "async";

import { DataItemJson } from "arweave-bundles";


export class FileManager {

    dirPath: string;

    constructor(dir: string) {
        this.dirPath = dir;
        try {
            fs.statSync(dir);
        }
        catch (e) {
            let cast = <NodeJS.ErrnoException>e;
            if (cast.code === "ENOENT") {
                try {
                    fs.mkdirSync(dir);
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

    private async fileExists(filepath: string): Promise<boolean> {
        try {
            let success = true;
            let statPromise = util.promisify(fs.stat);
            await statPromise(filepath);
            return success;
        }
        catch (e) {
            console.warn(colors.yellow("File not found: " + filepath));
            return false;
        }
    }

    public async readBlock(number: number): Promise<DataItemJson | undefined> {
        let newPath = path.join(this.dirPath, number.toString() + ".block");
        if (await this.fileExists(newPath)) {
            let readFilePromise = util.promisify(fs.readFile);
            let fileData: string;
            try {
                fileData = (await readFilePromise(newPath)).toString();
            }
            catch (e) {
                console.error(colors.red("Error reading the file " + newPath + ". Error: " + e));
                process.exit(-1);
            }
            try {
                return <DataItemJson>JSON.parse(fileData);
            }
            catch (e) {
                console.warn(colors.yellow(e));
                return undefined;
            }
        }
        else {
            return undefined;
        }
    }

    public async writeBlock(block: DataItemJson, number: number): Promise<void> {
        let newPath = path.join(this.dirPath, number.toString() + ".block");
        let writeFilePromise = util.promisify(fs.writeFile);
        try {
            await writeFilePromise(newPath, JSON.stringify(block));
        }
        catch (e) {
            console.error(colors.red("Error writing the file " + newPath + ". Error: " + e));
            process.exit(-1);
        }
    }

    public async wipeBlocks(): Promise<void> {
        let readdirPromise = util.promisify(fs.readdir);
        let rmPromise = util.promisify(fs.rm);
        let files: string[];
        try {
            files = (await readdirPromise(this.dirPath)).filter(value => value.endsWith(".block"));
        }
        catch (e) {
            console.error(colors.red("Error reading the directory " + this.dirPath + ". Error: " + e));
            process.exit(-1);
        }
        async.each(files, async (file) => {
            let newPath = path.join(this.dirPath, file);
            try {
                await rmPromise(newPath);
            }
            catch (e) {
                console.error(colors.red("Error removing the file " + newPath + ". Error: " + e));
                process.exit(-1);
            }
        })
    }
}