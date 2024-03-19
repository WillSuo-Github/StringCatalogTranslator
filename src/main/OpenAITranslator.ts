import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as xml2js from 'xml2js';

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

interface Translation {
    source: string;
    sourceLanguage: string;
    targetLanguage: string;
}


class OpenAITranslator {
    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }


    async translateFiles(files: File[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const promises = files.map((file) => this.translateFile(file));
            Promise.all(promises)
                .then((results) => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    private async translateFile(file: File): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.readFile(file.path, 'utf-8', (err, data) => {
                if (err) {
                    console.error('Failed to read file:', err);
                    reject(err);
                    return;
                }

                // 解析 XML
                xml2js.parseString(data, (parseErr: Error, result) => {
                    if (parseErr) {
                        console.error('Failed to parse XML:', parseErr);
                        reject(parseErr);
                        return;
                    }

                    // 提取 source 和语言信息
                    const files = result.xliff.file;
                    files.forEach((file: any) => {
                        const sourceLanguage = file.$.sourceLanguage;
                        const targetLanguage = file.$.targetLanguage;
                        const transUnits = file.body[0]['trans-unit'];
                        transUnits.forEach((transUnit: any) => {
                            const sourceText = transUnit.source[0];
                            const translation = ''; // 这里放置翻译逻辑，留空作为示例
                            console.log('Source Text:', sourceText);
                            console.log('Source Language:', sourceLanguage);
                            console.log('Target Language:', targetLanguage);

                            // 插入翻译结果到原始文件
                            transUnit.translation = [{ _: translation }];
                        });
                    });

                    // 将修改后的 XML 转换为字符串
                    const builder = new xml2js.Builder();
                    const updatedXml = builder.buildObject(result);

                    // 将修改后的 XML 字符串写回文件
                    fs.writeFile(file.path, updatedXml, (writeErr) => {
                        if (writeErr) {
                            console.error('Failed to write file:', writeErr);
                            reject(writeErr);
                        } else {
                            console.log('File updated successfully.');
                            resolve(updatedXml);
                        }
                    });
                });
            });
        });
    }


    private async translate(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
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
