var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { readdir, readFile, open, stat } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
export const isFileAscii = async (filePath) => {
    let isAscii = true;
    try {
        const contents = await readFile(filePath);
        for (const pair of contents.entries()) {
            if (pair[1] > 127) {
                isAscii = false;
                break;
            }
        }
        return isAscii;
    }
    catch (e) {
        throw e;
    }
};
export const openFilePath = async (filePath) => {
    try {
        const file = await open(filePath);
        return file;
    }
    catch (e) {
        throw e;
    }
};
export const lookupGitIgnoreContents = async () => {
    var _a, e_1, _b, _c;
    let gitIgnoreContents = [];
    try {
        const file = await openFilePath('./.gitignore');
        try {
            for (var _d = true, _e = __asyncValues(file.readLines()), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const line = _c;
                if (!line.startsWith('#')) {
                    gitIgnoreContents.push(line);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        gitIgnoreContents = gitIgnoreContents.filter(elm => elm);
        return gitIgnoreContents;
    }
    catch (e) {
        throw e;
    }
};
export const lookupAiIgnoreContents = async () => {
    var _a, e_2, _b, _c;
    let aiIgnoreContents = [];
    try {
        const file = await openFilePath('./.aiignore');
        try {
            for (var _d = true, _e = __asyncValues(file.readLines()), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const line = _c;
                if (!line.startsWith('#')) {
                    aiIgnoreContents.push(line);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
        aiIgnoreContents = aiIgnoreContents.filter(elm => elm);
        return aiIgnoreContents;
    }
    catch (e) {
        throw e;
    }
};
export const shouldIgnoreFile = async (file, options) => {
    const { gitIgnoreContents = [], aiIgnoreContents = [], ignore = [] } = options;
    let shouldIgnore = false;
    try {
        const stats = await stat(file);
        const dir = dirname(file);
        const base = basename(file);
        if (stats.isDirectory()) {
            shouldIgnore = true;
        }
        if (ignore) {
            for (const userSpecifiedIgnore of ignore) {
                let wildcardParts = userSpecifiedIgnore.split('*');
                if (wildcardParts.length > 1) {
                    wildcardParts = wildcardParts.filter(n => n);
                    for (const wildCardPart of wildcardParts) {
                        if (`/${dir}`.includes(wildCardPart) ||
                            dir.includes(wildCardPart) ||
                            base.includes(wildCardPart) ||
                            file.includes(wildCardPart)) {
                            shouldIgnore = true;
                        }
                    }
                }
                if (`/${dir}`.includes(userSpecifiedIgnore) ||
                    dir.includes(userSpecifiedIgnore) ||
                    base.includes(userSpecifiedIgnore) ||
                    file.includes(userSpecifiedIgnore)) {
                    shouldIgnore = true;
                }
            }
        }
        if (gitIgnoreContents) {
            for (const gitignore of gitIgnoreContents) {
                let wildcardParts = gitignore.split('*');
                if (wildcardParts.length > 1) {
                    wildcardParts = wildcardParts.filter(n => n);
                    for (const wildCardPart of wildcardParts) {
                        if (`/${dir}`.includes(wildCardPart) ||
                            dir.includes(wildCardPart) ||
                            base.includes(wildCardPart) ||
                            file.includes(wildCardPart)) {
                            shouldIgnore = true;
                        }
                    }
                }
                if (`/${dir}`.includes(gitignore) ||
                    dir.includes(gitignore) ||
                    base.includes(gitignore) ||
                    file.includes(gitignore)) {
                    shouldIgnore = true;
                }
            }
        }
        if (aiIgnoreContents) {
            for (const aiignore of aiIgnoreContents) {
                let wildcardParts = aiignore.split('*');
                if (wildcardParts.length > 1) {
                    wildcardParts = wildcardParts.filter(n => n);
                    for (const wildCardPart of wildcardParts) {
                        if (`/${dir}`.includes(wildCardPart) ||
                            dir.includes(wildCardPart) ||
                            base.includes(wildCardPart) ||
                            file.includes(wildCardPart)) {
                            shouldIgnore = true;
                        }
                    }
                }
                if (`/${dir}`.includes(aiignore) ||
                    dir.includes(aiignore) ||
                    base.includes(aiignore) ||
                    file.includes(aiignore)) {
                    shouldIgnore = true;
                }
            }
        }
        if (stats.isFile() &&
            dir.startsWith('.') &&
            dir !== '.' &&
            !dir.startsWith('./') &&
            !file.startsWith('./')) {
            shouldIgnore = true;
        }
        if (file.startsWith('./.')) {
            shouldIgnore = true;
        }
        if (stats.isDirectory()) {
            shouldIgnore = true;
        }
        else {
            if (!await isFileAscii(file)) {
                shouldIgnore = true;
            }
        }
        return shouldIgnore;
    }
    catch (e) {
        throw e;
    }
};
export const processPathArray = async (pathArray, options) => {
    var _a, e_3, _b, _c;
    const { recursive = false } = options;
    let fileList = [];
    try {
        for (var _d = true, pathArray_1 = __asyncValues(pathArray), pathArray_1_1; pathArray_1_1 = await pathArray_1.next(), _a = pathArray_1_1.done, !_a; _d = true) {
            _c = pathArray_1_1.value;
            _d = false;
            const val = _c;
            try {
                const stats = await stat(val);
                if (stats.isDirectory()) {
                    const dirContents = await readdir(val, { recursive, withFileTypes: true });
                    const files = dirContents.filter((dirent) => dirent.isFile());
                    fileList.push(...files.map((dirent) => `${(dirent.path.endsWith('/') ? dirent.path : dirent.path + '/')}${dirent.name}`));
                }
                else {
                    fileList.push(val);
                }
            }
            catch (e) {
                throw e;
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = pathArray_1.return)) await _b.call(pathArray_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    fileList = [...new Set(fileList)];
    return fileList;
};
//# sourceMappingURL=utils.js.map