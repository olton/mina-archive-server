import {query} from "./postgres.js";

export const getBalancePerEpoch = async (address, len = 10) => {
    const sql = `
        select epoch, balance
        from ledger l
        left join public_keys pk on l.public_key_id = pk.id
        where pk.value = $1
        order by l.epoch desc
        limit $2
    `

    return (await query(sql, [address, len])).rows
}

export const getStakePerEpoch = async (address, len = 10) => {
    const sql = `
        select epoch, sum(balance)
        from ledger l
        left join public_keys pk on pk.id = l.delegate_key_id
        where pk.value = $1
        group by epoch
        order by epoch desc
        limit $2
    `

    return (await query(sql, [address, len])).rows
}
