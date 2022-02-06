const updateProducersTable = data => {
    if (!data || !Array.isArray(data)) return

    $("#active-producers-count").html(data.length)

    const table = Metro.getPlugin('#producers-table', 'table')
    setTimeout(() => {
        table.setData({data})
        $("#producers-table").removeClass("disabled")
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
    }

    switch(channel) {
        case 'welcome': {
            requestLastActivity()
            $("#producers-table").addClass("disabled")
            $("#load-data-activity").show()
            ws.send(JSON.stringify({channel: 'block_producers'}));
            break;
        }
        case 'new_block': {
            requestLastActivity()
            break;
        }
        case 'block_producers': {
            updateProducersTable(data)
            break;
        }
    }
}

function reloadProducersTable(){
    if (globalThis.webSocket) {
        $("#producers-table").addClass("disabled")
        $("#load-data-activity").show()
        globalThis.webSocket.send(JSON.stringify({channel: 'block_producers'}))
    }
}


function producersTableDrawCell(td, val, idx, head, row, table){
    if (['id', 'name', 'delegators_next', 'pos', 'pos_next', 'scammer'].includes(head.name)) {
        td.addClass("d-none")
    }
    if (head.name === 'public_key') {
        td.html(`
            <a class="link" href="/address/${val}">${shorten(val, 12)}</a>
            <div class="text-small">
                <span class="fg-darkViolet">${row[2] || 'Unknown'}</span>                
            </div>
        `)
    }
    if (head.name === 'blocks') {
        td.addClass("text-center").html(`
            <span>${val}</span>
        `)
    }
    if (head.name === 'blocks_canonical') {
        td.addClass("text-center").html(`
            <span class="">${val}</span>
        `)
    }
    if (head.name === 'cop') {
        td.addClass("text-center").html(`${val}<span class="ml-1 reduce-3">%</span>`)
    }
    if (head.name === 'stake' || head.name === 'stake_next') {
        td.addClass("text-right").html(`
            <span>${Number(normMina(val).toFixed(0)).format(0, null, " ", ".")}</span>
            <div class="text-small text-muted">${((head.name === 'stake' ? row[10] : row[11]) * 1 ).toFixed(4)}<span class="ml-1 reduce-3">%</span></div>
        `)
    }
    if (head.name === 'delegators') {
        td.addClass("text-center").html(`
            <span>${val}</span>
        `)
    }
}