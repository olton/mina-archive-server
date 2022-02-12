let currentPage = 1
let recordsOnPage = 50
let blockChainState = ['pending', 'canonical', 'orphaned']
let searchBlockString = null
let searchThreshold = 500

const updateEpoch = data => {
    const {height, epoch, slot, global_slot, epoch_start_block, blocks_produced} = data

    $("#epoch-number").html((+epoch).format(0, null, " ", "."))
    $("#epoch-current-height").html((+height).format(0, null, " ", "."))
    $("#epoch-start-block").html((+epoch_start_block).format(0, null, " ", "."))
    $("#epoch-blocks-produced").html((+blocks_produced).format(0, null, " ", "."))
    $("#epoch-slot").html((+slot).format(0, null, " ", "."))
    $("#epoch-global-slot").html((+global_slot).format(0, null, " ", "."))
}

const updateBlocksTable = data => {
    const {total = 0, canonical= 0, orphaned = 0, pending = 0} = data.totalBlocks || {}
    const eff = Number(canonical * 100 / total).toFixed(0)

    $("#total-blocks, #tab-blocks-count").html(Number(total).format(0, null, " ", "."))
    $("#eff-blocks").html(eff + "%")
    $("#canonical-blocks").html(Number(canonical).format(0, null, " ", "."))
    $("#orphaned-blocks").html(Number(orphaned).format(0, null, " ", "."))

    $("#found-blocks").html(Number(data.count).format(0, null, " ", "."))

    Metro.pagination({
        target: "#pagination",
        length: data.count,
        rows: recordsOnPage,
        current: currentPage
    })

    const target = $("#blocks-table tbody").clear()

    for(let row of data.blocks) {
        let tr = $("<tr>").appendTo(target)
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
    }

    $("#load-data-activity").hide()
    $("#pagination").removeClass("disabled")
}

