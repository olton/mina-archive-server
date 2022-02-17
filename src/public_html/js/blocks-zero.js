
let currentPageZero = 1
let recordsOnPageZero = 50
let searchZeroString = null
let blockZeroState = ['pending', 'canonical', 'orphaned']

const getZeroBlocksRequest = () => {
    return {
        type: blockZeroState,
        count: recordsOnPageZero,
        offset: recordsOnPageZero * (currentPageZero - 1),
        search: {
            block: isNaN(+searchZeroString) ? null : +searchZeroString,
            producer: isNaN(+searchZeroString) ? searchZeroString : null,
            hash: isNaN(+searchZeroString) ? searchZeroString : null,
            coinbase: 0
        }
    }
}

function refreshZeroTable(){
    $("#zero-blocks-table").addClass("disabled")
    if (globalThis.webSocket) {
        globalThis.webSocket.send(JSON.stringify({channel: 'zero_blocks', data: getZeroBlocksRequest()}))
    }
}

function blocksZeroApplyRowsCount(selected){
    recordsOnPageZero = +selected[0]
    refreshZeroTable()
}

function zeroApplyFilter(el, state) {
    if (!el.checked) {
        Metro.utils.arrayDelete(blockZeroState, state)
    } else {
        if (!blockZeroState.includes(state)) blockZeroState.push(state)
    }
    refreshZeroTable()
}

$("#pagination-zero").on("click", ".page-link", function(){
    $("#pagination").addClass("disabled")
    const val = $(this).data("page")
    if (val === 'next') {
        currentPage++
    } else if (val === 'prev') {
        currentPage--
    } else {
        currentPage = val
    }
    $("#load-zero").show()
    refreshZeroTable()
})

let zero_search_input_interval = false

const flushZeroBlockSearchInterval = () => {
    clearInterval(zero_search_input_interval)
    zero_search_input_interval = false
}

$("#zero-blocks-search").on(Metro.events.inputchange, function(){
    searchZeroString = clearText(this.value.trim())

    flushBlockSearchInterval()

    if (!zero_search_input_interval) zero_search_input_interval = setTimeout(function(){
        flushZeroBlockSearchInterval()
        currentPageZero = 1
        refreshZeroTable()
    }, searchThreshold)
})

const updateZeroBlocksTable = data => {
    $("#zero-found-blocks, #tab-zero-count").html(num2fmt(data.count))

    Metro.pagination({
        target: "#pagination-zero",
        length: data.count,
        rows: recordsOnPage,
        current: currentPage
    })

    const target = $("#zero-blocks-table tbody").clear()

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

    $("#load-zero").hide()
    $("#pagination-zero").removeClass("disabled")
    $("#zero-blocks-table").removeClass("disabled")
}

