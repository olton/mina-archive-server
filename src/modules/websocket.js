import WebSocket, {WebSocketServer} from "ws";
import {
    getLeaderboard,
    getAddressUptime,
    getTransaction,
    getScammerList,
    getLastBlockWinners,
    getAddressBlocks,
    getAddressTrans,
    getAddressDelegations,
    getBlockTransactions,
    getProducers,
    getDisputeBlocks,
    getBlocks,
    getStat,
    getAddressInfo,
    getLastBlockTime,
    getBlockInfo,
    getEpoch,
    getAddressTransactions,
    getTotalBlocks,
    getBlocksCount,
    getTransactionsCount,
    getTransactions,
    getTransactionsStat,
    getTopStakeHolders,
    getAddresses,
    getAddressesCount,
    getTransactionFromPool,
    getAddressTransactionsFromPool, getLastBlock
} from "./queries.js";
import pkg from "../../package.json";
import {log} from "../helpers/logging.js";
import {getAddressBalance} from "./graphql.js";
import {
    getAddressUptimeLine,
    getBalancePerEpoch,
    getBlocksPerEpoch,
    getBlocksTimelapse,
    getStakePerEpoch,
    getTransactionsFeesLine
} from "./analytics.js";
import {getAddressBalanceExp} from "./mina-explorer.js";
import {searchData} from "./search.js";

const {version} = pkg

export const websocket = (server) => {
    globalThis.wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
        ws.send(JSON.stringify({
            channel: "welcome",
            data: `Welcome to Minataur v${version}`
        }))

        ws.on('message', async (msg) => {
            const {channel, data} = JSON.parse(msg)
            switch (channel) {
                case 'epoch': {
                    response(ws, channel, await getEpoch())
                    break
                }
                case 'last_block_time': {
                    response(ws, channel, await getLastBlockTime())
                    break
                }
                case 'stat': {
                    response(ws, channel, await getStat())
                    break
                }
                case 'dispute': {
                    response(ws, channel, await getDisputeBlocks())
                    break
                }
                case 'lastChain': {
                    response(ws, channel, await getBlocks({limit: 20}))
                    break
                }
                case 'price': {
                    response(ws, channel, cache.price);
                    break;
                }
                case 'address_last_blocks': {
                    response(ws, channel, await getAddressBlocks(data.pk, {type: data.type, limit: data.count, offset: data.offset}));
                    break;
                }
                case 'address_last_trans': {
                    response(ws, channel, await getAddressTransactions(data.pk, {limit: data.count, offset: data.offset}));
                    break;
                }
                case 'blocks': {
                    const totalBlocks = await getTotalBlocks()
                    const blocks = await getBlocks({type: data.type, limit: data.count, offset: data.offset, search: data.search})
                    const count = await getBlocksCount({type: data.type, search: data.search})
                    response(ws, channel, {totalBlocks, blocks, count});
                    break;
                }
                case 'zero_blocks': {
                    const count = await getBlocksCount({type: data.type, search: data.search})
                    const blocks = await getBlocks({type: data.type, limit: data.count, offset: data.offset, search: data.search})
                    response(ws, channel, {blocks, count});
                    break;
                }
                case 'block': {
                    response(ws, channel, await getBlockInfo(data));
                    break;
                }
                case 'block_trans': {
                    response(ws, channel, await getBlockTransactions(data));
                    break;
                }
                case 'address': {
                    response(ws, channel, await getAddressInfo(data));
                    break;
                }
                case 'address_balance': {
                    let balance = await getAddressBalance(data)
                    if (balance.error) {
                        balance = await getAddressBalanceExp(data)
                    }
                    response(ws, channel, balance)
                    break
                }
                case 'address_trans_pool': {
                    response(ws, channel, await getAddressTransactionsFromPool(data));
                    break;
                }
                case 'trans_pool': {
                    response(ws, channel, cache.transactionPool);
                    break;
                }
                case 'trans_pool_count': {
                    response(ws, channel, cache.transactionPool ? cache.transactionPool.length : 0);
                    break;
                }
                case 'uptime': {
                    response(ws, channel, await getLeaderboard());
                    break;
                }
                case 'address_uptime': {
                    response(ws, channel, await getAddressUptime(data));
                    break;
                }
                case 'transaction': {
                    const transInBlockchain = await getTransaction(data)
                    const transInPool = await getTransactionFromPool(data)
                    response(ws, channel, transInBlockchain || transInPool);
                    break;
                }
                case 'scammer_list': {
                    response(ws, channel, await getScammerList(data));
                    break;
                }
                case 'top_stack_holders': {
                    response(ws, channel, await getTopStakeHolders(data));
                    break;
                }
                case 'last_block_winners': {
                    response(ws, channel, await getLastBlockWinners(data));
                    break;
                }
                case 'address_blocks': {
                    response(ws, channel, await getAddressBlocks(data.pk, {type: data.type, limit: data.count, offset: data.offset}));
                    break;
                }
                case 'address_trans': {
                    response(ws, channel, await getAddressTrans(data));
                    break;
                }
                case 'address_delegations': {
                    response(ws, channel, await getAddressDelegations(data, false));
                    break;
                }
                case 'address_delegations_next': {
                    response(ws, channel, await getAddressDelegations(data, true));
                    break;
                }
                case 'block_producers': {
                    response(ws, channel, await getProducers());
                    break;
                }
                case 'transactions': {
                    const count = await getTransactionsCount({type: data.type, status: data.status, search: data.search, pending: data.pending})
                    const trans = await getTransactions({type: data.type, status: data.status, limit: data.count, offset: data.offset, search: data.search, pending: data.pending})
                    response(ws, channel, {transactions: trans, count})
                    break
                }
                case 'trans_stat': {
                    response(ws, channel, await getTransactionsStat())
                    break
                }
                case 'trans_fees_line': {
                    response(ws, channel, await getTransactionsFeesLine())
                    break
                }
                case 'addresses': {
                    const count = await getAddressesCount({search: data.search})
                    const addresses = await getAddresses({sort: data.sort, limit: data.count, offset: data.offset, search: data.search})
                    response(ws, channel, {count, addresses})
                    break
                }
                case 'address_balance_per_epoch': {
                    response(ws, channel, await getBalancePerEpoch(data.pk, data.len))
                    break
                }
                case 'address_stake_per_epoch': {
                    response(ws, channel, await getStakePerEpoch(data.pk, data.len))
                    break
                }
                case 'address_blocks_per_epoch': {
                    response(ws, channel, await getBlocksPerEpoch(data.pk, data.len))
                    break
                }
                case 'blocks_timelapse': {
                    response(ws, channel, await getBlocksTimelapse(data.len))
                    break
                }
                case 'address_uptime_line': {
                    response(ws, channel, await getAddressUptimeLine(data.pk, data.limit, data.trunc))
                    break
                }
                case 'search_data': {
                    response(ws, channel, await searchData(data))
                    break
                }
                case 'last_block': {
                    response(ws, channel, globalThis.cache.lastBlock)
                    break
                }
            }
        })
    })
}

export const response = (ws, channel, data) => {
    if (config.debug.channel) {
        log("WS Channel", 'debug', {channel})
    }

    ws.send(JSON.stringify({
        channel,
        data
    }))
}

export const sendBroadcast = (data) => {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data))
        }
    })
}
