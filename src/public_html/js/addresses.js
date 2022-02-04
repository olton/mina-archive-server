const updateScammerList = data => {
    if (!data || !Array.isArray(data)) return

    const table = Metro.getPlugin('#scammer-list-table', 'table')
    table.setData({data})
}

const updateTopStacksList = data => {
    if (!data || !Array.isArray(data)) return

    const table = Metro.getPlugin('#top-stacks-table', 'table')
    table.setData({data})
}

const updateLastBlockWinnersList = data => {
    if (!data || !Array.isArray(data)) return

    const table = Metro.getPlugin('#last-winners-table', 'table')
    table.setData({data})
}

function topStackHoldersTableDrawCell(td, val, idx, head, row, table){
    if (idx === 0) {
        td.html(`
            <a class="link ml-2" href="/address/${val}">${shorten(val, 7)}</a>
        `)
    }
    if (idx === 1 || idx === 2) {
        td.html(`
            ${Number(normMina(val).toFixed(0)).format(0, null, " ", ".")}
        `).addClass('text-right')
    }
}

function lastBlockWinnersTableDrawCell(td, val, idx, head, row, table){
    if (idx === 0) {
        td.html(`
            <a class="link ml-2" href="/address/${val}">${shorten(val, 7)}</a>
        `)
    }
    if (idx === 2) {
        td.html(`
            ${Number(normMina(val).toFixed(0)).format(0, null, " ", ".")}
        `).addClass('text-right')
    }
}

function scammerListDrawCell(td, val, idx, head, row, table){
    if (idx === 0) {
        td.html(`
            <a class="link ml-2" href="/address/${val}">${shorten(val, 12)}</a>
        `)
    }
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLastActivity = () => {
        ws.send(JSON.stringify({channel: 'epoch'}));
        ws.send(JSON.stringify({channel: 'scammer_list'}));
        ws.send(JSON.stringify({channel: 'top_stack_holders', data: 20}));
        ws.send(JSON.stringify({channel: 'last_block_winners', data: 20}));
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
        case 'scammer_list': {
            updateScammerList(data)
            break;
        }
        case 'top_stack_holders': {
            updateTopStacksList(data)
            break;
        }
        case 'last_block_winners': {
            updateLastBlockWinnersList(data)
            break;
        }
    }
}