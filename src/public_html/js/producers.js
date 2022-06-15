const updateProducersTable = data => {
    if (!data || !Array.isArray(data)) return

    $("#active-producers").html(data.length)

    const table = Metro.getPlugin('#producers-table', 'table')
    setTimeout(() => {
        table.setData({data})
        $("#producers-table").removeClass("disabled")
        $("#load-data-activity").hide()
    }, 100)
}

const updateStat = data => {
    $("#total-addresses").html(data.total_addresses)
    $("#total-producers").html(data.total_producers)
}

const updateEpoch = data => {
    const {height, epoch, slot, global_slot, epoch_start_block, blocks_produced} = data

    $("#epoch-number").html((+epoch).format(0, null, " ", "."))
    $("#epoch-current-height").html((+height).format(0, null, " ", "."))
    $("#epoch-start-block").html((+epoch_start_block).format(0, null, " ", "."))
    $("#epoch-blocks-produced").html((+blocks_produced).format(0, null, " ", "."))
    $("#epoch-slot").html((+slot).format(0, null, " ", "."))
    $("#epoch-global-slot").html((+global_slot).format(0, null, " ", "."))
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLastActivity = () => {
        if (!isOpen(ws)) return
        request('epoch')
        request('stat')
    }

    switch(channel) {
        case 'welcome': {
            requestLastActivity()

            $("#producers-table").addClass("disabled")
            $("#load-data-activity").show()

            request('block_producers')

            break
        }
        case 'new_block': {
            requestLastActivity()
            break
        }
        case 'block_producers': {
            updateProducersTable(data)
            break
        }
        case 'stat': {
            updateStat(data)
            break
        }
        case 'epoch': {
            updateEpoch(data)
            break
        }
    }
}

function reloadProducersTable(){
    if (globalThis.webSocket) {
        $("#producers-table").addClass("disabled")
        $("#load-data-activity").show()

        request('block_producers')
    }
}


function producersTableDrawCell(td, val, idx, head, row, table){
    const [
        _id,
        _public_key,
        _name,
        _blocks_total,
        _blocks_canonical,
        _stake,
        _stake_next,
        _delegators,
        _delegators_next,
        _scammer,
        _uptime,
        _cop
    ] = row

    if (['id', 'name', 'scammer'].includes(head.name)) {
        td.addClass("d-none")
    }

    if (head.name === 'public_key') {
        td.html(`
            <a class="link" href="/address/${val}">${shorten(val, 12)}</a>
            <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${val}"></span>
            <div class="text-small">
                <span class="fg-darkViolet">${_name || 'Unknown'}</span>
                ${_scammer === 1 ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-4">SCAMMER</span>' : ''}                
            </div>
        `)
    }

    if (head.name === 'stake' || head.name === 'stake_next') {
        td.addClass("text-right").html(`
            <span>${Number(normMina(val).toFixed(0)).format(0, null, " ", ".")}</span>
        `)
    }

    if (head.name === 'delegators' || head.name === 'delegators_next') {
        td.addClass("text-center").html(`
            <span>${val}</span>
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

    if (head.name === 'uptime') {
        td.addClass("text-center").html(`${val >= 1000000 ? "<span class='text-muted text-small'>not rated</span>" : val}`)
    }

}