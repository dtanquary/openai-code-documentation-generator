import OpenAI from 'openai';
import { extname } from 'node:path';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

// if (!process.env.OPENAI_API_KEY) {
//     throw new Error("OpenAI API key not configured, please follow instructions in README.md");
// }
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
// });

export const generatePromptMessages = async (file: string, fileContents: string) => {
    const ext = extname(file);

    const messages: Array<ChatCompletionMessageParam> =[
        {
            role: "system",
            content: `
            You are an assistant that only speaks in Markdown. Do not write text that isn't formatted as markdown.
            You will be provided with code from a${(ext) ? ` ` : ``}${ext} file, your task is to document this code.
            
            Example formatting:

            ## Overview

            This is a high-level overview of the code.

            ## Additional Info

            ### Installation and Setup

            Setup instructions.

            ### Dependencies

            - point 1
            - point 2

            ### Functions

            - point 1
            - point 2

            ### Possible Improvements

            - point 1
            - point 2

            ### Potential Arguments Against

            - point 1
            - point 2
            `
        },
        {
            role: "user",
            content: `
            Write: "## Overview"

            Then write a high-level overview of the code. Explain the purpose of the code, what it does, and why it exists.

            Then write: "## Additional Info".

            Then return a list of installation and setup instructions.
            Then return a list of any dependencies.
            Then return a list of any defined functions, the parameters they accept and what they do. Provide usage examples.
            Then return a list of any data structures that can be inferred from the code.
            Then return a list of any detected vulnerabilities or security concerns.
            Then return a list of potential improvements that can be made, no more than 5 points.

            For each list, return a Heading 2 before writing the list items.

            Code:
            
            ${fileContents}
            `
        }
    ];

    return messages;
}

export const callOpenAIApi = async (promptMessages: Array<ChatCompletionMessageParam>, model: string, apiKey: string) => {
    try {
        const openai = new OpenAI({ apiKey });
        const params: OpenAI.Chat.ChatCompletionCreateParams = {
            model,
            messages: promptMessages,
            temperature: 0,
        }
        const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
        return chatCompletion;
    } catch(error) {
        if (error instanceof OpenAI.APIError) {
            // console.log(error.status); // 400
            // console.log(error.name); // BadRequestError
            // console.log(error.headers); // {server: 'nginx', ...}
            throw new Error(`${error.status} Error received from OpenAI API request: ${error.name}`);
        } else {
            throw error;
        }
        // if (error.response) {
        //     console.error(error.response.status, error.response.data);
        //     throw new Error(`${error.response.status} Error received from OpenAI API request`);
        // } else {
        //     console.error(`Error with OpenAI API request: ${error.message}`);
        //     throw new Error(`Error with OpenAI API request: ${error.message}`);
        // }
    }
}