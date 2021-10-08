import * as request from "request-promise";

export class Binance {

    private _urlApi: any;

	constructor(access_key: String = "") {
        this._urlApi = "https://api1.binance.com"
	}

    callApi(opts, loopback = {}) {
        return new Promise((resolve, reject) => {

            if(!opts.path)
                reject('Missing path')            
           
            
            let options = {
                method: opts.method || 'GET',
                uri: `${this._urlApi}${opts.path}`,
                headers: {
                    'Content-Type': 'application/json'
                }
            }

            request(options) 
                .then((res) => {
                    Object.assign(res, loopback);
                    resolve(JSON.parse(res))
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }


    getTicker24hr(params = { symbol: 'ADAUSDT' }) {
        let { symbol } = params;
        let opts = { 
            method: 'GET',
            path: `/api/v3/ticker/24hr?symbol=${symbol}`
        }
        return this.callApi(opts)
    }
    
}