let intervalBlocksData

const drawLastChainTable = data => {
    const rows = []

    for(let row of data) {
        let tr = $("<tr>")

        tr.html(`
            <td>
                <span class="mif-stop ${row.chain_status === 'pending' ? 'fg-cyan' : row.chain_status === 'canonical' ? 'fg-green' : 'fg-red'}"></span>
            </td>
            <td>
                <span>${row.height}</span>            
                <div class="text-muted text-small">${datetime(+row.timestamp).timeLapse()}</div>            
            </td>
            <td>
                <a class="link" href="/address/${row.creator_key}">${shorten(row.creator_key, 12)}</a>            
                <div class="text-muted text-small fg-violet">${row.creator_name || ''}</div>            
            </td>
            <td class="text-center">
                <span>${normMina(row.coinbase)}</span>
                <div class="text-muted text-small">${normMina(row.snark_fee)}</div>            
            </td>
            <td class="text-center">
                <span>${row.slot}</span>
                <div class="text-muted text-small">${row.global_slot}</div>            
            </td>
            <td class="text-center">
                <span>${row.epoch}</span>
                <div class="text-muted text-small">epoch</div>            
            </td>
            <td class="text-center">
                <span>${row.trans_count}</span>
                <div class="text-muted text-small">${normMina(row.trans_fee)}</div>            
            </td>
            <td>
                <a class="link" href="/block/${row.state_hash}">${shorten(row.state_hash, 5)}</a>
                <div class="text-muted text-small">${datetime(+row.timestamp).format(config.format.datetime)}</div>            
            </td>
        `)

        rows.push(tr)
    }

    return rows
}

const updateTransPoolCount = data => {
    $("#pool-trans").html(data)
}

const updatePrice = (data) => {
    if (!data) return

    const {current_price, currency, last_updated, total_supply} = data

    $("#mina-price").html(current_price)
    $("#mina-price-currency").html(currency)
    $("#mina-price-update").html(datetime(last_updated).format(config.format.datetime))
    $("#mina-total-supply").html(Math.round(total_supply).format(0, null, " ", "."))
}

const updateHeight = data => {
    if (!data) return

    const {height, epoch, slot, global_slot, epoch_start_block, blocks_produced} = data

    $("#height").html(`
        <span>${(+height).format(0, null, " ", ".")}</span>
        <div class="reduce-4 text-bold ml-auto">
            <span class="fg-violet" title="Blocks Produced in Epoch">${blocks_produced}</span>
        </div>
    `)
    $("#epoch").html((+epoch).format(0, null, " ", "."))
    $("#slot").html((+slot).format(0, null, " ", "."))
    $("#global-slot").html((+global_slot).format(0, null, " ", "."))
    $("#start_block").addClass("reduce-2").html("<span class='text-muted mr-1 mif-cake'></span>"+(+epoch_start_block).format(0, null, " ", "."))

    const SLOT_DURATION = 180000
    const EPOCH_DURATION = 1285200000
    const GENESIS_START = "2021-03-17 02:00:00.000000+02:00"
    const epochDurationProgress = (+slot * SLOT_DURATION * 100) / EPOCH_DURATION
    const progress = Metro.getPlugin('#epoch-donut', 'donut')

    progress.setColor({
        "stroke": "rgb(245, 245, 245)"
    })

    progress.val(epochDurationProgress)

    const epochTimer = $("#epoch-timer")
    const epochEnd = datetime(GENESIS_START).addSecond(EPOCH_DURATION/1000 * (+epoch + 1))
    const epochEndFormatted = epochEnd.format("MM/DD/YYYY HH:mm")

    $("#current-epoch-number").html(epoch)
    $("#epoch-stop").html(epochEnd.format(config.format.datetime))

    if (epochTimer.attr("data-date") !== epochEndFormatted) {
        const countdown = Metro.getPlugin("#epoch-timer", "countdown")
        countdown.resetWith(epochEndFormatted)
    }
}

const updateStat = data => {
    if (!data) return

    const {total_producers, total_addresses, tr_applied, tr_failed, tr_total} = data

    $("#total-trans").html((+tr_total).format(0, null, " ", "."))
    $("#applied-trans").html((+tr_applied).format(0, null, " ", "."))
    $("#failed-trans").html((+tr_failed).format(0, null, " ", "."))
    $("#total-addresses").html((+total_addresses).format(0, null, " ", "."))
    $("#total-producers").html((+total_producers).format(0, null, " ", "."))
}

const updateDispute = data => {
    if (!data) return

    const target = $("#dispute-blocks-table tbody").clear()
    const rows = drawLastChainTable(data, 'dispute')
    rows.map( r => target.append(r) )
    $("#dispute-block-length").html(rows.length)
}

const updateBlocks = data => {
    if (!data) return

    const target = $("#canonical-blocks-table tbody").clear()
    const rows = drawLastChainTable(data, 'canonical')
    rows.map( r => target.append(r) )
    $("#canonical-block-length").html(rows.length)
}

const updateLastBlockTime = data => {
    if (!data) return

    $("#last-block-time").html(`${datetime(+data).timeLapse()}`)
}

let chainRequestMarker = 2

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestPeriodically = () => {
        if (isOpen(ws)) {
            ws.send(JSON.stringify({channel: 'trans_pool_count'}))
            ws.send(JSON.stringify({channel: 'price'}))
            ws.send(JSON.stringify({channel: 'stat'}))
            ws.send(JSON.stringify({channel: 'last_block_time'}))
            ws.send(JSON.stringify({channel: 'epoch'}))

            requestChain()
        }
        setTimeout(requestPeriodically, 60000)
    }

    const requestChain = () => {
        if (!isOpen(ws)) return

        if (chainRequestMarker === 2) {
            chainRequestMarker = 0
            ws.send(JSON.stringify({channel: 'dispute'}))
            ws.send(JSON.stringify({channel: 'lastChain'}))
        }
    }

    switch(channel) {
        case 'welcome': {
            requestPeriodically()
            break;
        }
        case 'new_block': {
            requestChain()
            break;
        }
        case 'epoch': {
            updateHeight(data)
            break
        }
        case 'price': {
            updatePrice(data)
            break
        }
        case 'stat': {
            updateStat(data)
            break
        }
        case 'dispute': {
            updateDispute(data)
            chainRequestMarker++
            break
        }
        case 'lastChain': {
            updateBlocks(data)
            chainRequestMarker++
            break
        }
        case 'last_block_time': {
            updateLastBlockTime(data)
            break
        }
        case 'trans_pool_count': {
            updateTransPoolCount(data)
            break
        }
    }
}