import { OpenAI } from 'openai';
import { electron } from 'process';
import { ContextExclusionPlugin } from 'webpack';

interface ChatCompletion {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        message: {
            role: string;
            content: string;
        };
        logprobs: null;
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    system_fingerprint: string;
}

class OpenAITranslator {
    constructor(apiKey) {
        this.client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
        try {
            let messageContent = ` Please use the natural language codenamed ${targetLanguage} to express the content codenamed ${sourceLanguage} in this paragraph, and the direct output content does not need to be followed by semicolons and codes:
            ~~~
            ${text}
            ~~~
            `;

            const chatCompletion: ChatCompletion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: messageContent }],
                model: 'gpt-3.5-turbo',
            });
            let result = chatCompletion.choices[0].message.content;
            return result;
        } catch (error) {
            console.error('Error:', error);
            throw new Error(`Translation failed: ${error.message}`);
        }
    }
}

export default OpenAITranslator;
