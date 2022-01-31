const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLastActivity = () => {
        ws.send(JSON.stringify({channel: 'epoch'}));

        setTimeout(requestLastActivity, 60000)
    }

    switch(channel) {
        case 'welcome': {
            requestLastActivity()
            break;
        }
        case 'new_block': {
            requestLastActivity()
            break;
        }
    }
}