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

    return out;
}
