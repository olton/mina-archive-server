import {query} from  "./postgres.js"
import {CHAIN_STATUS_PENDING, CHAIN_STATUS_CANONICAL, CHAIN_STATUS_ORPHANED, CHAIN_STATUS_ALL} from "./consts.js"
import {checkMemoForScam} from "../helpers/scam.js";
import {decodeMemo} from "../helpers/memo.js";
import {datetime} from "@olton/datetime";
import {UPTIME_SNARKWORK} from "./uptime-api.js";

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
        select t.*, 
               coalesce(a.found, 0) as is_fund 
        from v_trans t 
        left join address a on a.public_key_id = t.trans_owner_id
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
    const result = (await query(sql, [hash])).rows[0]

    result.supercharge = config.coinbase.supercharge.includes(result.coinbase / 10**9)

    return result
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
    limit = 240,
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
    let result

    const sql = `
        select * 
        from v_uptime_short
        where public_key = $1
        limit 1
    `
    result = (await query(sql, [address])).rows
    if (!result.length) {
        return []
    }

    const data = result[0]

    const range = (await query(`select min(position) as min_pos, max(position) as max_pos from v_uptime where rate = $1`, [data.rate])).rows[0]

    data.range = {
        min: range.min_pos,
        max: range.max_pos
    }

    return data
}

export const getTransaction = async (hash) => {
    const sql = `
        select *
        from v_trans_all t
        where t.hash = $1
        limit 1
    `
    let result = (await query(sql, [hash])).rows[0]

    if (!result) return null

    result.memo = result.memo ? decodeMemo(result.memo) : ""
    result.scam = checkMemoForScam(result.memo)

    return result
}

export const getTransactionFromPool = async (hash) => {
    let result
    for(let r of globalThis.cache.transactionPool) {
        if (r.hash === hash)
            result = {
                status: "pending",
                type: r.kind.toLowerCase(),
                amount: r.amount,
                fee: r.fee,
                hash: r.hash,
                memo: r.memo,
                scam: checkMemoForScam(r.memo),
                timestamp: datetime().time(),
                height: 0,
                trans_owner: r.from,
                trans_owner_name: await getAddressName(r.from),
                trans_receiver: r.to,
                trans_receiver_name: await getAddressName(r.to),
                nonce: r.nonce,
                confirmation: 0
            }
    }
    return result
}

