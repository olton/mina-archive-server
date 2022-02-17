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

export const getBlocksPerEpoch = async (address, len = 10) => {
    const sql = `
        select epoch, count(id) as sum
        from v_blocks
        where creator_key = $1
          and chain_status = 'canonical'
        group by epoch
        order by epoch desc
        limit $2
    `

    return (await query(sql, [address, len])).rows
}

export const getBlocksTimelapse = async limit => {
    const sql = `
        select 
            height,
            timelapse
        from v_blocks_timelapse
        limit $1
    `

    return (await query(sql, [limit])).rows
}