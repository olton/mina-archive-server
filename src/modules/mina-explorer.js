import {log} from "../helpers/logging.js";

const EXPLORER_GRAPHQL = `https://graphql.minaexplorer.com`
const EXPLORER_API = `https://api.minaexplorer.com`

const fetchAPI = async (path = '') => {
    try {
        let response = await fetch(`${EXPLORER_API}/${path}`)
        return response.ok ? await response.json() : null
    } catch (e) {
        log("The Request to Mina Explorer API was aborted!", "error", e.message)
        return null
    }
}

const fetchGraphQL = async (query, variables = {}) => {
    try {
        const result = await fetch(
            EXPLORER_GRAPHQL,
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            }
        )

        return result.ok ? await result.json() : null
    } catch (e) {
        log("The Request to Mina Explorer GraphQL was aborted!", "error", e.message)
        return null
    }
}

export const getAddressBalanceExp = async (address) => {
    const res = await fetchAPI(`accounts/${address}`)
    const result = {
        total: 0,
        blockHeight: 0,
        liquid: 0,
        locked: 0,
        stateHash: "",
        unknown: 0,
        error: false
    }
    if (res === null) {
        result.error = "Failed request to Mina Explorer API"
        return result
    }
    result.total = +(res.account.balance.total)
    result.locked =  +(res.account.balance.lockedBalance) * 10**9
    result.unknown = result.total
    result.liquid = result.total - result.locked
    result.blockHeight = res.account.balance.blockHeight
}