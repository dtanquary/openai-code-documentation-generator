import {
    isFileAscii,
    lookupGitIgnoreContents,
    shouldIgnoreFile,
    processPathArray
} from '../../src/lib/utils';

test('check if file is ascii', async () => {
    expect(await isFileAscii('./src/lib/utils.ts')).toBe(true);
});

test('check gitignore array', async () => {
    expect(await lookupGitIgnoreContents()).toContain('/coverage');
});

test('check if should ignore file: true', async () => {
    expect(await shouldIgnoreFile('./src/lib/utils.ts', { ignore: ['./src/lib/utils.ts'] })).toBe(true);
});

test('check if should ignore file: false', async () => {
    expect(await shouldIgnoreFile('./src/lib/utils.ts', { ignore: [] })).toBe(false);
});

test('check if path array returns path', async () => {
    expect(await processPathArray(['./src/lib/utils.ts'], { recursive: false, ignore: []})).toContain('./src/lib/utils.ts');
});