#!/usr/bin/env node
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var _a, e_1, _b, _c, _d, e_2, _e, _f;
import yargs from 'yargs';
import ora from 'ora';
import chalk from 'chalk';
import * as _ from 'lodash';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import readline from 'readline';
import { processPathArray, lookupGitIgnoreContents, lookupAiIgnoreContents, shouldIgnoreFile } from './lib/utils.js';
import { generatePromptMessages, callOpenAIApi } from './lib/openai.js';
const argv = yargs(process.argv.slice(2))
    .usage('$0 [options]')
    .option('path', {
    alias: 'p',
    type: 'array',
    describe: 'Path to a file(s) or folder(s) to scan and create documentation for, multiple values allowed',
    demandOption: true,
    normalize: true,
    requiresArg: true,
})
    .option('output', {
    alias: 'o',
    type: 'string',
    describe: 'Path to the folder location where you want the documentation to be created',
    demandOption: true,
    normalize: true,
    requiresArg: true,
})
    .option('ignore', {
    alias: 'i',
    type: 'array',
    describe: 'Path to file(s) or folder(s) to ignore and exclude from the documentation process, multiple values allowed',
    demandOption: false,
    default: [],
    requiresArg: true,
})
    .option('recursive', {
    alias: 'r',
    type: 'boolean',
    describe: 'If directories are provided for the path option, recursively scan them for files to document',
    default: false,
})
    .option('model', {
    alias: 'm',
    describe: 'The OpenAI model you want to use',
    choices: ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k'],
    default: 'gpt-3.5-turbo',
    requiresArg: true,
})
    .option('apiKey', {
    alias: 'k',
    type: 'string',
    describe: 'Pass in your OpenAI API key using this flag, alternatively you can export an environment variable of OPENAI_API_KEY with your key',
    default: '',
    requiresArg: true,
})
    .option('non-interactive', {
    alias: 'n',
    type: 'boolean',
    describe: 'Set this flag if you want to skip the confirmation prompt before generating documentation',
    default: false,
})
    .example([
    ['$0 -p ./file.js -o ./docs', 'Document a single file'],
    ['$0 --path ./folder --recursive --output ./docs', 'Scan a folder recursively and document all valid files'],
])
    .help()
    .wrap(null)
    .argv;
const scriptArguments = JSON.stringify(argv);
const { path, output, ignore, recursive, model: openaiModel, n: nonInteractive, apiKey, } = JSON.parse(scriptArguments);
const interactiveMode = !nonInteractive;
let openaiApiKeyIsSet = false;
let openaiApiKey = '';
if (process.env.OPENAI_API_KEY) {
    openaiApiKeyIsSet = true;
    openaiApiKey = process.env.OPENAI_API_KEY;
}
if (apiKey.length > 0) {
    openaiApiKeyIsSet = true;
    openaiApiKey = apiKey;
}
if (!openaiApiKeyIsSet) {
    console.error(chalk.bgRed('OpenAI API key not found, please follow instructions in README.md'));
}
let pathItemsValid = true;
try {
    for (var _g = true, path_1 = __asyncValues(path), path_1_1; path_1_1 = await path_1.next(), _a = path_1_1.done, !_a; _g = true) {
        _c = path_1_1.value;
        _g = false;
        const fp = _c;
        try {
            await stat(fp);
        }
        catch (e) {
            pathItemsValid = false;
            console.error(chalk.bgRed(e.message));
        }
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (!_g && !_a && (_b = path_1.return)) await _b.call(path_1);
    }
    finally { if (e_1) throw e_1.error; }
}
let outputItemValid = true;
try {
    const outputStats = await stat(output);
    if (!outputStats.isDirectory()) {
        console.error(chalk.bgRed('Output path is not a valid directory'));
        outputItemValid = false;
    }
}
catch (e) {
    outputItemValid = false;
    console.error(chalk.bgRed(e.message));
}
const documentFile = async (file) => {
    const fileContents = await readFile(file, 'ascii');
    const promptMessages = await generatePromptMessages(file, fileContents);
    const openAIResponse = await callOpenAIApi(promptMessages, openaiModel, openaiApiKey);
    const { created, model, choices, usage } = openAIResponse;
    const message = _.get(_.first(choices), 'message');
    const finishReason = _.get(_.first(choices), 'finish_reason');
    const mdContent = `# ${file}

${_.get(message, 'content')}

#### OpenAI Metadata

* Created: ${created}
* Model: ${model}
* Usage:
  * Prompt Tokens: ${_.get(usage, 'prompt_tokens', '?')}
  * Completion Tokens: ${_.get(usage, 'completion_tokens', '?')}
  * Total Tokens: ${_.get(usage, 'total_tokens', '?')}
* Finish Reason: ${finishReason}
  `;
    try {
        await writeFile(`${output}/${basename(file)}.md`, mdContent);
    }
    catch (e) {
        throw e;
    }
    return openAIResponse;
};
const documentFiles = async (files) => {
    var _a, e_3, _b, _c;
    const spinner = ora('Building documentation').start();
    try {
        for (var _d = true, files_1 = __asyncValues(files), files_1_1; files_1_1 = await files_1.next(), _a = files_1_1.done, !_a; _d = true) {
            _c = files_1_1.value;
            _d = false;
            const file = _c;
            try {
                await documentFile(file);
            }
            catch (e) {
                spinner.fail(`Error creating documentation: ${e.message}`);
                throw e;
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = files_1.return)) await _b.call(files_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    spinner.succeed(`Successfully created documentation in ${output}`);
};
let filesToDocument = [];
if (pathItemsValid && outputItemValid && openaiApiKeyIsSet) {
    let gitIgnoreContents = [];
    try {
        gitIgnoreContents = await lookupGitIgnoreContents();
    }
    catch (e) {
    }
    let aiIgnoreContents = [];
    try {
        aiIgnoreContents = await lookupAiIgnoreContents();
    }
    catch (e) {
    }
    const options = {
        ignore: [...ignore, output],
        recursive: (recursive) ? true : false,
        gitIgnoreContents,
        aiIgnoreContents
    };
    const allFiles = await processPathArray(path, options);
    try {
        for (var _h = true, allFiles_1 = __asyncValues(allFiles), allFiles_1_1; allFiles_1_1 = await allFiles_1.next(), _d = allFiles_1_1.done, !_d; _h = true) {
            _f = allFiles_1_1.value;
            _h = false;
            const file = _f;
            const shouldIgnore = await shouldIgnoreFile(file, options);
            if (!shouldIgnore) {
                filesToDocument.push(file);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (!_h && !_d && (_e = allFiles_1.return)) await _e.call(allFiles_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    if (filesToDocument.length === 0) {
        console.log(chalk.bgYellow('No files found to create documentation for, double check your input options'));
    }
    else {
        if (interactiveMode) {
            console.log(chalk.blue('Continue with documenting the following file(s)?'));
        }
        else {
            console.log(chalk.blue('Building documenting for following files:'));
        }
        filesToDocument.forEach((file) => {
            console.log(chalk.bold(`-> ${file}`));
        });
        if (interactiveMode) {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            const continueResponses = ['y', 'yes'];
            rl.question(`[Y/n] `, response => {
                if (continueResponses.indexOf(response.toLowerCase()) >= 0 || response === '') {
                    documentFiles(filesToDocument);
                }
                else {
                    console.log(chalk.bgYellow('Aborting'));
                }
                rl.close();
            });
        }
        else {
            documentFiles(filesToDocument);
        }
    }
}
//# sourceMappingURL=index.js.map