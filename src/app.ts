import { Blockfrost } from './libs/blockfrost'
import { log, info, warn, crit } from './libs/log'


export class App {

    private blockfrost;
    private poolHash;
    private runInterval;
    private dev: boolean;

    private poolStats: any;
    private epoch: Object;

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
        this.runInterval = (!isNaN(parseFloat(runIntervalSeconds)) ? parseFloat(runIntervalSeconds) : 30) * 1000;
        this.dev = Boolean(dev && String(dev).toLowerCase() != 'false');
        this.poolStats = { 'pool': undefined, 'poolDelegators': undefined, 'poolBlocks': undefined };
        this.epoch = {};

        // Set all bot variables
        this.blockfrost = new Blockfrost({blockfrostApiKey});

        this.errorCounter = 0;
        this.runCounter = 0;
        this.isRunning = false;

        log(`Starting bot...
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
        try {
            let { epoch, pool, poolDelegators, poolBlocks } = await this.fetchStats(this.poolHash);
            this.poolStats = { pool, poolDelegators, poolBlocks };
            this.epoch = epoch;
            log({ epoch, pool, poolDelegators, poolBlocks });
        } catch(e) {
            let { error } = e;
            crit(`Failed to fetch pool stats. ${error}`);
            return false;
        }
        return true;
    }


    private async fetchStats(poolHash) {
        let epoch,
            pool,
            poolDelegators,
            poolBlocks;

        try {
            epoch = await this.blockfrost.getEpoch(poolHash);
            pool = await this.blockfrost.getPool(poolHash);
            poolDelegators = await this.blockfrost.getPoolDelegators(poolHash);
            poolBlocks = await this.blockfrost.getPoolBlocks(poolHash);
        } catch(e) {
            throw e;
        }

        return { epoch, pool, poolDelegators, poolBlocks };
    }

    public getPool() {
        let { pool } = this.poolStats;
        return pool;
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

    public getEpoch(tbd) {
        let epoch = this.epoch;
        return epoch;
    }

}

