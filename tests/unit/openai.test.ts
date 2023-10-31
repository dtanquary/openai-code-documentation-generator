import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { generatePromptMessages }from '../../src/lib/openai';

test('check if prompt message array is generated', async () => {
    expect(await generatePromptMessages('../../src/lib/openai', 'test')).toBeInstanceOf(Array<ChatCompletionMessageParam>);
});