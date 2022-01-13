import fetch from "node-fetch"
import {parseTime} from "../helpers/parsers"
import {query} from "./postgres.js";

const getPriceInfo = async (currency = 'usd') => {
    try {
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=%CURRENCY%&ids=mina-protocol`.replace("%CURRENCY%", currency.toLowerCase())
        const data = await fetch(url)

        return !data.ok ? null : await data.json()
    } catch (e) {
        log(`Error retrieving price from provider`, 'error', e.message)
        return null
    }
}

const processPriceInfo = async () => {
    const {currency, updateInterval, saveToDB = true} = config.price
    const _updateInterval = parseTime(updateInterval)

    let data = await getPriceInfo(currency)

    if (Array.isArray(data)) {
        data[0].currency = currency
        globalThis.broadcast.price = data[0]
        globalThis.cache.price = data[0]

        if (saveToDB) query(`
            insert into price (currency, value, timestamp, provider) 
            values ($1, $2, $3, $4)
        `, [currency, data[0].current_price, data[0].last_updated, 'coingecko.com'])
    }

    setTimeout(processPriceInfo, _updateInterval)
}

export {
    processPriceInfo
}