import { readdir, readFile, open, stat } from 'node:fs/promises';
import { basename, dirname } from 'node:path';

export const isFileAscii = async (filePath: string) => {
    let isAscii = true;
    try {
        const contents = await readFile(filePath);
        for (const pair of contents.entries()) {
            if (pair[1] > 127) { isAscii = false; break; }
        }
        return isAscii;
    } catch (e) {
        throw e;
    }
}

export const openFilePath = async (filePath: string) => {
    try {
        const file = await open(filePath);
        return file;
    } catch (e) {
        throw e;
    }
}

export const lookupGitIgnoreContents = async () => {
    let gitIgnoreContents = [];
    try {
        const file = await openFilePath('./.gitignore');
        for await (const line of file.readLines()) {
            if (!line.startsWith('#')) {
                gitIgnoreContents.push(line);
            }
        }
         // remove blank elements
        gitIgnoreContents = gitIgnoreContents.filter(elm => elm);
        return gitIgnoreContents;
    } catch (e) {
        throw e;
    }
}

export const lookupAiIgnoreContents = async () => {
    let aiIgnoreContents = [];
    try {
        const file = await openFilePath('./.aiignore');
        for await (const line of file.readLines()) {
            if (!line.startsWith('#')) {
                aiIgnoreContents.push(line);
            }
        }
        // remove blank elements
        aiIgnoreContents = aiIgnoreContents.filter(elm => elm);
        return aiIgnoreContents;
    } catch (e) {
        throw e;
    }
}

export const shouldIgnoreFile = async (file: string, options: any) => {
    const { gitIgnoreContents = [], aiIgnoreContents = [], ignore = [] } = options;
    let shouldIgnore = false;
    try {
        const stats = await stat(file);
        const dir = dirname(file);
        const base = basename(file);

        // console.log(file);
        // console.log(base);
        // console.log(dir);

        // ignore directories directly, we only want files
        if (stats.isDirectory()) {
            shouldIgnore = true;
        }

        if (ignore) {
            for (const userSpecifiedIgnore of ignore) {
                let wildcardParts: Array<string> = userSpecifiedIgnore.split('*');
                if (wildcardParts.length > 1) {
                    wildcardParts = wildcardParts.filter(n => n);
                    for (const wildCardPart of wildcardParts) {
                        if (
                            `/${dir}`.includes(wildCardPart) ||
                            dir.includes(wildCardPart) ||
                            base.includes(wildCardPart) ||
                            file.includes(wildCardPart)
                        ) {
                            // console.log('User specified to ignore this via wildcard, skipping');
                            shouldIgnore = true;
                        }
                    }
                }
    
                if (
                    `/${dir}`.includes(userSpecifiedIgnore) ||
                    dir.includes(userSpecifiedIgnore) ||
                    base.includes(userSpecifiedIgnore) ||
                    file.includes(userSpecifiedIgnore)
                ) {
                    // console.log('User specified to ignore this, skipping');
                    shouldIgnore = true;
                }
            }
        }
    
        if (gitIgnoreContents) {
            for (const gitignore of gitIgnoreContents) {
                let wildcardParts: Array<string> = gitignore.split('*');
                if (wildcardParts.length > 1) {
                    wildcardParts = wildcardParts.filter(n => n);
                    for (const wildCardPart of wildcardParts) {
                        if (
                            `/${dir}`.includes(wildCardPart) ||
                            dir.includes(wildCardPart) ||
                            base.includes(wildCardPart) ||
                            file.includes(wildCardPart)
                        ) {
                            // console.log('found file in .gitignore, skipping');
                            shouldIgnore = true;
                        }
                    }
                }

                if (
                    `/${dir}`.includes(gitignore) ||
                    dir.includes(gitignore) ||
                    base.includes(gitignore) ||
                    file.includes(gitignore)
                ) {
                    // console.log('found file in .gitignore, skipping');
                    shouldIgnore = true;
                }
            }
        }

        if (aiIgnoreContents) {
            for (const aiignore of aiIgnoreContents) {
                let wildcardParts: Array<string> = aiignore.split('*');
                if (wildcardParts.length > 1) {
                    wildcardParts = wildcardParts.filter(n => n);
                    for (const wildCardPart of wildcardParts) {
                        if (
                            `/${dir}`.includes(wildCardPart) ||
                            dir.includes(wildCardPart) ||
                            base.includes(wildCardPart) ||
                            file.includes(wildCardPart)
                        ) {
                            // console.log('found file in .aiignore, skipping');
                            shouldIgnore = true;
                        }
                    }
                }

                if (
                    `/${dir}`.includes(aiignore) ||
                    dir.includes(aiignore) ||
                    base.includes(aiignore) ||
                    file.includes(aiignore)
                ) {
                    // console.log('found file in .aiignore, skipping');
                    shouldIgnore = true;
                }
            }
        }
        
        // ignore hidden/dot files
        if (
            stats.isFile() &&
            dir.startsWith('.') &&
            dir !== '.' &&
            !dir.startsWith('./') &&
            !file.startsWith('./')
        ) {
            shouldIgnore = true;
        }

        if (file.startsWith('./.')) {
            shouldIgnore = true;
        }
    
        // ignore directories
        if (stats.isDirectory()) {
            shouldIgnore = true;
        } else {
            // ignore non ascii files
            if (!await isFileAscii(file)) {
                shouldIgnore = true;
            }
        }
        return shouldIgnore;
    } catch (e) {
        throw e;
    }
}

export const processPathArray = async (pathArray: Array<string>, options: any) => {
    const { recursive = false } = options;
    let fileList = [];
    for await (const val of pathArray) {
        try {
            const stats = await stat(val);
            if (stats.isDirectory()) {
                // console.log('dir:', val);
                const dirContents = await readdir(val, { recursive, withFileTypes: true });
                const files = dirContents.filter((dirent) => dirent.isFile());
                fileList.push(...files.map((dirent) => `${(dirent.path.endsWith('/') ? dirent.path : dirent.path + '/')}${dirent.name}`));
            } else {
                // console.log('file:', val);
                fileList.push(val);
            }
        } catch (e) {
            throw e;
        }
    }
    // create a uniq list of files
    fileList = [ ...new Set(fileList)];

    return fileList;
}