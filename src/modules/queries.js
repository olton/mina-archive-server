import {query} from  "./postgres"
import {CHAIN_STATUS_PENDING, CHAIN_STATUS_CANONICAL, CHAIN_STATUS_ORPHANED, CHAIN_STATUS_ALL} from "./consts"

const qLatestBlocks = async () => {
    const sql = `
        select distinct * 
        from v_blocks b 
        where b.chain_status = '${CHAIN_STATUS_PENDING}' 
        and height > (
            select height 
            from v_blocks 
            where chain_status = '${CHAIN_STATUS_CANONICAL}' 
            order by height desc 
            limit 1
        )`

    return (await query(sql)).rows
}

const qBlocks = async ({
    type = CHAIN_STATUS_CANONICAL,
    limit = 50,
    offset = 0
} = {}) => {
    const sql = `
        select * 
        from v_blocks b 
        where chain_status = $1
        limit $2 offset $3        
    `

    return (await query(sql, [type, limit, offset])).rows
}

const qAddressBlocks = async (pk, {
    type = CHAIN_STATUS_ALL,
    limit = 50,
    offset = 0,
} = {}) => {
    if (!pk) {
        throw new Error('You must specified address for this query [qAddressBlocks]')
    }

    const sql = `
        select * 
        from v_blocks b
        where b.creator_key = $1
        and ${type === CHAIN_STATUS_ALL ? '1=1' : 'chain_status = $2'}
        limit $3 offset $4
    `

    return (await query(sql, [pk, type, limit, offset])).rows
}

const qTotalBlocks = async () => {
    const sql = `
        select max(height) as height
        from blocks
    `

    return (await query(sql)).rows[0].height
}

const qGetEpoch = async () => {
    const sql = `
        select * from v_epoch
    `
    return (await query(sql)).rows[0]
}

const qGetStat = async () => {
    const sql = `
        select * from v_stat
    `
    return (await query(sql)).rows[0]
}

export {
    qLatestBlocks,
    qBlocks,
    qAddressBlocks,
    qTotalBlocks,
    qGetEpoch,
    qGetStat
}