import {query} from  "./postgres"
import {CHAIN_STATUS_PENDING, CHAIN_STATUS_CANONICAL, CHAIN_STATUS_ORPHANED, CHAIN_STATUS_ALL} from "./consts"
import {TextDecoder} from 'util'
import {decode} from "@faustbrian/node-base58"

const qDisputeBlocks = async () => {
    const sql = `
        select distinct * 
        from v_blocks b 
        where b.chain_status = '${CHAIN_STATUS_PENDING}' 
        and height > (
            select max(height) 
            from v_blocks 
            where chain_status = '${CHAIN_STATUS_CANONICAL}' 
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
        where chain_status = ANY($1::chain_status_type[])
        limit $2 offset $3        
    `

    return (await query(sql, [Array.isArray(type) ? type : [type], limit, offset])).rows
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
        and chain_status = ANY($2::chain_status_type[])
        limit $3 offset $4
    `

    return (await query(sql, [pk, Array.isArray(type) ? type : [type], limit, offset])).rows
}

const qAddressTransactions = async (pk, {
    limit = 50,
    offset = 0,
} = {}) => {
    if (!pk) {
        throw new Error('You must specified address for this query [qAddressBlocks]')
    }

    const sql = `
        select * from v_trans 
        where chain_status = 'canonical'
        and (trans_owner = $1 or trans_receiver = $1)
        order by timestamp desc, nonce desc
        limit $2 offset $3
    `

    const result = (await query(sql, [pk, limit, offset])).rows

    result.map((r) => {
        r.memo = (new TextDecoder().decode(decode(r.memo).slice(3, -4)))
    })

    return result
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

const qAddressInfo = async (address) => {
    const sql = `
        select * 
        from v_address
        where public_key = $1
    `

    return (await query(sql, [address])).rows[0]
}

const qLastBlockTime = async () => {
    const sql = `
        select * 
        from v_last_block_time
    `

    return (await query(sql)).rows[0].timestamp
}

export {
    qDisputeBlocks,
    qBlocks,
    qAddressBlocks,
    qTotalBlocks,
    qGetEpoch,
    qGetStat,
    qAddressInfo,
    qLastBlockTime,
    qAddressTransactions
}