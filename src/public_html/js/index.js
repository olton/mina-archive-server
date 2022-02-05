let intervalBlocksData

const updateTransPoolCount = data => {
    $("#pool-trans").html(data)
}

const updatePrice = (data) => {
    if (!data) return

    const {current_price, currency, last_updated, total_supply} = data

    $("#mina-price").html(current_price)
    $("#mina-price-currency").html(currency)
    $("#mina-price-update").html(datetime(last_updated).format("DD/MM/YYYY HH:mm"))
    $("#mina-total-supply").html(Math.round(total_supply).format(0, null, " ", "."))
}

const updateHeight = data => {
    if (!data) return

    const {height, epoch, slot, global_slot} = data

    $("#height").html((+height).format(0, null, " ", "."))
    $("#epoch").html((+epoch).format(0, null, " ", "."))
    $("#slot").html((+slot).format(0, null, " ", "."))
    $("#global-slot").html((+global_slot).format(0, null, " ", "."))
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
    const rows = drawBlocksTable(data, 'dispute')
    rows.map( r => target.append(r) )
    $("#dispute-block-length").html(rows.length)
}

const updateBlocks = data => {
    if (!data) return

    const target = $("#canonical-blocks-table tbody").clear()
    const rows = drawBlocksTable(data, 'canonical')
    rows.map( r => target.append(r) )
    $("#canonical-block-length").html(rows.length)
}

const updateLastBlockTime = data => {
    if (!data) return

    $("#last-block-time").html(`${datetime(+data).timeLapse()}`)
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestPeriodically = () => {
        ws.send(JSON.stringify({channel: 'trans_pool_count'}))
        ws.send(JSON.stringify({channel: 'price'}))
        ws.send(JSON.stringify({channel: 'stat'}))

        setTimeout(requestPeriodically, 60000)
    }

    const requestChain = () => {
        ws.send(JSON.stringify({channel: 'last_block_time'}))
        ws.send(JSON.stringify({channel: 'dispute'}))
        ws.send(JSON.stringify({channel: 'lastChain'}))
        ws.send(JSON.stringify({channel: 'epoch'}))
    }

    switch(channel) {
        case 'welcome': {
            requestChain()
            requestPeriodically()
            break;
        }
        case 'new_block': {
            requestChain()
            break;
        }
        case 'epoch': updateHeight(data); break;
        case 'price': updatePrice(data); break;
        case 'stat': updateStat(data); break;
        case 'dispute': updateDispute(data); break;
        case 'lastChain': updateBlocks(data); break;
        case 'last_block_time': updateLastBlockTime(data); break;
        case 'trans_pool_count': updateTransPoolCount(data); break;
    }
}