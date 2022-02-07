const updateEpoch = data => {
    const {height, epoch, slot, global_slot, epoch_start_block, blocks_produced} = data

    $("#epoch-number").html((+epoch).format(0, null, " ", "."))
    $("#epoch-current-height").html((+height).format(0, null, " ", "."))
    $("#epoch-start-block").html((+epoch_start_block).format(0, null, " ", "."))
    $("#epoch-blocks-produced").html((+blocks_produced).format(0, null, " ", "."))
    $("#epoch-slot").html((+slot).format(0, null, " ", "."))
    $("#epoch-global-slot").html((+global_slot).format(0, null, " ", "."))
}

const updateZeroBlocksTable = data => {
    if (!data || !Array.isArray(data)) return

    $("#zero-blocks-count").html(data.length)

    const table = Metro.getPlugin('#zero-blocks-table', 'table')
    setTimeout(() => {
        table.setData({data})
        $("#zero-blocks-table").removeClass("disabled")
        $("#load-data-activity").hide()
    }, 100)
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLastActivity = () => {
        ws.send(JSON.stringify({channel: 'epoch'}));
        $("#zero-blocks-table").addClass("disabled")
        $("#load-data-activity").show()
        ws.send(JSON.stringify({channel: 'zero_blocks'}));
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
        case 'zero_blocks': {
            updateZeroBlocksTable(data)
            break;
        }
        case 'epoch': {
            updateEpoch(data)
            break;
        }
    }
}

function reloadProducersTable(){
    if (globalThis.webSocket) {
        $("#zero-blocks-table").addClass("disabled")
        $("#load-data-activity").show()
        globalThis.webSocket.send(JSON.stringify({channel: 'zero_blocks'}))
    }
}

function zeroBlocksTableDrawCell(td, val, idx, head, row, table){
    const [height, epoch, slot, global_slot, creator_key, creator_name, timestamp, state_hash] = row
    if (['slot', 'global_slot', 'creator_name', 'timestamp'].includes(head.name)) {
        td.addClass("d-none")
    }
    if (head.name === 'height') {
        td.addClass("text-center").html(`
            <a class="link" href="/block/${state_hash}">${val}</a>
            <div class="text-muted text-small">${datetime(+timestamp).timeLapse()}</div>
        `)
    }
    if (head.name === 'epoch') {
        td.addClass("text-center").html(`
            <span>${val}</span>
            <div class="text-muted text-small">${slot}:${global_slot}</div>
        `)
    }
    if (head.name === 'creator_key') {
        td.html(`
            <a class="link" href="/address/${val}">${shorten(val, 12)}</a>
            <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${val}"></span>
            <div class="fg-violet text-small">${creator_name || ''}</div>
        `)
    }
    if (head.name === 'state_hash') {
        td.html(`
            <a class="link" href="/block/${val}">${shorten(val, 12)}</a>
            <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${val}"></span>
            <div class="text-muted text-small">${datetime(+timestamp).format(config.format.datetime)}</div>
        `)
    }
}