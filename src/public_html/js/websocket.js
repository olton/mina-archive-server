
globalThis.webSocket = null

const connect = () => {
    const {host, secure} = config.server
    const ws = new WebSocket(`${secure ? 'wss' : 'ws'}://${host}`)

    globalThis.webSocket = ws

    ws.onmessage = event => {
        try {
            const content = JSON.parse(event.data)
            if (typeof wsMessageController === 'function') {
                wsMessageController.apply(null, [ws, content])
            }
        } catch (e) {
            log(e.message)
            log(event.data)
            log(e.stack)
        }
    }

    ws.onerror = error => {
        error('Socket encountered error: ', error.message, 'Closing socket');
        ws.close();
    }

    ws.onclose = event => {
        log('Socket is closed. Reconnect will be attempted in 1 second.', event.reason);
        setTimeout(connect, 1000)
    }

    ws.onopen = event => {
        log('Connected to Minataur');
    }
}

connect()
