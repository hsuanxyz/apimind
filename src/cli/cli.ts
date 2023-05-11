#!/usr/bin/env node

import { resolve } from "path";
import { readFile, writeFile, ensureFile, pathExists } from "fs-extra";
const fetch = require('node-fetch');
import { program } from "commander";
import { parse } from 'yaml'
import { generator } from "..";
import * as process from "process";

interface Options {
    input: string;
    output: string;
    url: string;
}

const version = require('../../package.json').version;

program
    .name('apimind')
    .description('Generate PlantUML from OpenAPI')
    .version(version)
    .option('--url <url>', 'remote url')
    .option('-i, --input <file>', 'input file (*.yaml, *.json)')
    .option('-o, --output <name>', 'output file (*.puml)');

program.parse(process.argv);

const options: Partial<Options> = program.opts();

getOpenAPIJSON()
    .then(json => {
        if (!json) {
            console.error('Parse error');
            return Promise.reject();
        } else {
            return generator(json);
        }
    })
    .then(tree => {

        if (!tree) {
            console.error('No API found');
            return Promise.reject();
        }

        if (options.output) {
            const outputPath = normalizePumlPath(options.output);
            return ensureFile(outputPath).then(async () => {
                await writeFile(outputPath, tree.toString() || '');
                console.log(`Output file: ${outputPath}`);
            }).catch(err => {
                console.error(err);
                console.error('Failed to write output file')
                return Promise.reject();
            })
        } else {
            tree.print();
            return Promise.resolve();
        }

    })
    .catch(err => {
        console.error(err);
        console.error('Failed to generate PlantUML');
        process.exit(1);
    })
    .then(() => {
        process.exit(0);
    })

/**
 * Normalize puml path
 * @param path
 */
function normalizePumlPath(path: string): string {
    if (path.endsWith('.puml')) {
        return path;
    } else {
        return path + '.puml';
    }
}

async function getOpenAPIJSON(): Promise<any> {
    if (!options.input && !options.url) {
        console.error('No input file or url');
        return Promise.reject();
    }

    if (options.input) {
        return pathExists(options.input)
            .then(exist => {
                if (!exist) {
                    console.error('Invalid input file path');
                    return Promise.reject();
                } else {
                    return tryParseInput(options.input || 'openapi.yaml')
                }
            })
    } else {
        const url = options.url!;
        if (!url.startsWith('http')) {
            console.error('Invalid remote url');
            return Promise.reject();
        }
        return tryFetch(url);
    }
}

async function tryFetch(url: string): Promise<any> {
    try {
        const response = await fetch(url);
        return  response.json();
    } catch (err) {
        return undefined;
    }
}

/**
 * Try to parse input by json or yaml
 * @param input
 */
async function tryParseInput(input: string): Promise<any> {
    const inputPath = resolve(process.cwd(), input);

    const tryJSON = async () => {
        try {
            const jsonStr = await readFile(inputPath, { encoding: 'utf-8' });
            return JSON.parse(jsonStr);
        } catch (err) {
            return undefined;
        }
    }

    const tryYAML = async () => {
        try {
            const yamlStr = await readFile(inputPath, { encoding: 'utf-8' });
            return parse(yamlStr);
        } catch (err) {
            return undefined;
        }
    }

    return await tryJSON() || await tryYAML();
}

