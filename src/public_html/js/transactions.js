let currentPage = 1
let recordsOnPage = 50
let chainStatus = ['applied', 'failed']
let chainType = ['payment', 'delegation']
let searchString = ""
let searchThreshold = 500

const updateTransStat = data => {
    console.log(data)
    const {tr_total = 0, tr_applied = 0, tr_failed = 0, pool = 0} = data || {}
    $("#trans-total").html((+tr_total).format(0, null, " ", "."))
    $("#trans-applied").html((+tr_applied).format(0, null, " ", "."))
    $("#trans-failed").html((+tr_failed).format(0, null, " ", "."))
    $("#trans-pool").html((+pool).format(0, null, " ", "."))
}

const updateTransTable = data => {
    $("#found-transactions").html(Number(data.count).format(0, null, " ", "."))

    Metro.pagination({
        target: "#pagination",
        length: data.count,
        rows: recordsOnPage,
        current: currentPage
    })

    const target = $("#trans-table tbody").clear()

    for(let t of data.transactions) {
        let tr = $("<tr>").appendTo(target)
        tr.html(`
            <td class="text-center">
                <span class="${t.status === 'applied' ? 'mif-checkmark fg-green' : 'mif-bocked fg-red'}"></span>            
            </td>
            <td>
                <div style="line-height: 1">
                    <span class="${t.type === 'payment' ? 'bg-blue' : 'bg-pink'} fg-white pl-1 pr-1 reduce-4 text-upper">${t.type}</span>
                    ${t.type === 'payment' && +t.scam && +t.amount > 0 ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-4">SCAM</span>' : ''}
                    ${t.type === 'payment' && +t.scam && +t.amount == 0 ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-4">SPAM</span>' : ''}
                </div>
                <a class="link" href="/transaction/${t.hash}">${shorten(t.hash, 12)}</a><span class="ml-2 text-small text-muted" title="Nonce">[${t.nonce}]</span>                
                <div class="text-small text-muted">
                    <span>${datetime(+t.timestamp).format(config.format.datetime)}</span>
                </div>      
                <div class="text-small text-muted">
                    ${t.memo ? "<span class='reduce-2 bg-darkGray fg-white pl-1 pr-1 mr-1'>MEMO:</span>" + t.memo : ""}
                </div>                               
            </td>
            <td>
                <span>${t.height}</span>            
                <div class="text-small text-muted">
                    <span>${datetime(+t.timestamp).timeLapse()}</span>
                </div>      
            </td>
            <td>
                <div class="row">
                    <div class="mr-2">
                        <span class="ml-2 mt-2 mif-move-down mif-2x"></span>                
                    </div>
                    <div>
                        <div>
                            <a data-role="hint" data-hint-text="${t.trans_owner_name || 'Unknown'}" class="link" href="/address/${t.trans_owner}">${shorten(t.trans_owner, 12)}</a>
                            <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${t.trans_owner}"></span>
                            <div class="text-muted text-small">${t.trans_owner_name || ''}</div>
                        </div>
                        <div>
                            <a data-role="hint" data-hint-text="${t.trans_receiver_name || 'Unknown'}" class="link" href="/address/${t.trans_receiver}">${shorten(t.trans_receiver, 12)}</a>
                            <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${t.trans_receiver}"></span>
                            <div class="text-muted text-small">${t.trans_receiver_name || ''}</div>
                        </div>     
                    </div>            
                </div>
            </td>
            <td class="text-right">
                <span>${normMina(t.amount)}</span>            
                <div class="text-small text-muted">
                    <span>${normMina(t.fee)}</span>
                </div>      
            </td>
            <td class="text-center">
                <span>${t.confirmation}</span>            
            </td>
        `)
    }

    $("#pagination").removeClass("disabled")
    $("#trans-table").removeClass("disabled")
}

const getRequestData = () => {

    const isTransHash = searchString.substring(0, 2) === "Ckp"
    const isBlockHash = searchString.substring(0, 2) === "3N"
    const isBlockNumb = !isNaN(+searchString)

    return {
        type: chainType,
        status: chainStatus,
        count: recordsOnPage,
        offset: recordsOnPage * (currentPage - 1),
        search: searchString ? {
            block: isBlockNumb ? +searchString : null,
            block_hash: isBlockHash ? searchString : null,
            hash: isTransHash ? searchString : null,
            participant: !isBlockNumb && !isTransHash && !isBlockHash ? searchString : null
        } : null
    }
}

function refreshTransTable(){
    $("#trans-table").addClass("disabled")
    if (globalThis.webSocket) {
        globalThis.webSocket.send(JSON.stringify({channel: 'transactions', data: getRequestData()}))
    }
}

function applyRowsCount(selected){
    recordsOnPage = +selected[0]
    refreshTransTable()
}

function applyFilter(el, state) {
    const [filter, value] = state.split(":")

    if (!el.checked) {
        if (filter === 'type') {
            Metro.utils.arrayDelete(chainType, value)
        } else {
            Metro.utils.arrayDelete(chainStatus, value)
        }
    } else {
        if (filter === 'type') {
            if (!chainType.includes(state)) chainType.push(value)
        } else {
            if (!chainStatus.includes(state)) chainStatus.push(value)
        }
    }

    refreshTransTable()
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
    refreshTransTable()
})

let trans_search_input_interval = false

const flushTransSearchInterval = () => {
    clearInterval(trans_search_input_interval)
    trans_search_input_interval = false
}

$("#transactions-search").on(Metro.events.inputchange, function(){
    searchString = this.value.trim().toLowerCase()

    flushTransSearchInterval()

    if (!trans_search_input_interval) trans_search_input_interval = setTimeout(function(){
        flushTransSearchInterval()
        currentPage = 1
        console.log(getRequestData())
        refreshTransTable()
    }, searchThreshold)
})

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLastActivity = () => {
        if (!isOpen(ws)) return

        ws.send(JSON.stringify({channel: 'epoch'}))
        ws.send(JSON.stringify({channel: 'trans_stat'}))
        ws.send(JSON.stringify({channel: 'transactions', data: getRequestData()}))
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
        case 'epoch': {
            updateEpoch(data)
            break;
        }
        case 'transactions': {
            updateTransTable(data)
            break;
        }
        case 'trans_stat': {
            updateTransStat(data)
            break;
        }
    }
}
