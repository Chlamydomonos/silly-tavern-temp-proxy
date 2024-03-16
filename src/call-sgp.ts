import axios from 'axios';
import { Response } from 'express';
import { generateSGD } from './generate-sgd';
import { parseMessages } from './parse-messages';

export interface Message {
    role: string;
    content: string;
}

interface ExtraBody {
    temperature: number;
    max_tokens: number;
    stream: boolean;
    topP: number;
}

const buildEventStart = (text: string) => ({
    id: '-',
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: '-',
    system_fingerprint: '-',
    choices: [
        {
            index: 0,
            delta: {
                role: 'assistant',
                content: text,
            },
            logprobs: null,
            finish_reason: null,
        },
    ],
});

const buildEventDelta = (text: string) => ({
    id: '-',
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: '-',
    system_fingerprint: '-',
    choices: [
        {
            index: 0,
            delta: {
                content: text,
            },
            logprobs: null,
            finish_reason: null,
        },
    ],
});

const buildEventStop = () => ({
    id: '-',
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: '-',
    system_fingerprint: '-',
    choices: [
        {
            index: 0,
            delta: {},
            logprobs: null,
            finish_reason: 'stop',
        },
    ],
});

export async function callSGP(model: string, key: string, messages: Message[], extra: ExtraBody, response: Response) {
    const sgdKey = generateSGD(key);

    const url = 'https://cody-gateway.sourcegraph.com/v1/completions/anthropic-messages';

    const body = {
        model,
        ...extra,
        topK: -1,
        messages: parseMessages(messages),
    };

    if (!body.max_tokens || body.max_tokens > 1000) {
        body.max_tokens = 1000;
    }

    const sgpResponse = await axios.post(url, body, {
        headers: {
            Authorization: `Bearer ${sgdKey}`,
            'X-Sourcegraph-Feature': 'chat_completions',
        },
        responseType: 'stream',
    });

    const decoder = new TextDecoder('utf-8');

    return new Promise<void>((resolve, _reject) => {
        sgpResponse.data.on('data', (data: any) => {
            const text = decoder.decode(data);
            const events = text.split('event:');
            for (const eventText of events) {
                const match = /^\s*(\S+)\s*data:\s*({.*})\s*$/s.exec(eventText);
                if (match) {
                    const event = match[1];
                    try {
                        const data = JSON.parse(match[2]);
                        console.log(event, data);
                        if (event == 'content_block_start') {
                            response.write(`data: ${JSON.stringify(buildEventStart(data.content_block.text))}\n\n`);
                        } else if (event == 'content_block_delta') {
                            response.write(`data: ${JSON.stringify(buildEventDelta(data.delta.text))}\n\n`);
                        } else if (event == 'content_block_stop') {
                            response.write(`data: ${JSON.stringify(buildEventStop())}\n\n`);
                            response.end();
                            resolve();
                        }
                    } catch (e) {
                        console.log(e);
                        console.log(event, text);
                    }
                }
            }
        });
    });
}
