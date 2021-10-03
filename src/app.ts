import { Blockfrost } from './libs/blockfrost'
import { log, info, warn, crit } from './libs/log'


export class App {

    private blockfrost;
    private poolHash;
    private runInterval;
    private dev: boolean;

    private poolStats: any;
    private epoch: Object[];

    private runCounter: number;
    private errorCounter: number;
    private isRunning: boolean;

    constructor(options: any) {

        // Check if input variables is set.
        let missingParameters = Object.keys(options).filter(x => options[x] === undefined );

        if(missingParameters.length > 0) {
            warn(`Undefined variables ${missingParameters.join(', ')})`);
            process.exit(0);
        }

        // Extract all input variables
        let { blockfrostApiKey, poolHash, runIntervalSeconds, dev } = options;

        this.poolHash = poolHash;
        this.runInterval = (!isNaN(parseFloat(runIntervalSeconds)) ? parseFloat(runIntervalSeconds) : 60) * 1000;
        this.dev = Boolean(dev && String(dev).toLowerCase() != 'false');
        this.poolStats = { 'pool': undefined, 'poolDelegators': undefined, 'poolBlocks': undefined };
        this.epoch = [];

        // Set all bot variables
        this.blockfrost = new Blockfrost({blockfrostApiKey});

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
        }

        try {
            let { pool, poolDelegators, poolBlocks } = await this.fetchPool(this.poolHash);
            this.poolStats = { pool, poolDelegators, poolBlocks, lastBlock: {} };
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

    private async fetchPool(poolHash) {
        let pool,
            poolDelegators,
            poolBlocks;

        try {
            pool = await this.blockfrost.getPool(poolHash);
            poolDelegators = await this.blockfrost.getPoolDelegators(poolHash);
            poolBlocks = await this.blockfrost.getPoolBlocks(poolHash);
        } catch(e) {
            throw e;
        }

        return { pool, poolDelegators, poolBlocks };
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
}

