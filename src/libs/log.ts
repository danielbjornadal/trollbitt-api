import * as color from 'colors'

const parseLog = (log: any = '') => {
    let r: String = '';
    try {
        r = log
        .replaceAll(/(?<![-\dm\.])([+\dm\.%$]+)/g, '$1'.green)                   // Positive numbers
        .replaceAll(/(-[\d\.%$]+)/g, '$1'.yellow)                                // Negative numbers
        .replaceAll(/(\s*long\s*|\s*buy[\s]*)([-]*)/gi, '$1'.green + '$2')      // long/buy
        .replaceAll(/(\s*short\s*|\s*sell[\s]*)([-]*)/gi, '$1'.yellow + '$2')    // short/sell
    } catch(e) {
        r = log;
    }
    return r;
}

export { color };

export const info = (log: any = '') => {
    console.info('INFO '.padEnd(8).cyan + parseLog(log));
}

export const warn = (log: any = '') => {
    console.warn('WARN '.padEnd(8).yellow + parseLog(log));
}

export const crit = (log: any = '') => {
    // @ts-ignore
    console.error('ERROR '.padEnd(8).brightRed + parseLog(log));
}

export const log = console.log;