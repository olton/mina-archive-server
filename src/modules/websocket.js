import WebSocket, {WebSocketServer} from "ws";
import {qBlocks, qGetEpoch, qGetStat, qLatestBlocks} from "./queries.js";
import pkg from "../../package.json";

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
                case 'epoch': response(ws, channel, await qGetEpoch()); break;
                case 'stat': response(ws, channel, await qGetStat()); break;
                case 'dispute': response(ws, channel, await qLatestBlocks()); break;
                case 'blocks': response(ws, channel, await qBlocks({type: data.type, limit: data.count})); break;
            }
        })
    })
}

export const response = (ws, channel, data) => {
    console.log("Channel", channel)
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
