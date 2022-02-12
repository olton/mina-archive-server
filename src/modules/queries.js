import {query} from  "./postgres"
import {CHAIN_STATUS_PENDING, CHAIN_STATUS_CANONICAL, CHAIN_STATUS_ORPHANED, CHAIN_STATUS_ALL} from "./consts"
import {checkMemoForScam} from "../helpers/scam.js";
import {decodeMemo} from "../helpers/memo.js";
import {getTransactionInPool} from "./graphql.js";

export const getDisputeBlocks = async () => {
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

export const getBlocks = async ({
    type = CHAIN_STATUS_CANONICAL,
    limit = 50,
    offset = 0,
    search = null
} = {}) => {
    let sql = `
        select * 
        from v_blocks b 
        where chain_status = ANY($1::chain_status_type[])
        %BLOCK_SEARCH%
        %HASH_SEARCH%
        %COINBASE_SEARCH%
        limit $2 offset $3        
    `

    sql = sql.replace("%BLOCK_SEARCH%", search && search.block ? `and height = ${search.block}` : "")
    sql = sql.replace("%HASH_SEARCH%", search && search.hash ? `and (creator_key = '${search.hash}' or lower(creator_name) like '%${search.hash.toLowerCase()}%' or state_hash = '${search.hash}')` : "")
    sql = sql.replace("%COINBASE_SEARCH%", search && !isNaN(search.coinbase) ? `and coinbase = ${search.coinbase}` : "")

    return (await query(sql, [Array.isArray(type) ? type : [type], limit, offset])).rows
}

export const getBlocksCount = async ({
    type = CHAIN_STATUS_CANONICAL,
    search = null
} = {}) => {
    let sql = `
        select count(*) as length 
        from v_blocks b 
        where chain_status = ANY($1::chain_status_type[])
        %BLOCK_SEARCH%
        %HASH_SEARCH%
        %COINBASE_SEARCH%
    `

    sql = sql.replace("%BLOCK_SEARCH%", search && search.block ? `and height = ${search.block}` : "")
    sql = sql.replace("%HASH_SEARCH%", search && search.hash ? `and (creator_key = '${search.hash}' or lower(creator_name) like '%${search.hash.toLowerCase()}%' or state_hash = '${search.hash}')` : "")
    sql = sql.replace("%COINBASE_SEARCH%", search && !isNaN(search.coinbase) ? `and coinbase = ${search.coinbase}` : "")

    return (await query(sql, [Array.isArray(type) ? type : [type]])).rows[0].length
}

export const getAddressTransactions = async (pk, {
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

export const getTotalBlocks = async () => {
    const sql = `
        select 
               count(id) as total, 
               (select count(id) from blocks where chain_status = 'pending') as pending,
               (select count(id) from blocks where chain_status = 'orphaned') as orphaned,
               (select max(height) - 1 from blocks) as canonical
        from blocks
    `
    return (await query(sql)).rows[0]
}

export const getEpoch = async () => {
    const sql = `
        select * from v_epoch
    `
    return (await query(sql)).rows[0]
}

export const getStat = async () => {
    const sql = `
        select * from v_stat
    `
    return (await query(sql)).rows[0]
}

export const getAddressInfo = async (address) => {
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

export const getLastBlockTime = async () => {
    const sql = `
        select * 
        from v_last_block_time
    `
    return (await query(sql)).rows[0].timestamp
}

export const getBlockInfo = async (hash) => {
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
        from v_trans_all t
        where t.hash = $1
        limit 1
    `
    let result = (await query(sql, [hash])).rows[0]

    result.memo = decodeMemo(result.memo || "")
    result.scam = checkMemoForScam(result.memo)

    return result
}

export const getScammerList = async () => {
    const sql = `
        select b.*, a.name 
        from blacklist b
        left join public_keys pk on pk.value = b.public_key
        left join address a on a.public_key_id = pk.id
        
    `
    const rows = (await query(sql)).rows
    const result = []

    for(let r of rows) {
        result.push([
            r.public_key,
            r.name,
            r.reason
        ])
    }

    return result
}

export const getTopStakeHolders = async (limit = 20) => {
    const sql = `
        select *
        from v_stakes s
        left join address a on a.public_key_id = s.id
        order by stake desc
        limit $1
    `
    const rows = (await query(sql, [limit])).rows
    const result = []

    for(let r of rows) {
        result.push([r.value, r.name, r.stake, r.stake_next])
    }

    return result
}

export const getLastBlockWinners = async (limit = 20) => {
    const sql = `
        select b.creator_key, b.creator_name, b.height, b.coinbase
        from v_blocks b
        where b.chain_status = 'canonical'
        order by b.height desc
        limit $1
    `
    const rows = (await query(sql, [limit])).rows
    const result = []

    for(let r of rows) {
        result.push([r.creator_key, r.creator_name, r.height, r.coinbase])
    }

    return result
}

export const getAddressBlocks = async (address, {
    type = CHAIN_STATUS_CANONICAL,
    limit = 50,
    offset = 0
} = {}) => {
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
        and chain_status = ANY($2::chain_status_type[])
        order by height desc
        limit $3 offset $4
    `

    const rows = (await query(sql, [address, Array.isArray(type) ? type : [type], limit, offset])).rows
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

export const getProducers = async () => {
    const sql = `
        select *
        from v_block_producers
        where delegators > 0 and cast (stake / 10^9 as int) > 66000
        order by random()
    `
    const rows = (await query(sql)).rows
    const result = []

    for(let r of rows) {
        result.push([
            r.id,
            r.public_key,
            r.name,
            r.blocks_total,
            r.blocks_canonical,
            r.cop,
            r.stake,
            r.stake_next,
            r.delegators,
            r.delegators_next,
            r.pos,
            r.pos_next,
            r.scammer
        ])
    }

    return result
}

export const getTransactions = async ({
  type,
  status,
  limit = 50,
  offset = 0,
  search = null
} = {}) => {
    let sql = `
        select *
        from v_trans t
        where type = ANY($1::user_command_type[])
        and status = ANY($2::user_command_status[])
        %BLOCK_HEIGHT%
        %BLOCK_HASH%
        %TRANS_PARTICIPANT%
        %TRANS_HASH%
        order by height desc, timestamp desc
        limit $3 offset $4
    `

    const _type = type ? Array.isArray(type) ? type : [type] : ['payment', 'delegation']
    const _status = status ? Array.isArray(status) ? status : [status] : ['applied', 'failed']

    sql = sql.replace("%BLOCK_HEIGHT%", search && search.block ? `and height = ${search.block}` : "")
    sql = sql.replace("%BLOCK_HASH%", search && search.block_hash ? `and state_hash = '${search.block_hash}'` : "")
    sql = sql.replace("%TRANS_HASH%", search && search.hash ? `and hash = '${search.hash}'` : "")
    sql = sql.replace("%TRANS_PARTICIPANT%", search && search.participant ? `
    and (
        trans_owner = '${search.participant}'
        or lower(trans_owner_name) like '%${search.participant.toLowerCase()}%'
        or trans_receiver = '${search.participant}'
        or lower(trans_receiver_name) like '%${search.participant.toLowerCase()}%'
    )
    ` : "")

    const result = (await query(sql, [_type, _status, limit, offset])).rows

    for(let row of result) {
        row.memo = decodeMemo(row.memo)
        row.scam = checkMemoForScam(row.memo)
    }

    return result
}

export const getTransactionsCount = async ({
    type,
    status,
    search = null
} = {}) => {
    let sql = `
        select count(*) as length
        from v_trans t
        where type = ANY($1::user_command_type[])
        and status = ANY($2::user_command_status[])
        %BLOCK_HEIGHT%
        %BLOCK_HASH%
        %TRANS_PARTICIPANT%
        %TRANS_HASH%
    `

    const _type = type ? Array.isArray(type) ? type : [type] : ['payment', 'delegation']
    const _status = status ? Array.isArray(status) ? status : [status] : ['applied', 'failed']

    sql = sql.replace("%BLOCK_HEIGHT%", search && search.block ? `and height = ${search.block}` : "")
    sql = sql.replace("%BLOCK_HASH%", search && search.block_hash ? `and state_hash = '${search.block_hash}'` : "")
    sql = sql.replace("%TRANS_HASH%", search && search.hash ? `and hash = '${search.hash}'` : "")
    sql = sql.replace("%TRANS_PARTICIPANT%", search && search.participant ? `
    and (
        trans_owner = '${search.participant}'
        or lower(trans_owner_name) like '%${search.participant.toLowerCase()}%'
        or trans_receiver = '${search.participant}'
        or lower(trans_receiver_name) like '%${search.participant.toLowerCase()}%'
    )
    ` : "")

    return (await query(sql, [_type, _status])).rows[0].length
}

export const getTransactionsStat = async () => {
    const sql = `select * from v_trans_stat`
    const result = (await query(sql)).rows[0]

    result.pool = (await getTransactionInPool()).length

    return result
}

export const getAddresses = async ({
    limit = 50,
    offset = 0,
    sort = "stake",
    search = null
} = {}) => {
    let sql = `
        select a.*
        from v_address_list a 
        where 1=1
        %ADDRESS_KEY_NAME%
        order by %SORT%
        limit $1 offset $2
    `

    sql = sql.replace("%SORT%", sort)
    sql = sql.replace("%ADDRESS_KEY_NAME%", search && search.key ? `and (a.public_key = '${search.key}' or lower(a.name) like '%${search.key.toLowerCase()}%')` : "")

    console.log(sql)

    return (await query(sql, [limit, offset])).rows
}

export const getAddressesCount = async ({
   search = null
} = {}) => {
    let sql = `
        select count(a.id) as length
        from v_address_list a
        where 1=1
        %ADDRESS_KEY_NAME%
    `

    sql = sql.replace("%ADDRESS_KEY_NAME%", search && search.key ? `and (a.public_key = '${search.key}' or lower(a.name) like '%${search.key.toLowerCase()}%')` : "")

    return (await query(sql)).rows[0].length
}