export const getAddressTransactionsFromPool = async (address) => {
    let result = []
    for(let r of globalThis.cache.transactionPool) {
        if (r.from === address)
            result.push( {
                id: r.id,
                status: "pending",
                kind: r.kind.toLowerCase(),
                type: r.kind.toLowerCase(),
                amount: r.amount,
                fee: r.fee,
                hash: r.hash,
                memo: r.memo,
                scam: checkMemoForScam(r.memo),
                timestamp: datetime().time(),
                height: 0,
                trans_owner: r.from,
                from: r.from,
                trans_owner_name: await getAddressName(r.from),
                trans_receiver: r.to,
                to: r.to,
                trans_receiver_name: await getAddressName(r.to),
                nonce: r.nonce,
                confirmation: 0
            } )
    }
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
            t.slot,
            coalesce(a.found, 0) as is_fund,
            t.trans_owner_balance   
        from v_trans t
        left join address a on a.public_key_id = t.trans_owner_id
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
            r.scam,
            r.is_fund,
            r.trans_owner_balance
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

export const getAddressName = async (key) => {
    const sql = `
        select name 
        from address a 
        left join public_keys pk on pk.id = a.public_key_id
        where pk.value = $1
    `

    const res = (await query(sql, [key])).rows
    return res.length ? res[0].name : null
}

export const getTransactions = async ({
    type,
    status,
    limit = 50,
    offset = 0,
    pending = true,
    search = null
} = {}) => {
    let pool_result = []

    if (pending) {
        const pool_rows = globalThis.cache.transactionPool.slice(offset, +(offset) + +(limit))
        for(let r of pool_rows) {
            pool_result.push({
                status: "pending",
                type: r.kind.toLowerCase(),
                amount: r.amount,
                fee: r.fee,
                hash: r.hash,
                memo: r.memo,
                scam: checkMemoForScam(r.memo),
                timestamp: datetime().time(),
                height: 0,
                trans_owner: r.from,
                trans_owner_name: await getAddressName(r.from),
                trans_receiver: r.to,
                trans_receiver_name: await getAddressName(r.to),
                nonce: r.nonce,
                confirmation: 0
            })
        }
        if (search && (search.block || search.block_hash)) {
            pool_result = []
        } else {
            if (search && search.hash) {
                pool_result = pool_result.filter( v => v.hash === search.hash)
            } else if (search && search.participant) {
                pool_result = pool_result.filter( v => {
                    return v.trans_owner === search.participant ||
                        v.trans_receiver === search.participant ||
                        v.trans_owner_name.toLowerCase().includes(search.participant) ||
                        v.trans_receiver_name.toLowerCase().includes(search.participant)
                })
            }
        }
    }

    let _limit = limit - pool_result.length
    let _offset = offset === 0 ? 0 : offset - pool_result.length

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

    const result = (await query(sql, [_type, _status, _limit, _offset])).rows

    for(let row of result) {
        row.memo = decodeMemo(row.memo)
        row.scam = checkMemoForScam(row.memo)
    }

    return pool_result.concat(result)
}

export const getTransactionsCount = async ({
    type,
    status,
    pending = true,
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

    const pool_rows = globalThis.cache.transactionPool

    return +((await query(sql, [_type, _status])).rows[0].length) + +(pending ? pool_rows.length : 0)
}

export const getTransactionsStat = async () => {
    const sql = `select * from v_trans_stat`
    const result = (await query(sql)).rows[0]

    result.pool = globalThis.cache.transactionPool.length

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
        from v_address_list_short a 
        where 1=1
        %ADDRESS_KEY_NAME%
        order by %SORT%
        limit $1 offset $2
    `

    sql = sql.replace("%SORT%", sort)
    sql = sql.replace("%ADDRESS_KEY_NAME%", search && search.key ? `and (a.public_key = '${search.key}' or lower(a.name) like '%${search.key.toLowerCase()}%')` : "")

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

export const getLastBlock = async (short = true) => {
    const sql = short ?
        `
        select
            b.height,
            b.creator_id,
            pk.value as creator_key,
            a.name,
            b.timestamp,
            COALESCE((SELECT sum(ic.fee) AS sum
             FROM internal_commands ic
                      LEFT JOIN blocks_internal_commands bic ON bic.internal_command_id = ic.id
             WHERE bic.block_id = b.id
               AND ic.type = 'coinbase'::internal_command_type),
            0::numeric) as coinbase
        from blocks b
        left join public_keys pk on b.creator_id = pk.id
        left join address a on b.creator_id = a.public_key_id
        where b.chain_status = 'canonical'
        order by height desc limit 1
        `
        :
        `
        select id, parent_id, height, epoch, slot, global_slot, creator_key,
               creator_id, creator_name, winner_key, winner_id, timestamp,
               coinbase_receiver_id, coinbase_receiver_name, coinbase_receiver_key,
               coinbase, trans_fee, snark_fee, trans_count, snark_count, tr_applied, tr_failed,
               state_hash, participants, timelapse
        from v_blocks
        where chain_status = 'canonical'
        order by height desc
        limit 1
    `

    return (await query(sql)).rows[0]
}

export const getBlockchainHeight = async () => {
    const sql = `select height from blocks where chain_status = 'canonical' order by height desc limit 1`

    return (await query(sql)).rows[0].height
}

export const storeIp = async (ip) => {
    if (ip.substr(0, 7) === "::ffff:") {
        ip = ip.substr(7)
    }

    const sql = `
        insert into ip (ip) values($1)
        on conflict (ip, date) 
        do update
            set hits = ip.hits + 1
    `
    return (await query(sql, [ip]))
}

export const getAddressStakes = async (address) => {
    const sql = `
        select *
        from v_stakes
        where value = $1
    `

    return (await query(sql, [address])).rows
}

export const getAddressRewards = async (address, epoch, cb_super = 1440000000000) => {
    if (!epoch) {
        epoch = (await getEpoch())["epoch"]
    }
    const sql = `
        select
            count(*) as blocks_count,
            sum(coinbase) as total_rewards,
            (
                select count(*)
                from v_blocks
                where epoch = $2
                  and chain_status = 'canonical'
                  and coinbase = 0
                  and creator_key = $1
            ) as zero_blocks,
            (
                select count(*)
                from v_blocks
                where epoch = $2
                  and chain_status = 'canonical'
                  and coinbase = $3
                  and creator_key = $1
            ) as super_count,
            coalesce((
                select sum(coinbase)
                from v_blocks
                where epoch = $2
                  and chain_status = 'canonical'
                  and coinbase = $3
                  and creator_key = $1
            ), 0)  as super_rewards
        from v_blocks b
        where
            b.epoch = $2
        and b.chain_status = 'canonical'
        and b.creator_key = $1
        limit 1
    `

    return (await query(sql, [address, epoch, cb_super])).rows
}


export const getAddressBlocksInEpoch = async (address, epoch = -1) => {
    const sql = `
        select
            count(*) as blocks,
            sum(b.coinbase) as coinbase,
            (
                select count(*) 
                from v_blocks 
                where creator_key = $1 
                  and epoch = ${epoch === -1 ? '(select epoch from v_epoch)' : epoch}
            ) as attempts
        from v_blocks b
        where b.creator_key = $1
          and b.epoch = ${epoch === -1 ? '(select epoch from v_epoch)' : epoch}
          and b.chain_status = 'canonical'
        limit 1
    `
    const result = await query(sql, [address])

    if (result.rows.length) {
        return result.rows[0]
    } else {
        return {
            blocks: 0,
            coinbase: 0,
            attempts: 0
        }
    }
}

export const getAddressUptimePosition = async (address, type = UPTIME_SNARKWORK) => {
    const sql = `
        select * 
        from ${type === UPTIME_SNARKWORK ? 'uptime_snark' : 'uptime_sidecar'}
        where public_key = $1
        order by timestamp desc 
        limit 1
    `

    const result = await query(sql, [address])
    return result.rows.length ? result.rows[0] : null
}

export const getAddressUptimePositionLine = async (address, type = UPTIME_SNARKWORK, interval = 'hour', func = 'avg', limit = 48) => {
    const sql = `
        select
            round(${func}(u.position)) as position,
            date_trunc('${interval}', u.timestamp) as timestamp
        from ${type === UPTIME_SNARKWORK ? 'uptime_snark' : 'uptime_sidecar'} u
        where public_key = $1
        group by date_trunc('${interval}', u.timestamp)
        order by date_trunc('${interval}', u.timestamp) desc
        limit $2
    `

    const result = await query(sql, [address, limit])
    return result.rows.length ? result.rows : null
}
