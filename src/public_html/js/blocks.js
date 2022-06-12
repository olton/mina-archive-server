
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
                <a class="link" href="/block/${row.state_hash}">${row.height}</a>            
                <div class="text-muted text-small">${datetime(+row.timestamp).timeLapse()}</div>            
            </td>
            <td>
                <a class="link" href="/address/${row.creator_key}">${shorten(row.creator_key, 12)}</a>
                <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${row.creator_key}"></span>            
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
                <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${row.state_hash}"></span>
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

        request('epoch')
        request('blocks_timelapse', {len: 100})
        // ws.send(JSON.stringify({channel: 'epoch'}))
        // ws.send(JSON.stringify({channel: 'blocks_timelapse', data: {len: 100}}))

        refreshBlocksTable()
        refreshZeroTable()
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
        case 'zero_blocks': {
            updateZeroBlocksTable(data)
            break;
        }
        case 'blocks_timelapse': {
            drawTimelapseGraph(data)
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
        request('blocks', getBlocksRequest())
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
    refreshBlocksTable()
})

let block_search_input_interval = false

const flushBlockSearchInterval = () => {
    clearInterval(block_search_input_interval)
    block_search_input_interval = false
}

$("#blocks-search").on(Metro.events.inputchange, function(){
    searchBlockString = clearText(this.value.trim())

    flushBlockSearchInterval()

    if (!block_search_input_interval) block_search_input_interval = setTimeout(function(){
        flushBlockSearchInterval()
        currentPage = 1
        refreshBlocksTable()
    }, searchThreshold)
})



const drawTimelapseGraph = data => {
    if (!data || !data.length) return

    const points = []
    let index = 10, delta = 10, time = 0, maxY = 0, minY = 0
    let min = 60, max = 0, avg = 0

    for(let p of data.reverse()) {
        time = +p.timelapse/60000
        avg += time
        if (time > max) max = time
        if (time < min) min = time
        if (time > maxY) maxY = time
        points.push([index - delta, index, time])
        index += 10
    }

    avg /= data.length

    $("#btl-min").html(min)
    $("#btl-max").html(max)
    $("#btl-avg").html(avg.toFixed(2))
    $("#btl-count").html(data.length)

    $("#blocks-timelapse-graph").clear()
    chart.histogramChart("#blocks-timelapse-graph", [points], {
        ...histogramDefaultOptions,
        height: 45,
        boundaries: {
            maxY,
            minY
        },
        bars: [{
            name: "Blocks Timelapse",
            stroke: '#f3fcff',
            color: Metro.colors.toRGBA('#00AFF0', .5)
        }],
        legend: false
    })
}