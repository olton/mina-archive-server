import {query} from  "./postgres"
import {CHAIN_STATUS_PENDING, CHAIN_STATUS_CANONICAL, CHAIN_STATUS_ORPHANED, CHAIN_STATUS_ALL} from "./consts"
import {TextDecoder} from 'util'
import {decode} from "@faustbrian/node-base58"
import {checkMemoForScam} from "../helpers/scam.js";
import {decodeMemo} from "../helpers/memo.js";

export const qDisputeBlocks = async () => {
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

export const qBlocks = async ({
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

export const qAddressBlocks = async (pk, {
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

export const qAddressTransactions = async (pk, {
    limit = 50,
    offset = 0,
} = {}) => {
    if (!pk) {
        throw new Error('You must specified address for this query [qAddressBlocks]')
    }

    const sql = `
        select * from v_trans 
        where (trans_owner = $1 or trans_receiver = $1)
        order by timestamp desc, nonce desc
        limit $2 offset $3
    `

    const result = (await query(sql, [pk, limit, offset])).rows

    result.map((r) => {
        r.memo = decodeMemo(r.memo)
        r.scam = checkMemoForScam(r.memo)
    })

    return result
}

export const qTotalBlocks = async () => {
    const sql = `
        select max(height) as height
        from blocks
    `
    return (await query(sql)).rows[0].height
}

export const qGetEpoch = async () => {
    const sql = `
        select * from v_epoch
    `
    return (await query(sql)).rows[0]
}

export const qGetStat = async () => {
    const sql = `
        select * from v_stat
    `
    return (await query(sql)).rows[0]
}

export const qAddressInfo = async (address) => {
    // console.log("Address request: ", address)
    const sql = `
        select 
               a.*, 
               s.stake, 
               s.stake_next,
               (case when b.public_key is null then 0 else 1 end ) as scammer,
               b.reason as scammer_reason
        from v_address a
        left join v_stakes s on s.id = a.public_key_id
        left join blacklist b on b.public_key = a.public_key
        where a.public_key = $1
    `
    return (await query(sql, [address])).rows[0]
}

export const qLastBlockTime = async () => {
    const sql = `
        select * 
        from v_last_block_time
    `
    return (await query(sql)).rows[0].timestamp
}

export const qBlockInfo = async (hash) => {
    const sql = `
        select b.*
        from v_blocks b 
        where b.state_hash = $1
    `
    return (await query(sql, [hash])).rows[0]
}

export const getBlockTransactions = async (hash) => {
    if (!hash) {
        throw new Error('You must specified block state hash for this query [qBlockTransactions]')
    }

    const sql = `
        select 
            t.status, 
            t.type,
            t.hash,
            t.timestamp,
            t.nonce,
            t.trans_owner,
            t.trans_receiver,
            t.amount,
            t.fee,
            t.confirmation,
            t.memo,
            t.scam
        from v_trans_all t 
        where state_hash = $1
        order by timestamp desc, nonce desc
    `

    const result = (await query(sql, [hash])).rows

    result.map((r) => {
        r.memo = decodeMemo(r.memo)
        r.scam = checkMemoForScam(r.memo)
    })

    return result
}

export const getLeaderboard = async ({
    limit = 120,
    offset = 0,
} = {}) => {
    let res, segmentId, segmentTimestamp

    res = await query(`select timestamp
                           from uptime_segments
                           where timestamp = (select max(timestamp) from uptime_segments)`)

    segmentTimestamp = res.rows[0].timestamp

    res = await query(`
        select * 
        from v_uptime
        limit $1 offset $2
    `, [limit, offset])

    return {segment: segmentTimestamp, rows: res.rows, next: await getUptimeNext()}
}

export const getUptimeNext = async () => {
    const sql = `select timestamp from uptime_snapshot order by timestamp desc limit 1`
    return (await query(sql)).rows[0].timestamp
}

export const getAddressUptime = async (address) => {
    const sql = `
        select * 
        from v_uptime
        where public_key = $1
        limit 1
    `
    return (await query(sql, [address])).rows[0]
}

export const getTransaction = async (hash) => {
    const sql = `
        select *
        from v_trans t
        where t.hash = $1
        limit 1
    `
    let result = (await query(sql, [hash])).rows[0]

    result.memo = decodeMemo(result.memo)
    result.scam = checkMemoForScam(result.memo)

    return result
}

export const getScammerList = async () => {
    const sql = `
        select * from blacklist b 
    `
    const rows = (await query(sql)).rows
    const result = []

    for(let r of rows) {
        result.push([
            r.public_key,
            r.reason
        ])
    }

    return result
}

export const getTopStackHolders = async (limit = 20) => {
    const sql = `
        select *
        from v_stakes
        order by stake desc
        limit $1
    `
    const rows = (await query(sql, [limit])).rows
    const result = []

    for(let r of rows) {
        result.push([r.value, r.stake, r.stake_next])
    }

    return result
}

export const getLastBlockWinners = async (limit = 20) => {
    const sql = `
        select b.creator_key, b.height, b.coinbase
        from v_blocks b
        where b.chain_status = 'canonical'
        order by b.height desc
        limit $1
    `
    const rows = (await query(sql, [limit])).rows
    const result = []

    for(let r of rows) {
        result.push([r.creator_key, r.height, r.coinbase])
    }

    return result
}

export const getAddressBlocks = async (address) => {
    const sql = `
        select 
               b.chain_status, 
               b.height, 
               b.timestamp, 
               b.state_hash, 
               b.coinbase, 
               b.slot, 
               b.global_slot, 
               b.epoch, 
               b.trans_count 
        from v_blocks b
        where b.creator_key = $1
        order by height desc
    `

    const rows = (await query(sql, [address])).rows
    const result = []

    for(let r of rows) {
        result.push([
            r.chain_status,
            r.height,
            r.timestamp,
            r.state_hash,
            r.coinbase,
            r.global_slot+":"+r.slot,
            r.epoch,
            r.trans_count
        ])
    }

    return result
}

export const getAddressTrans = async (address) => {
    const sql = `
        select 
            t.type,
            (case when t.trans_owner = $1 then 'out' else 'in' end) as dir,
            t.status,
            t.timestamp,
            t.hash,
            t.height,
            t.nonce,
            (case when t.trans_owner = $1 then t.trans_receiver else t.trans_owner end) as agent,
            t.amount,
            t.fee,
            t.confirmation,
            t.state_hash,
            t.memo,
            t.epoch,
            t.global_slot,
            t.slot
        from v_trans t
        where (t.trans_owner = $1 or t.trans_receiver = $1)
        order by timestamp desc, nonce desc

    `
    const rows = (await query(sql, [address])).rows
    const result = []

    for(let r of rows) {
        r.memo = decodeMemo(r.memo)
        r.scam = checkMemoForScam(r.memo)

        result.push([
            r.type,
            r.dir,
            r.status,
            r.timestamp,
            r.hash,
            r.agent,
            r.height,
            r.nonce,
            r.amount,
            r.fee,
            r.confirmation,
            r.state_hash,
            r.memo,
            r.epoch,
            r.global_slot,
            r.slot,
            r.scam
        ])
    }

    return result
}

export const getBlocksByHeight = async height => {
    const sql = `
        select * from v_blocks
        where height = $1
    `

    return (await query(sql, [height])).rows
}

export const getAddressByName = async name => {
    const sql = `
        select a.*, s.stake, s.stake_next
        from v_address a
        left join v_stakes s on s.id = a.public_key_id
        where lower(name) like $1
    `

    return (await query(sql, ["%"+name.toLowerCase()+"%"])).rows
}

export const getAddressDelegations = async (address, next = false) => {
    const sql = `
        select
            (case when a.public_key = $1 then 1 else 0 end) as stake_holder,
            a.public_key,
            a.name,
            %balance_field% as ledger_balance
        from v_address a
        where %delegate_field% = $1
    `
        .replace("%balance_field%", !next ? "ledger_balance" : "ledger_balance_next")
        .replace("%delegate_field%", !next ? "delegate_key" : "delegate_key_next")

    return (await query(sql, [address])).rows
}
