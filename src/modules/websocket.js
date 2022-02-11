import WebSocket, {WebSocketServer} from "ws";
import {
    getLeaderboard,
    getAddressUptime,
    getTransaction,
    getScammerList,
    getTopStackHolders,
    getLastBlockWinners,
    getAddressBlocks,
    getAddressTrans,
    getAddressDelegations,
    getBlockTransactions,
    getProducers,
    getZeroBlocks,
    getDisputeBlocks,
    getBlocks,
    getStat,
    getAddressInfo,
    getLastBlockTime,
    getBlockInfo,
    getEpoch,
    getAddressTransactions, getTotalBlocks, getBlocksCount, getTransactionsCount, getTransactions, getTransactionsStat
} from "./queries.js";
import pkg from "../../package.json";
import {log} from "../helpers/logging.js";
import {getAddressBalance, getTransactionInPool} from "./graphql.js";

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
                    response(ws, channel, await getAddressBalance(data));
                    break;
                }
                case 'address_trans_pool': {
                    response(ws, channel, await getTransactionInPool(data));
                    break;
                }
                case 'trans_pool': {
                    response(ws, channel, await getTransactionInPool());
                    break;
                }
                case 'trans_pool_count': {
                    response(ws, channel, cache.transactionPool ? cache.transactionPool.length : 0);
                    break;
                }
                case 'new_block': {
                    console.log("New block log ---------------------------------------")
                    break;
                }
                case 'update_uptime': {
                    console.log("Update uptime log ---------------------------------------")
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
                    response(ws, channel, await getTransaction(data));
                    break;
                }
                case 'scammer_list': {
                    response(ws, channel, await getScammerList(data));
                    break;
                }
                case 'top_stack_holders': {
                    response(ws, channel, await getTopStackHolders(data));
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
                case 'zero_blocks': {
                    const count = await getBlocksCount({...data})
                    const blocks = await getBlocks({type: data.type, limit: data.count, search: data.search})
                    response(ws, channel, {blocks, count});
                    break;
                }
                case 'transactions': {
                    const count = await getTransactionsCount({type: data.type, status: data.status, search: data.search})
                    const trans = await getTransactions({type: data.type, status: data.status, limit: data.count, offset: data.offset, search: data.search})
                    response(ws, channel, {transactions: trans, count})
                    break
                }
                case 'trans_stat': {
                    response(ws, channel, await getTransactionsStat())
                }
            }
        })
    })
}

export const response = (ws, channel, data) => {
    if (config.debug) {
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
