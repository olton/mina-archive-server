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

export const getAddressUptimeLine = async (address, limit = 60, trunc = 'day') => {
    const sql = `
        with address_uptime as (
            select pk.value,
                   u.position,
                   date_trunc($3, us.timestamp) as time
            from uptime u
                     left join public_keys pk on u.public_key_id = pk.id
                     left join uptime_segments us on u.segment_id = us.id
            where pk.value = $1
            order by timestamp desc
        )
        select time, round(avg(position)) as position
        from address_uptime
        group by time
        order by time desc
        limit $2
    `

    return (await query(sql, [address, limit, trunc])).rows
}

export const getTransactionsFeesLine = async (limit = 30, trunc = 'day') => {
    const sql = `
        select
           date_trunc($2, TO_TIMESTAMP(timestamp / 1000)) as time,
           round(avg(fee)) as avg_fee,
           round(max(fee)) as max_fee,
           round(min(fee)) as min_fee
        from v_trans t
        group by 1
        order by 1 desc
        limit $1
    `

    return (await query(sql, [limit, trunc])).rows
}