const updateEpoch = data => {

}

const updateBlockInfo = data => {
    const tags = $("#block-tags").clear()
    tags.append(
        $("<span>").addClass(data.chain_status === 'pending' ? 'bg-cyan' : data.chain_status === 'canonical' ? 'bg-green' : 'bg-red').addClass("radius reduce-4 badge inline fg-white text-upper").html(`${data.chain_status}`)
    )


    $("#block-height").html(Number(data.height).format(0, null, " ", "."))
    $("#epoch").html(Number(data.epoch).format(0, null, " ", "."))
    $("#slot").html(Number(data.slot).format(0, null, " ", "."))
    $("#global-slot").html(Number(data.global_slot).format(0, null, " ", "."))

    const [blockDate, blockTime] = datetime(+data.timestamp).format("DD/MM/YYYY HH:mm").split(" ")
    $("#block-date").html(`
        <span>${blockDate}</span>
        <span class="reduce-4">${blockTime}</span>
`   )


    let blockColor
    switch (data.chain_status.toLowerCase()) {
        case 'canonical': blockColor = 'fg-green'; break;
        case 'orphaned': blockColor = 'fg-red'; break;
        default: blockColor = 'fg-cyan'
    }
    // $("#block-hash").addClass(blockColor)
    $("#chain-status").html(Cake.capitalize(data.chain_status)).removeClassBy("fg-").addClass(blockColor)

    $("#trans_count").html(`
        <span class="">
            ${data.trans_count}
        </span>
        <span class="reduce-4 text-bold ml-auto">
            <span class="fg-green" title="Applied">${data.tr_applied}</span>
            <span class="text-light">/</span>
            <span class="fg-red" title="Failed">${data.tr_failed}</span>
        </span>
    `)
    $("#trans-fee").html(`
        <span class="text-bold">${normMina(data.trans_fee)}</span>
    `)

    $("#snarks_count").html(`${data.snarks_count}`)
    $("#snarks-fee").html(`
        <span class="text-bold">${normMina(data.snarks_fee)}</span>
    `)

    $("#block-producer").html(`
        <a class="link" href="/address/${data.creator_key}">${shorten(data.creator_key, 10)}</a>
        <div class="text-small text-muted">${data.creator_name || ''}</div>
    `)
    $("#coinbase-receiver").html(`
        <a class="link" href="/address/${data.coinbase_receiver_key}">${shorten(data.coinbase_receiver_key, 10)}</a>
        <div class="text-small text-muted">${data.coinbase_receiver_name || ''}</div>
    `)
    $("#block-winner").html(`
        <a class="link" href="/address/${data.winner_key}">${shorten(data.winner_key, 10)}</a>
        <div class="text-small text-muted">${data.winner_name || ''}</div>
    `)

}

const updateBlockTransactions = data => {
    if (!data || !Array.isArray(data)) return

    const target = $("#block-trans tbody").clear()
    const rows = drawTransTable(data, "", true)
    if (rows.length) {
        rows.map(r => target.append(r))
    } else {
        target.html(`
            <tr>
                <td colspan="7">
                    <div class="m-4 text-center">Nothing to show</div>                
                </td>
            </tr>            
        `)
    }
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestData = () => {
        ws.send(JSON.stringify({channel: 'epoch'}));
        ws.send(JSON.stringify({channel: 'block', data: blockHash}));
        ws.send(JSON.stringify({channel: 'block_trans', data: blockHash}));
    }

    switch(channel) {
        case 'welcome': {
            requestData()
            break;
        }
        case 'new_block': {
            requestData()
            break;
        }
        case 'epoch': {
            updateEpoch(data)
            break;
        }
        case 'block': {
            updateBlockInfo(data)
            break;
        }
        case 'block_trans': {
            updateBlockTransactions(data)
            break;
        }
    }
}
