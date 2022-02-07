let currentPage = 1

const updateBlocksTable = data => {

}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLastActivity = () => {
        ws.send(JSON.stringify({channel: 'epoch'}));
    }

    switch(channel) {
        case 'welcome': {
            requestLastActivity()
            ws.send(JSON.stringify({channel: 'blocks'}));
            break;
        }
        case 'new_block': {
            requestLastActivity()
            break;
        }
        case 'blocks': {
            updateBlocksTable(data)
            break;
        }
    }
}