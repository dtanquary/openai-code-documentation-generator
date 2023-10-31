# OpenAI Code Documentation Generator

## Overview

This is a command-line tool that uses the OpenAI API to automatically generate documentation for files or folders specified. You can specify the path to the files or folders, the output directory for the generated documentation, and other options such as whether to ignore certain files or folders and whether to scan folders recursively. You are also able to choose which OpenAI model to use (the default model is [gpt-3.5-turbo](https://platform.openai.com/docs/models/gpt-3-5)).

While this project was written in javascript, you can specify any path to generate documentation for, it does not have to be run against a javascript project. As long as you have the correct version of nodejs installed you can use npx to run this for any project you want (see [limitations](#limitations) for more information).

## Usage

### Setup Information

#### Configure your OpenAI API key

You must either have an OpenAI api key exported as an environment variable:

```shell
export OPENAI_API_KEY=<your key here>
```

Or provide your api key as a command line argument at runtime (using the ``-k`` or ``--apiKey`` flags).

#### Set up automatic exclusions

You can optionally create a file named ``.aiignore`` in the root of your project to specify file(s) or path(s) you want this process to automatically ignore. This can make it easier to just point at your project root and scan recursively for code to document. It wll be explained in more detail later but you can also provide an argument at runtime to ignore specific files and/or paths.

For example the one I used for this project looks like this:
```shell
$ cat ./.aiignore
package.json
package-lock.json
/docs*
/tests
/dist
jest.config.ts
tsconfig.json
```

You can also set files and paths to be ignored at runtime using the ``-i`` or ``--ignore`` flags.

Note:

* If your project has a ``.gitignore`` file, files and paths in there will be excluded from the documentation process as well.
* Any dotfiles or hidden directories will automatically be ignored.

### Running the script

To see the available options run the following command:

```javascript
npx . --help
```

You will then see the following output:

```
openai-code-documentation-generator [options]

Options:
      --version          Show version number  [boolean]
  -p, --path             Path to a file(s) or folder(s) to scan and create documentation for, multiple values allowed  [array] [required]
  -o, --output           Path to the folder location where you want the documentation to be created  [string] [required]
  -i, --ignore           Path to file(s) or folder(s) to ignore and exclude from the documentation process, multiple values allowed  [array] [default: []]
  -r, --recursive        If directories are provided for the path option, recursively scan them for files to document  [boolean] [default: false]
  -m, --model            The OpenAI model you want to use  [choices: "gpt-3.5-turbo", "gpt-3.5-turbo-16k", "gpt-4", "gpt-4-32k"] [default: "gpt-3.5-turbo"]
  -k, --apiKey           Pass in your OpenAI API key using this flag, alternatively you can export an environment variable of OPENAI_API_KEY with your key  [string] [default: ""]
  -n, --non-interactive  Set this flag if you want to skip the confirmation prompt before generating documentation  [boolean] [default: false]
      --help             Show help  [boolean]

Examples:
  openai-code-documentation-generator -p ./file.js -o ./docs                       Document a single file
  openai-code-documentation-generator --path ./folder --recursive --output ./docs  Scan a folder recursively and document all valid files
```

Unless you provide the ``-n`` or ``--non-interactive`` flag, the script will want your confirmation before proceeding with the generation:

```shell
$ npx . -p ./src -r -o ./docs
Continue with documenting the following file(s)?
-> src/index.ts
-> src/lib/openai.ts
-> src/lib/utils.ts
[Y/n]
```

Note: The generation process can take some time depending on how many files you provide and what OpenAI model you select. Avoid manual aborting during generation. The script will throw any errors it runs into during the process.

## Limitations

* This process works best on projects that use a "well established" programming language. It will not perform well when trying to document newer languages.
* Generated documentation will need to be reviewed for accuracry and consistency and will likely require some final manual cleanup. You should not rely blindly on this process but rather use it as a helper to bootstrap your project documentation.
* Generated documentation will likely be unaware of any unit or integration tests and suggest you write them even when you already have.
* Extremely large files may have issues being processed by OpenAI as [there is a limit in how many tokens can be processed in a single call](https://platform.openai.com/docs/guides/gpt/managing-tokens). You can try using one of the models with a larger context ([gpt-3.5-turbo-16k](https://platform.openai.com/docs/models/gpt-3-5) or [gpt-4-32k](https://platform.openai.com/docs/models/gpt-4)) or you will need to refactor into smaller individual code files.
* GPT-4 yields the best results but also costs much more and takes longer to generate documentation with.

## Security Concerns

* Usage of the OpenAI API may raise privacy concerns, as the contents of your files are sent to their API.

## Contribution

If you would like to contribute to or modify this code you can get it running locally by checking out the repo and performing the following steps:

* If you have nvm installed you can run ``nvm use`` inside the repo to install the required version of nodejs, otherwise you will need to install nodejs 20.8.0 or greater.

* Once on the correct version of node run ``npm install`` to install the dependencies.

* You can then run the code locally by either running ``npx .`` or ``npm run start``

* Since this project was written in typescript you will need to run a build to compile any changes down to js files: ``npm run build``. The compiled js files are put in ``dist/``.

* To run the unit tests run ``npm run test``
