#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;

const env = require("./src/env/env")
const webp = require("./src/utils/webp")

var unpack = false

async function main() 
{
    const realArgs = process.argv.slice(2);
    if (realArgs.length < 1) 
    {
        throw 'Usage: packed <mode> [directory]'
    }

    unpack = realArgs[0].toLowerCase() === 'unpack' || realArgs[0].toLowerCase() === 'u';
    const directory = realArgs[1] ? realArgs[1] : process.cwd();

    // Change to the specified directory if provided
    if (realArgs[1]) {
        try {
            process.chdir(directory);
            console.log(`Changed working directory to ${directory}`);
        } catch (error) {
            console.error(`Failed to change directory: ${error.message}`);
            process.exit(1);
        }
    }

    const fullPath = process.cwd();
    const files = await searchFiles(fullPath);
    await processFiles(files, unpack);
}

async function searchFiles(directory) 
{
    const directoryPath = path.resolve(directory);
    const filesList = [];

    try 
    {
        const fileNames = await fs.readdir(directoryPath);

        for (const fileName of fileNames) 
        {
            const filePath = path.join(directoryPath, fileName);
            let stats;
            try {
                stats = await fs.stat(filePath);
            } catch (error) {
                console.error(`Skipping file due to error: ${filePath} - ${error.message}`);
                continue;
            }

            if (stats.isFile() && fileName.endsWith(env.WEBP_EXTENSION_SLUG)) 
            {
                if (unpack) 
                {
                    filesList.push(filePath);
                }
                else 
                {
                    const txtFilePath = path.join(directoryPath, fileName.slice(0, -env.WEBP_EXTENSION_SLUG.length) + env.TXT_EXTENSION_SLUG);
                    try {
                        await fs.access(txtFilePath);
                        filesList.push(filePath);
                    } catch (error) {
                        console.error(`Skipping file due to error: ${txtFilePath} - ${error.message}`);
                    }
                }
            } 
            else if (stats.isDirectory()) 
            {
                const subfolderFiles = await searchFiles(filePath);
                filesList.push(...subfolderFiles);
            }
        }

        return filesList;
    } 
    catch (error) 
    {
        console.error(`Error while searching files: ${directoryPath} - ${error.message}`);
        return [];
    }
}

async function processFiles(filePaths) 
{
    const tasks = filePaths.map(processFile);
    await Promise.all(tasks);
}

function processFile(filePath) 
{
    if (unpack) 
    {
        return webp.unpack(filePath);
    } 
    else
    {
        return webp.pack(filePath, filePath.slice(0, -env.WEBP_EXTENSION_SLUG.length) + env.TXT_EXTENSION_SLUG);
    }
}

main().catch((error) => 
{
    console.error(error);
    process.exit(1);
})
