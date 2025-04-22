import OpenAI from 'openai';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
import path from 'path';
// import { ContextExclusionPlugin } from 'webpack';

interface Translation {
    source: string;
    sourceLanguage: string;
    targetLanguage: string;
}

interface Localization {
    state: string;
    value: string;
}

interface StringUnit {
    stringUnit: Localization;
}

interface Localizations {
    [key: string]: StringUnit;
}

interface StringInfo {
    comment?: string;
    extractionState?: string;
    localizations: Localizations;
    shouldTranslate: boolean;
}

interface Strings {
    [key: string]: StringInfo;
}

interface FileContent {
    sourceLanguage: string;
    strings: Strings;
    version: string;
}

interface TranslationTask {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    key: string;
    langCode: string;
}

class OpenAITranslator {
    private client: OpenAI;
    private concurrencyLimit: number;

    constructor(apiKey: string, concurrencyLimit = 10) {
        this.client = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true
        });
        this.concurrencyLimit = concurrencyLimit;
    }

    async translateStringFilePaths(filePaths: string[], progressCallback: (progress: string) => void): Promise<void> {
        const allStringsFiles = this.scanFiles(filePaths, '.xcstrings');
        console.log('allStringsFiles:', allStringsFiles);

        // Process files concurrently
        const filePromises = allStringsFiles.map(filePath =>
            this.translateStringFilePath(filePath, progressCallback)
        );

        await Promise.all(filePromises);
    }

    private async translateStringFilePath(filePath: string, progressCallback: (progress: string) => void): Promise<void> {
        const fileContent: FileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const languageCodes = [
          'ar', 'ca', 'cs', 'da', 'de', 'el', 'es', 'es-419', 'fi', 'fr', 'fr-CA',
          'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nb', 'nl', 'pl',
          'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sv', 'th', 'tr', 'uk', 'vi',
          'zh-Hans', 'zh-Hant', 'zh-HK', 'bn', 'bg', 'kn', 'kk', 'lt', 'ml',
          'mr', 'or', 'pa', 'sl', 'es-US', 'ta', 'te', 'ur',
        ];

        // Collect all translation tasks
        const allTranslationTasks: TranslationTask[] = [];

        for (const key in fileContent.strings) {
            const stringInfo = fileContent.strings[key];
            console.log('key:', key, 'stringInfo', stringInfo);
            let sourceValue = '';

            if (stringInfo.shouldTranslate === false) {
                console.log(`skip translating: ${key}`);
                continue;
            }

            if (!stringInfo.localizations) {
                stringInfo.localizations = {};
            }

            if (stringInfo.localizations[fileContent.sourceLanguage]?.stringUnit.state === 'new') {
                sourceValue = stringInfo.localizations[fileContent.sourceLanguage]?.stringUnit.value || key;
            } else {
                sourceValue = key;
            }

            if (sourceValue.length === 0) {
                console.log(`skip translating: ${key}`);
                continue;
            }

            // Collect translation tasks for languages that need to be translated
            for (const langCode of languageCodes) {
                if (!stringInfo.localizations[langCode]) {
                    allTranslationTasks.push({
                        text: sourceValue,
                        sourceLanguage: fileContent.sourceLanguage,
                        targetLanguage: langCode,
                        key,
                        langCode
                    });
                }
            }
        }

        // Process translations in batches to control concurrency
        await this.processBatchTranslations(allTranslationTasks, fileContent, progressCallback);

        // Write updated content back to file
        fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
        console.log(`file ${filePath} update complete.`);
    }

    private async processBatchTranslations(
        tasks: TranslationTask[],
        fileContent: FileContent,
        progressCallback: (progress: string) => void
    ): Promise<void> {
        // Process translations in batches to limit concurrency
        for (let i = 0; i < tasks.length; i += this.concurrencyLimit) {
            const batch = tasks.slice(i, i + this.concurrencyLimit);

            const batchPromises = batch.map(async task => {
                try {
                    const translatedText = await this.translateText(
                        task.text,
                        task.sourceLanguage,
                        task.targetLanguage
                    );

                    // Update the fileContent with translation result
                    fileContent.strings[task.key].localizations[task.langCode] = {
                        stringUnit: {
                            state: 'translated',
                            value: translatedText
                        }
                    };

                    progressCallback(`translating: ${task.text} to ${task.langCode}`);
                    return { success: true, task };
                } catch (error) {
                    console.error(`Translation failed for ${task.text} to ${task.langCode}:`, error);
                    return { success: false, task, error };
                }
            });

            await Promise.all(batchPromises);
        }
    }

    async translateXliffFilePaths(filePaths: string[]): Promise<void> {
        const allXliffFiles = this.scanFiles(filePaths, '.xliff');
        console.log('allXliffFiles:', allXliffFiles);

        const promises = allXliffFiles.map(filePath => this.translateXliffFilePath(filePath));
        await Promise.all(promises);
    }

    private scanFiles(paths: string[], fileExtension: string): string[] {
        const xliffFiles: string[] = [];

        // 递归扫描目录下的所有文件
        const scanDirectory = (dir: string) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    // 如果是目录，则递归扫描
                    scanDirectory(filePath);
                } else if (path.extname(filePath).toLowerCase() === fileExtension) {
                    // 如果是文件，则加入结果数组
                    xliffFiles.push(filePath);
                }
            });
        };

        // 处理单个路径的函数
        const processPath = (p: string) => {
            const stat = fs.statSync(p);
            if (stat.isDirectory()) {
                scanDirectory(p);
            } else if (path.extname(p).toLowerCase() === fileExtension) {
                // 如果是文件，则直接添加到结果数组
                xliffFiles.push(p);
            }
        };

        // 对每个路径进行处理
        paths.forEach(processPath);

        return xliffFiles;
    }

    async getAllXliffFiles(filePath: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            const xliffFiles: string[] = [];

            const traverseDirectory = (currentPath: string) => {
                fs.readdir(currentPath, { withFileTypes: true }, async (err, files) => {
                    if (err) {
                        console.error('Failed to read directory:', err);
                        reject(err);
                        return;
                    }

                    for (const file of files) {
                        const filePath = path.join(currentPath, file.name);
                        if (file.isDirectory()) {
                            // 如果是子目录，则递归遍历
                            traverseDirectory(filePath);
                        } else if (this.isXliffFile(filePath)) {
                            // 如果是 xliff 文件，则添加到数组
                            console.log('file is xliff file', filePath, 'xliffFiles', xliffFiles);
                            xliffFiles.push(filePath);
                        }
                    }

                    if (currentPath === filePath) {
                        // 如果当前路径是初始目录路径，则表示遍历完成
                        console.log('final Xliff files:', xliffFiles);
                        resolve(xliffFiles);
                    }
                    console.log('currentPath:', currentPath, 'filePath:', filePath);
                });
            };

            try {
                const stats = fs.statSync(filePath);
                if (stats.isFile() && this.isXliffFile(filePath)) {
                    xliffFiles.push(filePath);
                    resolve(xliffFiles);
                } else if (stats.isDirectory()) {
                    traverseDirectory(filePath);
                } else {
                    console.log(`${filePath} is neither a xliff file nor a directory.`);
                    reject(`${filePath} is neither a xliff file nor a directory.`);
                }
            } catch (err) {
                console.error('Failed to get file stats:', err);
                reject(err);
            }
        });
    }

    private isXliffFile(filePath: string): boolean {
        return filePath.toLowerCase().endsWith('.xliff');
    }

    private async translateXliffFilePath(filePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                    console.error('Failed to read file:', err);
                    reject(err);
                    return;
                }

                // 解析 XML
                xml2js.parseString(data, (parseErr: Error | null, result: any) => {
                    if (parseErr) {
                        console.error('Failed to parse XML:', parseErr);
                        reject(parseErr);
                        return;
                    }

                    // 提取 source 和语言信息
                    const files = result.xliff.file;
                    const translationTasks: Array<{
                        transUnit: any;
                        sourceText: string;
                        sourceLanguage: string;
                        targetLanguage: string;
                    }> = [];

                    // Collect all translation tasks
                    for (const file of files) {
                        const sourceLanguage = file.$['source-language'];
                        const targetLanguage = file.$['target-language'];
                        const transUnits = file.body[0]['trans-unit'];

                        for (const transUnit of transUnits) {
                            const sourceText = transUnit.source[0];
                            translationTasks.push({
                                transUnit,
                                sourceText,
                                sourceLanguage,
                                targetLanguage
                            });
                        }
                    }

                    // Process translations in batches
                    this.processXliffTranslations(translationTasks)
                        .then(() => {
                            try {
                                // 将修改后的 XML 转换为字符串
                                const builder = new xml2js.Builder();
                                const updatedXml = builder.buildObject(result);

                                // 将修改后的 XML 字符串写回文件
                                console.log('Writing updated file...');
                                fs.writeFile(filePath, updatedXml, (writeErr) => {
                                    if (writeErr) {
                                        console.error('Failed to write file:', writeErr);
                                        reject(writeErr);
                                    } else {
                                        console.log('File updated successfully.');
                                        resolve();
                                    }
                                });
                            } catch (error) {
                                reject(error);
                            }
                        })
                        .catch(error => {
                            reject(error);
                        });
                });
            });
        });
    }

    private async processXliffTranslations(
        tasks: Array<{
            transUnit: any;
            sourceText: string;
            sourceLanguage: string;
            targetLanguage: string;
        }>
    ): Promise<void> {
        // Process translations in batches to limit concurrency
        for (let i = 0; i < tasks.length; i += this.concurrencyLimit) {
            const batch = tasks.slice(i, i + this.concurrencyLimit);

            const batchPromises = batch.map(async task => {
                try {
                    const translatedText = await this.translateText(
                        task.sourceText,
                        task.sourceLanguage,
                        task.targetLanguage
                    );

                    console.log('Translation:', translatedText);
                    console.log('Source Text:', task.sourceText);
                    console.log('Source Language:', task.sourceLanguage);
                    console.log('Target Language:', task.targetLanguage);

                    const targetElement = {
                        '$': { state: 'translated' },
                        '_': translatedText  // 使用翻译后的文本
                    };

                    // 将 target 元素添加到 trans-unit 的同级中
                    task.transUnit.target = [targetElement];

                    return { success: true, task };
                } catch (error) {
                    console.error(`Translation failed for ${task.sourceText} to ${task.targetLanguage}:`, error);
                    return { success: false, task, error };
                }
            });

            await Promise.all(batchPromises);
        }
    }

    private async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
        try {
            if (this.isPureNumber(text)) {
                return text;
            } else if (text.length === 0) {
                return text;
            }

            const messageContent = `You are a professional translation expert, and I am internationalizing the translation for a desktop or mobile application I am developing myself. Please translate the following text directly into ${targetLanguage}, without including any prefixes, suffixes, tildes, or other additional characters.
            ${text}`;

            const response = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: messageContent }],
                model: 'gpt-4o',
            });

            console.log('chatCompletion:', response);
            const result = response.choices[0].message.content;
            return result || '';
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error:', error);
                throw new Error(`Translation failed: ${error.message}`);
            } else {
                // 处理非 Error 类型的错误
                console.error('An unknown error occurred:', error);
                throw new Error('An unknown error occurred');
            }
        }
    }

    private isPureNumber(str: string): boolean {
        // 使用+运算符将字符串转换为数字，然后检查是否为NaN
        return !Number.isNaN(+str);
    }
}

export default OpenAITranslator;
