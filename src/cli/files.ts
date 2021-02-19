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
            const cast = <NodeJS.ErrnoException>e;
            if (cast.code === "ENOENT") {
                try {
                    fs.mkdirSync(dir);
                }
                catch (e) {
                    console.error(colors.red("Error creating/hiding the temp directory: " + e));
                    throw new Error();
                }
            }
            else {
                console.error(colors.red("Error checking if temp directory exists: " + e));
                throw new Error();
            }
        }
    }

    private async fileExists(filepath: string): Promise<boolean> {
        try {
            const success = true;
            const statPromise = util.promisify(fs.stat);
            await statPromise(filepath);
            return success;
        }
        catch (e) {
            console.warn(colors.yellow("File not found: " + filepath));
            return false;
        }
    }

    public async readBlock(number: number): Promise<DataItemJson | undefined> {
        const newPath = path.join(this.dirPath, number.toString() + ".block");
        if (await this.fileExists(newPath)) {
            const readFilePromise = util.promisify(fs.readFile);
            let fileData: string;
            try {
                fileData = (await readFilePromise(newPath)).toString();
            }
            catch (e) {
                console.error(colors.red("Error reading the file " + newPath + ". Error: " + e));
                throw new Error();
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
        const newPath = path.join(this.dirPath, number.toString() + ".block");
        const writeFilePromise = util.promisify(fs.writeFile);
        try {
            await writeFilePromise(newPath, JSON.stringify(block));
        }
        catch (e) {
            console.error(colors.red("Error writing the file " + newPath + ". Error: " + e));
            throw new Error();
        }
    }

    public async wipeBlocks(): Promise<void> {
        const readdirPromise = util.promisify(fs.readdir);
        const rmPromise = util.promisify(fs.rm);
        let files: string[];
        try {
            files = (await readdirPromise(this.dirPath)).filter(value => value.endsWith(".block"));
        }
        catch (e) {
            console.error(colors.red("Error reading the directory " + this.dirPath + ". Error: " + e));
            throw new Error();
        }
        async.each(files, async (file) => {
            const newPath = path.join(this.dirPath, file);
            try {
                await rmPromise(newPath);
            }
            catch (e) {
                console.error(colors.red("Error removing the file " + newPath + ". Error: " + e));
                throw new Error();
            }
        })
    }
}