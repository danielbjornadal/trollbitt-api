import { color, log, info, warn, crit } from './libs/log'
import { App } from './app'

import * as express from "express";

const { 
    BLOCKFROST_API_KEY: blockfrostApiKey = '',
    POOL_HASH: poolHash = '2220471638833bba1e69d450b5da722b592888d7a56f5cddf6efe1eb',
    RUN_INTERVAL_SECONDS: runIntervalSeconds = '',
    PORT: serverPort = 8080,
    DEV: dev = false,
    ENABLECOLORS: enableColors = true
} = process.env;


if(Boolean(enableColors && String(enableColors).toLowerCase() != 'false')) {
    color.enable();
} else {
    color.disable();
}


let app = new App(
    {
        blockfrostApiKey,
        poolHash,
        runIntervalSeconds,
        dev
    }
);
app.run();


const api = express();
api.set('trust proxy', true)

api.use(function (req, res, next) {
    let { method, originalUrl, connection: { remoteAddress }, headers } = req;
    let remoteIp = headers['x-real-ip'] || remoteAddress;
    info(`${remoteIp.padEnd(16)} ${method.padEnd(6)} ${originalUrl}`);
    next()
  })

api.get('/api/ticker', async function (req, res) {
    res.send(app.getTicker());
})

api.get('/api/epoch', async function (req, res) {
    res.send(app.getEpochs());
})

api.get('/api/epoch/:epochId?', async function (req, res) {
    let { epochId } = req.params;
    res.send(await app.getEpoch(epochId));
})

api.get('/api/lastblock', function (req, res) {
    res.send(app.getLastBLock());
})

api.get('/api/pool', function (req, res) {
    res.send(app.getPool());
})

api.get('/api/pool/pool', function (req, res) {
    res.send(app.getPoolStats());
})

api.get('/api/pool/delegators', function (req, res) {
    res.send(app.getPoolDelegators());
})

api.get('/api/pool/history', function (req, res) {
    res.send(app.getPoolHistory());
})

api.get('/api/pool/blocks', function (req, res) {
    res.send(app.getPoolBlocks());
})

api.listen(serverPort, () => {
    console.log(`Server listening on port ${serverPort}`);
});


process.on('SIGTERM', () => {
    app.stop();
});