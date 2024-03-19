import express from 'express';
import fs from 'fs';
import hjson from 'hjson';
import path from 'path';
import { callSGP } from './call-sgp';

const rootDir = path.resolve(__dirname, '..');
const { model, port, verboseError } = hjson.parse(fs.readFileSync(path.join(rootDir, 'config.hjson')).toString());

globalThis.verboseError = verboseError;

const app = express();
app.use(express.json());

app.get('/v1/models', (_req, res) => {
    console.log('get /models');
    res.send({
        data: [
            {
                id: 'claude-3',
                object: 'model',
                created: 0,
                owned_by: '-',
            },
        ],
    });
});

app.post('/v1/chat/completions', async (req, res) => {
    const { messages, temperature, maxTokens, stream, topP } = req.body;
    console.log(messages);
    const key = req.headers['authorization']!;
    const match = /^\s*Bearer\s*(sgp_\S*)\s*$/.exec(key);
    if (!match) {
        console.error('invalid authorization header');
        res.status(401).send({ error: 'invalid authorization header' });
        return;
    }
    const sgpKey = match[1];
    await callSGP(model, sgpKey, messages, { temperature, max_tokens: maxTokens, stream, topP }, res);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}!`);
});