const getBlocksRequest = () => {
    return {
        type: blockChainState,
        count: recordsOnPage,
        offset: recordsOnPage * (currentPage - 1),
        search: searchBlockString ? {
            block: isNaN(+searchBlockString) ? null : +searchBlockString,
            producer: isNaN(+searchBlockString) ? searchBlockString : null,
            hash: isNaN(+searchBlockString) ? searchBlockString : null,
        } : null
    }
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLastActivity = () => {
        if (!isOpen(ws)) return

        ws.send(JSON.stringify({channel: 'epoch'}))
        ws.send(JSON.stringify({channel: 'blocks', data: getBlocksRequest()}))
    }

    const requestZeroBlocks = () => {
        if (!isOpen(ws)) return

        $("#zero-blocks-table").addClass("disabled")
        ws.send(JSON.stringify({channel: 'zero_blocks', data: {type: blockZeroState, count: 1000000000, search: {coinbase: 0}}}))
    }

    switch(channel) {
        case 'welcome': {
            requestLastActivity()
            requestZeroBlocks()
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
        case 'epoch': {
            updateEpoch(data)
            break;
        }
        case 'zero_blocks': {
            updateZeroBlocksTable(data)
            break;
        }
    }
}

function blocksApplyRowsCount(selected){
    recordsOnPage = +selected[0]
    refreshBlocksTable()
}

function refreshBlocksTable(){
    if (globalThis.webSocket) {
        globalThis.webSocket.send(JSON.stringify({channel: 'blocks', data: getBlocksRequest()}))
    }
}

function blocksApplyFilter(el, state) {
    if (!el.checked) {
        Metro.utils.arrayDelete(blockChainState, state)
    } else {
        if (!blockChainState.includes(state)) blockChainState.push(state)
    }
    refreshBlocksTable()
}

$("#pagination").on("click", ".page-link", function(){
    $("#pagination").addClass("disabled")
    const val = $(this).data("page")
    if (val === 'next') {
        currentPage++
    } else if (val === 'prev') {
        currentPage--
    } else {
        currentPage = val
    }
    $("#load-data-activity").show()
    globalThis.webSocket.send(
        JSON.stringify({
            channel: 'blocks',
            data: {
                type: ['canonical', 'orphaned'],
                count: recordsOnPage,
                offset: recordsOnPage * (currentPage - 1)
            }
        })
    );
})

let block_search_input_interval = false

const flushBlockSearchInterval = () => {
    clearInterval(block_search_input_interval)
    block_search_input_interval = false
}

$("#blocks-search").on(Metro.events.inputchange, function(){
    searchBlockString = this.value.trim().toLowerCase()

    flushBlockSearchInterval()

    if (!block_search_input_interval) block_search_input_interval = setTimeout(function(){
        flushBlockSearchInterval()
        currentPage = 1
        refreshBlocksTable()
    }, searchThreshold)
})

//!--------------------- ZERO -------------------------------------------
let blockZeroState = ['pending', 'canonical', 'orphaned']

const updateZeroBlocksTable = data => {
    if (!data || !Array.isArray(data.blocks)) return

    $("#zero-found-blocks, #tab-zero-count").html(data.blocks.length)

    const rows = []

    for(let row of data.blocks) {
        rows.push([
            row.chain_status,
            row.height,
            row.creator_key,
            row.creator_name,
            row.coinbase,
            row.slot,
            row.global_slot,
            row.epoch,
            row.trans_count,
            row.trans_fee,
            row.state_hash,
            row.timestamp,
        ])
    }

    const table = Metro.getPlugin('#zero-blocks-table', 'table')
    table.setData({data: rows})
    $("#zero-blocks-table").removeClass("disabled")
}

function refreshZeroTable(){
    $("#zero-blocks-table").addClass("disabled")
    if (globalThis.webSocket) {
        globalThis.webSocket.send(JSON.stringify({channel: 'zero_blocks', data: {type: blockZeroState, count: 1000000000, search: {coinbase: 0}}}))
    }
}

function zeroApplyFilter(el, state) {
    if (!el.checked) {
        Metro.utils.arrayDelete(blockZeroState, state)
    } else {
        if (!blockZeroState.includes(state)) blockZeroState.push(state)
    }
    refreshZeroTable()
}

function zeroBlocksTableDrawCell(td, val, idx, head, row, table){
    const [chain_status, height, creator_key, creator_name, coinbase, slot, global_slot, epoch, trans_count, trans_fee, state_hash, timestamp] = row
    if (['global_slot', 'creator_name', 'timestamp', 'trans_fee'].includes(head.name)) {
        td.addClass("d-none")
    }
    if (head.name === 'chain_status') {
        td.html(`
            <span class="mif-stop ${chain_status === 'pending' ? 'fg-cyan' : chain_status === 'canonical' ? 'fg-green' : 'fg-red'}"></span>
        `)
    }
    if (head.name === 'height') {
        td.html(`
            <a class="link" href="/block/${state_hash}">${val}</a>
            <div class="text-muted text-small">${datetime(+timestamp).timeLapse()}</div>
        `)
    }
    if (head.name === 'creator_key') {
        td.html(`
            <a class="link" href="/address/${val}">${shorten(val, 12)}</a>
            <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${val}"></span>
            <div class="fg-violet text-small">${creator_name || ''}</div>
        `)
    }
    if (head.name === 'slot') {
        td.addClass("text-center").html(`
            <span>${val}</span>
            <div class="text-muted text-small">${global_slot}</div>
        `)
    }
    if (head.name === 'epoch') {
        td.addClass("text-center").html(`
            <span>${val}</span>
            <div class="text-muted text-small">epoch</div>
        `)
    }
    if (head.name === 'state_hash') {
        td.html(`
            <a class="link" href="/block/${val}">${shorten(val, 5)}</a>
            <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${val}"></span>
            <div class="text-muted text-small">${datetime(+timestamp).format(config.format.datetime)}</div>
        `)
    }
    if (head.name === 'trans') {
        td.addClass("text-center").html(`
            <span>${val}</span>
            <div class="text-muted text-small">${normMina(trans_fee)}</div>
        `)
    }
    if (head.name === 'coinbase') {
        td.addClass("text-center").html(`
            <span>${val}</span>
        `)
    }
}