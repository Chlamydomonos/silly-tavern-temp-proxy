import { Message } from './call-sgp';

export function parseMessages(messages: Message[]) {
    let currentRole = 'system';
    let currentMessage = '';
    let canBeSystem = true;
    const out: any[] = [];
    for (const message of messages) {
        if (message.role == 'system' && !canBeSystem) {
            message.role = 'user';
        }
        if (message.role == currentRole) {
            currentMessage += '\n\n' + message.content;
        } else {
            out.push({
                role: currentRole,
                content: [
                    {
                        type: 'text',
                        text: currentMessage,
                    },
                ],
            });
            if (message.role == 'assistant' && currentRole == 'system') {
                out.push({
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: '[Start conversation]',
                        },
                    ],
                });
            }
            currentRole = message.role;
            currentMessage = message.content;
            canBeSystem = false;
        }
    }

    out.push({
        role: currentRole,
        content: [
            {
                type: 'text',
                text: currentMessage,
            },
        ],
    });

    if (out[0].role != 'system') {
        out.unshift({
            role: 'system',
            content: [
                {
                    type: 'text',
                    text: '',
                },
            ],
        });
    }

    let hasBannedStr1 = false;
    for (const message of out) {
        if (message.content[0].text.includes('查看上文后分两次回复')) {
            hasBannedStr1 = true;
            break;
        }
    }

    if (hasBannedStr1) {
        out[0].content[0].text = 'You are Cody' + out[0].content[0].text;
    }

    return out;
}
