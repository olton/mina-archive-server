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
    $("#total-blocks").html(Number(data.totalBlocks.total).format(0, null, " ", "."))
    $("#pending-blocks").html(Number(data.totalBlocks.pending).format(0, null, " ", "."))
    $("#canonical-blocks").html(Number(data.totalBlocks.canonical).format(0, null, " ", "."))
    $("#orphaned-blocks").html(Number(data.totalBlocks.orphaned).format(0, null, " ", "."))
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
        ws.send(JSON.stringify({channel: 'epoch'}))
        ws.send(JSON.stringify({channel: 'blocks', data: getBlocksRequest()}))
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
        case 'blocks': {
            updateBlocksTable(data)
            break;
        }
        case 'epoch': {
            updateEpoch(data)
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
    clearInterval(block_search_input_interval);
    block_search_input_interval = false;
}

$("#blocks-search").on(Metro.events.inputchange, function(){
    searchBlockString = this.value.trim().toLowerCase();

    flushBlockSearchInterval()

    if (!block_search_input_interval) block_search_input_interval = setTimeout(function(){
        console.log(searchBlockString)
        flushBlockSearchInterval()
        currentPage = 1;
        refreshBlocksTable()
    }, searchThreshold);
});