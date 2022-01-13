
const updatePrice = (data) => {
    const {current_price, currency, last_updated, total_supply} = data

    $("#mina-price").html(current_price)
    $("#mina-price-currency").html(currency)
    $("#mina-price-update").html(datetime(last_updated).format("DD/MM/YYYY HH:mm"))
    $("#mina-total-supply").html(Math.round(total_supply).format(0, null, " ", "."))
}

const updateHeight = data => {
    const {height, epoch, slot, global_slot} = data

    $("#height").html(height.format(0, null, " ", "."))
    $("#epoch").html(epoch.format(0, null, " ", "."))
    $("#slot").html(slot.format(0, null, " ", "."))
    $("#global-slot").html(global_slot.format(0, null, " ", "."))
}

const updateStat = data => {
    const {total_producers, total_addresses, tr_applied, tr_failed, tr_total} = data

    $("#total-trans").html((+tr_total).format(0, null, " ", "."))
    $("#applied-trans").html((+tr_applied).format(0, null, " ", "."))
    $("#failed-trans").html((+tr_failed).format(0, null, " ", "."))
    $("#total-addresses").html((+total_addresses).format(0, null, " ", "."))
    $("#total-producers").html((+total_producers).format(0, null, " ", "."))
}

const fillBlocksTableRow = (type = 'canonical', r) => {
    return `
        <td class="text-center"><span class="mif-stop ${type === 'dispute' ? 'fg-cyan' : 'fg-green'}"></span></td>
        <td class="text-left">
            <div>
                <a class="link" href="/block/${r.height}">${r.height}</a>
                <div class="text-muted text-small mt-2-minus">${datetime(+r.timestamp).timeLapse()}</div>                        
            </div>                
        </td>
        <td>
            <div>
                <a class="link" href="/address/${r.creator_key}">${shorten(r.creator_key, 8)}</a>                    
            </div>                
            <div class="mt-2-minus">
                <a class="text-small text-muted no-decor" href="/address/${r.winner_key}">${shorten(r.winner_key, 10)}</a>                    
            </div>
        </td>
        <td class="text-center">
            <span class="enlarge-2">${r.coinbase/10**9}</span>
            <div class="text-small text-muted mt-2-minus">${r.snark_fee/10**9}</div>                                
        </td>
        <td class="text-center">
            <span class="enlarge-2">${r.slot}</span>
            <div class="text-small text-muted mt-2-minus">${r.global_slot}</div>                                
        </td>
        <td class="text-center">
            <span class="enlarge-2">${r.epoch}</span>
            <div class="text-small text-muted mt-2-minus">epoch</div>                                
        </td>
        <td class="text-center">
            <span class="enlarge-2">${r.tr_applied}</span>
            <div class="text-small text-muted mt-2-minus">${r.trans_fee / 10**9}</div>                                
        </td>
        <td>
            <div class="reduce-1">
                <a class="link" href="/block-hash/${r.state_hash}">${shorten(r.state_hash, 7)}</a>            
            </div>        
            <div class="text-small text-muted">${datetime(+r.timestamp).format("DD/MM/YYYY HH:mm")}</div>
        </td>
    `
}

const updateDispute = data => {
    const target = $("#dispute-blocks-table tbody")
    target.clear()
    for(let r of data) {
        target.append(
            $("<tr>").html(fillBlocksTableRow('dispute', r))
        )
    }
    $("#dispute-block-length").html(data.length)
}

const updateBlocks = data => {
    const target = $("#canonical-blocks-table tbody")
    target.clear()
    for(let r of data) {
        target.append(
            $("<tr>").html(fillBlocksTableRow('canonical', r))
        )
    }
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    switch(channel) {
        case 'welcome': log(data); break;
        case 'new_block': {
            updateHeight(data);
            ws.send(JSON.stringify({channel: 'stat'}));
            ws.send(JSON.stringify({channel: 'dispute'}));
            ws.send(JSON.stringify({channel: 'blocks', data: {type: 'canonical', count: 50}}));
            break;
        }
        case 'price': updatePrice(data); break;
        case 'stat': updateStat(data); break;
        case 'dispute': updateDispute(data); break;
        case 'blocks': updateBlocks(data); break;
    }
}