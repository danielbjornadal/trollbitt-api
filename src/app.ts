import { Blockfrost } from './libs/blockfrost'
import { Binance } from './libs/binance'

import * as Sequelize from "sequelize"
import * as leaderlogsModel from './models/leaderlogsModel';
import { log, info, warn, crit } from './libs/log'


export class App {

    private blockfrost;
    private binance;
    private poolHash;
    private runInterval;
    private apikey; 
    private dev: boolean;

    private poolStats: any;
    private epoch: Object[];
    private ticker: Object;
    private network: Object;

    private runCounter: number;
    private errorCounter: number;
    private isRunning: boolean;
    private lastRun: number;

    constructor(options: any) {

        // Check if input variables is set.
        let missingParameters = Object.keys(options).filter(x => options[x] === undefined );

        if(missingParameters.length > 0) {
            warn(`Undefined variables ${missingParameters.join(', ')})`);
            process.exit(0);
        }

        // Extract all input variables
        let { blockfrostApiKey, poolHash, runIntervalSeconds, apikey, dev } = options;

        this.poolHash = poolHash;
        this.runInterval = (!isNaN(parseFloat(runIntervalSeconds)) ? parseFloat(runIntervalSeconds) : 60) * 1000;
        this.dev = Boolean(dev && String(dev).toLowerCase() != 'false');
        this.apikey = apikey;
        this.poolStats = { 'pool': undefined, 'poolDelegators': undefined, 'poolBlocks': undefined };
        this.epoch = [];
        this.network = {};

        // Set all bot variables
        this.blockfrost = new Blockfrost({blockfrostApiKey});
        this.binance = new Binance();

        this.errorCounter = 0;
        this.runCounter = 0;
        this.isRunning = false;

        log(`Starting app...
Run Interval    : ${this.runInterval / 1000} seconds
Dev mode        : ${this.dev}
`); 

    }

    public async run() {
        let self = this;
        let timeout = this.runInterval;
        this.runCounter++;
        this.isRunning = true;
        this.lastRun = Date.now();
        let result: boolean = true;

        if(this.errorCounter > 10) {
            process.exit(1);
        }

        result = await this.controller();

        this.isRunning = false;

        if(result) {
            this.errorCounter = 0;
        } else {
            this.errorCounter++;
        }

        if(!this.dev) {
            setTimeout(function () { self.run() }, timeout);
        }
    }

    public async stop() {
        let self = this;
        info('SIGTERM received. Shutting down.');
        if(this.isRunning === false) {
            info('Shutting down now!');
            process.exit(0);
        } else {
            setTimeout(function () { self.stop() }, 100);
        }
    }

    private async controller() {

        // Display Run Counter every 10th run.
        if(this.runCounter == 1 || this.runCounter % 10 === 0){
            info(`Run Counter: ${this.runCounter.toString().padStart(5)}`);

            try {
                let network = await this.fetchNetwork();
                this.network = network;
            } catch(e) { 
                let { error } = e;
                crit(`Failed to fetch network. ${error}`);
                return false;
            }
        }

        try {
            let { ticker } = await this.fetchTicker();
            this.ticker = ticker;
        } catch(e) { 
            let { error } = e;
            crit(`Failed to fetch ticker. ${error}`);
            return false;
        }

        try {
            let { pool, poolDelegators, poolHistory, poolBlocks } = await this.fetchPool(this.poolHash);
            this.poolStats = { pool, poolDelegators, poolHistory, poolBlocks, lastBlock: {} };
        } catch(e) { 
            let { error } = e;
            crit(`Failed to fetch pool. ${error}`);
            return false;
        }

        try {
            let epoch = await this.fetchEpoch('latest');
            this.updateEpochs(epoch);

            let latestEpoch:any = this.epoch.at(-1);
            let latestEpochs = this.epoch.filter((x:any) => x.epoch > latestEpoch.epoch - 3 )
            if(latestEpochs.length < 3) {
                for(let i = 1; i < 3; i++)
                {
                    this.updateEpochs(await this.fetchEpoch(latestEpoch.epoch - i));
                }
            }
        } catch(e) { 
            let { error } = e;
            crit(`Failed to fetch epoch. ${error}`);
            return false;
        }      
        
        if(this.poolStats.poolBlocks.length > 0) {
            let lastBlock = this.poolStats.poolBlocks.at(-1);

            try {
                let block = await this.fetchBlock(lastBlock);
                this.poolStats.lastBlock = block;
            } catch(e) { 
                let { error } = e;
                crit(`Failed to fetch block. ${error}`);
                return false;
            } 
    
        }

        try {
            let blocks_blockfrost = this.poolStats.poolBlocks;
            let blocks_trollbitt = await leaderlogsModel.Leaderlogs.findAll({
                attributes: [ 'hash' ],
                raw: true
            });
            blocks_trollbitt = blocks_trollbitt.map(r => r.hash);
            blocks_blockfrost = blocks_blockfrost.filter(val => !blocks_trollbitt.includes(val));

            blocks_blockfrost.forEach(async (hash) => {
                let block = await this.fetchBlock(hash); 
                block.time = block.time * 1000
                await leaderlogsModel.Leaderlogs.upsert(block);
                log(`LeaderLogs - Block ${block.hash} for slot ${block.slot} added OK`);
            });
        } catch(e) {
            log(e)
            return false
        }

        return true;
    }

