#!/usr/bin/env node

import yargs from 'yargs';
import ora from 'ora';
import chalk from 'chalk';
import * as _ from 'lodash';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import readline from 'readline';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
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
const {
  path,
  output,
  ignore,
  recursive,
  model: openaiModel,
  n: nonInteractive,
  apiKey,
} = JSON.parse(scriptArguments);

const interactiveMode = !nonInteractive;

// validate that process.env.OPENAI_API_KEY is set
let openaiApiKeyIsSet: boolean = false;
let openaiApiKey: string = '';

if (process.env.OPENAI_API_KEY) {
  openaiApiKeyIsSet = true;
  openaiApiKey = process.env.OPENAI_API_KEY;
}

if (apiKey.length > 0) {
  openaiApiKeyIsSet = true;
  openaiApiKey = apiKey;
  // throw new Error("OpenAI API key not configured, please follow instructions in README.md");
}

if (!openaiApiKeyIsSet) {
  console.error(chalk.bgRed('OpenAI API key not found, please follow instructions in README.md'));
    // throw new Error("OpenAI API key not configured, please follow instructions in README.md");
}

// validate item(s) in path are valid
let pathItemsValid = true;
for await (const fp of path) {
  try {
    await stat(fp);
  } catch (e) {
    pathItemsValid = false;
    console.error(chalk.bgRed(e.message));
  }
}

// validate output is a directory
let outputItemValid = true;
try {
  const outputStats = await stat(output);
  if (!outputStats.isDirectory()) {
    console.error(chalk.bgRed('Output path is not a valid directory'));
    outputItemValid = false;
  }
} catch (e) {
  outputItemValid = false;
  console.error(chalk.bgRed(e.message));
}


const documentFile = async (file: string) => {
  const fileContents: string = await readFile(file, 'ascii');
  const promptMessages: Array<ChatCompletionMessageParam> = await generatePromptMessages(file, fileContents);
  const openAIResponse: OpenAI.Chat.ChatCompletion = await callOpenAIApi(promptMessages, openaiModel, openaiApiKey);
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
  } catch (e) {
    throw e;
  }
  return openAIResponse;
}

const documentFiles = async (files: Array<string>) => {
  const spinner = ora('Building documentation').start();
  for await (const file of files) {
    try {
      await documentFile(file);
    } catch (e) {
      spinner.fail(`Error creating documentation: ${e.message}`);
      throw e;
    }
  }
  spinner.succeed(`Successfully created documentation in ${output}`);
}

let filesToDocument: Array<string> = [];

if (pathItemsValid && outputItemValid && openaiApiKeyIsSet) {
  let gitIgnoreContents: Array<string> = [];
  try {
      gitIgnoreContents = await lookupGitIgnoreContents();
  } catch (e) {
      // no .gitignore found, ignoring
  }

  let aiIgnoreContents: Array<string> = [];
  try {
      aiIgnoreContents = await lookupAiIgnoreContents();
  } catch (e) {
      // no .aiignore found, ignoring
  }

  const options = {
    ignore: [...ignore, output],
    recursive: (recursive) ? true : false,
    gitIgnoreContents,
    aiIgnoreContents
  };
  const allFiles = await processPathArray(path, options);
  for await (const file of allFiles) {
    const shouldIgnore = await shouldIgnoreFile(file, options);
    if (!shouldIgnore) {
        filesToDocument.push(file);
    }
  }
  if (filesToDocument.length === 0) {
    console.log(chalk.bgYellow('No files found to create documentation for, double check your input options'));
  } else {
    if (interactiveMode) {
      console.log(chalk.blue('Continue with documenting the following file(s)?'));
    } else {
      console.log(chalk.blue('Building documenting for following files:'));
    }
    filesToDocument.forEach((file) => {
      console.log(chalk.bold(`-> ${file}`));
    });
    if (interactiveMode) {
      const rl: readline.Interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      // confirm with user the files to document
      const continueResponses = ['y', 'yes'];
      rl.question(`[Y/n] `, response => {
        if (continueResponses.indexOf(response.toLowerCase()) >= 0 || response === '') {
          documentFiles(filesToDocument);
        } else {
          console.log(chalk.bgYellow('Aborting'));
        }
        rl.close();
      });
    } else {
      documentFiles(filesToDocument);
    }
  }
}
