import WebSocket, {WebSocketServer} from "ws";
import {
    qBlocks,
    qAddressInfo,
    qDisputeBlocks,
    qGetStat,
    qLastBlockTime,
    qGetEpoch,
    qAddressBlocks,
    qAddressTransactions,
    qBlockInfo,
    qBlockTransactions,
    getLeaderboard
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
            data: `Welcome from Minataur v${version}`
        }))

        ws.on('message', async (msg, isBinary) => {
            const {channel, data} = JSON.parse(msg)
            switch (channel) {
                case 'epoch': {
                    response(ws, channel, await qGetEpoch())
                    break
                }
                case 'last_block_time': {
                    response(ws, channel, await qLastBlockTime())
                    break
                }
                case 'stat': {
                    response(ws, channel, await qGetStat())
                    break
                }
                case 'dispute': {
                    response(ws, channel, await qDisputeBlocks())
                    break
                }
                case 'lastChain': {
                    response(ws, channel, await qBlocks({limit: 20}))
                    break
                }
                case 'price': {
                    response(ws, channel, cache.price);
                    break;
                }
                case 'address_last_blocks': {
                    response(ws, channel, await qAddressBlocks(data.pk, {type: data.type, limit: data.count, offset: data.offset}));
                    break;
                }
                case 'address_last_trans': {
                    response(ws, channel, await qAddressTransactions(data.pk, {limit: data.count, offset: data.offset}));
                    break;
                }
                case 'blocks': {
                    response(ws, channel, await qBlocks({type: data.type, limit: data.count, offset: data.offset}));
                    break;
                }
                case 'block': {
                    response(ws, channel, await qBlockInfo(data));
                    break;
                }
                case 'block_trans': {
                    response(ws, channel, await qBlockTransactions(data));
                    break;
                }
                case 'address': {
                    console.log("Address data requested for ", data)
                    const addrData = await qAddressInfo(data)
                    console.log(addrData)
                    response(ws, channel, addrData);
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
                    response(ws, channel, await getLeaderboard(null));
                    break;
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