    private updateEpochs(epoch) {
        let index = this.epoch.findIndex((x:any) => x.epoch === epoch.epoch);

        if(index === -1) {
            this.epoch.push(epoch);
        } else {
            this.epoch[index] = epoch;
        }

        this.epoch.sort((a:any, b:any) => {
            return a.epoch - b.epoch
        }); 
    }

    private async fetchTicker() {
        let ticker;

        try {
            ticker = await this.binance.getTicker24hr({ symbol: "ADAUSDT" });
        } catch(e) {
            throw e;
        }

        return { ticker };
    }    

    private async fetchPool(poolHash) {
        let pool,
            poolDelegators,
            poolHistory,
            poolBlocks;

        try {
            pool = await this.blockfrost.getPool(poolHash);
            poolDelegators = await this.blockfrost.getPoolDelegators(poolHash);
            poolHistory = await this.blockfrost.getPoolHistory(poolHash);
            poolBlocks = await this.blockfrost.getPoolBlocks(poolHash);
        } catch(e) {
            throw e;
        }

        return { pool, poolDelegators, poolHistory, poolBlocks };
    }

    private async fetchNetwork() {
        let network;

        try {
            network = await this.blockfrost.getNetwork();
        } catch(e) {
            throw e;
        }

        return network;
    } 

    private async fetchEpoch(epochId) {
        let epoch;

        try {
            epoch = await this.blockfrost.getEpoch(epochId);
        } catch(e) {
            throw e;
        }

        return epoch;
    }    

    private async fetchBlock(hash) {
        let block;

        try {
            block = await this.blockfrost.getBlock(hash);
        } catch(e) {
            throw e;
        }

        return block;
    }  

    public getTicker() {
        return this.ticker;
    }

    public getNetwork() {
        return this.network;
    }

    public getPool() {
        let { pool } = this.poolStats;
        return pool;
    }

    public getLastBLock() {
        let { lastBlock } = this.poolStats;
        return lastBlock;
    }

    public getPoolDelegators() {
        let { poolDelegators } = this.poolStats;
        return poolDelegators;
    }

    public getPoolHistory() {
        let { poolHistory } = this.poolStats;
        return poolHistory;
    }

    public getPoolBlocks() {
        let { poolBlocks } = this.poolStats;
        return poolBlocks;
    }

    public getPoolStats() {
        let { pool, poolDelegators, poolBlocks } = this.poolStats;
        return { pool, poolDelegators, poolBlocks };
    }

    public getEpochs() {
        return this.epoch.slice(-3).reverse();
    }

    public async getEpoch(epochId) {
        if (epochId === 'latest') epochId = this.epoch.at(-1);

        let index = this.epoch.findIndex((x:any) => x.epoch == epochId);
        let epoch;

        if(index === -1) {
            try {
                epoch = await this.fetchEpoch(epochId);
                this.updateEpochs(epoch);
            } catch(e) {
                return {}
            }
        } else {
            epoch = this.epoch[index];
        } 

        return epoch;
    }

    public async getPoolLeaderlogs() {
        let leaderlogsFuture,
            leaderlogsPast;
        try {
            leaderlogsFuture = await leaderlogsModel.Leaderlogs.findAll({
                attributes: [ [Sequelize.fn('date_format', Sequelize.col('time'), '%Y-%m-%d'), 'time'], 'epoch', 'epoch_slot_ideal'],
                
                where: {
                    time: {
                        [Sequelize.Op.gte]: Date.now()
                    }
                },
                order: [['time', 'desc']],
                raw: true
            });
            leaderlogsPast = await leaderlogsModel.Leaderlogs.findAll({
                attributes: [ 'slot', 'epoch_slot', 'time', 'epoch', 'epoch_slot_ideal'],
                where: {
                    time: {
                        [Sequelize.Op.lte]: Date.now()
                    }
                },
                order: [['time', 'desc']],
                raw: true
            });
        } catch(e) {
            log(e)
            return {}
        }

        return leaderlogsFuture.concat(leaderlogsPast);
    }

    public async postPoolLeaderlogs(req) {
        let { body, headers } = req;
        let { apikey } = headers;

        if(apikey != this.apikey) {
            return { error: "Not authorized"}
        }

        try {
            const leaderlogs = await leaderlogsModel.Leaderlogs.bulkCreate(body);
            const { time } = leaderlogs;
            log(`LeaderLogs - ${leaderlogs.length} blocks added`);
            return leaderlogs;
        } 
        catch (e) {
            return {}
        } 
    }

    public getHealth() {
        let diff = Date.now() - this.lastRun;
        if (diff >= this.runInterval * 2) {
            return 500;
        }
        return 200;
    }
}

