import {query} from "./postgres.js";

export const getBalancePerEpoch = async (address, len = 10) => {
    const sql = `
        select balance
        from ledger l
        left join public_keys pk on l.public_key_id = pk.id
        where pk.value = $1
        order by l.epoch desc
        limit $2
    `

    return (await query(sql, [address, len])).rows
}
