import * as color from 'colors'

const parseLog = (log: any = '') => {
    let r: String = '';
    try {
        r = log
        /* Do parsing here*/
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