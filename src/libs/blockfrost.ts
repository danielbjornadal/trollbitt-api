import * as request from "request-promise";
import { log } from "./log";

export class Blockfrost {

    private blockfrostApi: string;
    private blockfrostApiKey: string;

    constructor(auth) {
        let { blockfrostApiKey } = auth;
        this.blockfrostApiKey = blockfrostApiKey;
        this.blockfrostApi = "https://cardano-mainnet.blockfrost.io/api/v0";
    }

    private async callApi(opts) {
        
        if(!opts.path)
            throw 'Missing path';
        
        if(!opts.method)
            opts.method = 'GET';


        opts.uri = `${this.blockfrostApi}${opts.path}`;
        opts.headers = {
            'Content-Type': 'application/json',
            'project_id': this.blockfrostApiKey
        }

        opts.json = true;
        opts.qs = undefined;
        opts.body = undefined;

        if(opts.method === 'GET')
            opts.qs = opts.params || {}

        if(opts.method === 'POST' || opts.method === 'PUT' || opts.method === 'PATCH')
            opts.body = opts.params || {}
        
        try {
            
            return await request(opts);
        } catch(e) {
            let { response: { statusCode: _statusCode, statusMessage: _error } = { statusCode: undefined, statusMessage: undefined } } = e;
            let { statusCode = _statusCode, error: { success, error } = { success: false, error: _error }, options: { method, uri } = { method: undefined, uri: undefined } } = e;            
            throw { statusCode, success, error, method, uri };
        }       
    }

    public async getEpoch(epoch) {
        epoch = (!epoch || isNaN(epoch) ? 'latest' : epoch)
        let opts = { 
            method: 'GET',
            path: `/epochs/${epoch}`,
            params: { }
        }
        return await this.callApi(opts)
    }

    public async getPool(poolId) {
        let opts = { 
            method: 'GET',
            path: `/pools/${poolId}`,
            params: { }
        }
        return await this.callApi(opts)
    }

    public async getPoolHistory(poolId) {
        let opts = { 
            method: 'GET',
            path: `/pools/${poolId}/history`,
            params: { }
        }
        return await this.callApi(opts)
    }

    public async getPoolMetadata(poolId) {
        let opts = { 
            method: 'GET',
            path: `/pools/${poolId}/metadata`,
            params: { }
        }
        return await this.callApi(opts)
    }

    public async getPoolRelays(poolId) {
        let opts = { 
            method: 'GET',
            path: `/pools/${poolId}/relays`,
            params: { }
        }
        return await this.callApi(opts)
    }

    public async getPoolDelegators(poolId) {
        let opts = { 
            method: 'GET',
            path: `/pools/${poolId}/delegators`,
            params: { }
        }
        return await this.callApi(opts)
    }

    public async getPoolBlocks(poolId) {
        let opts = { 
            method: 'GET',
            path: `/pools/${poolId}/blocks`,
            params: { }
        }
        return await this.callApi(opts)
    }

    public async getPoolUpdates(poolId) {
        let opts = { 
            method: 'GET',
            path: `/pools/${poolId}/updates`,
            params: { }
        }
        return await this.callApi(opts)
    }

    public async getTxPoolUpdates(hash) {
        let opts = { 
            method: 'GET',
            path: `/txs/${hash}/pool_updates`,
            params: { }
        }
        return await this.callApi(opts)
    }

}