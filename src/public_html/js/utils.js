
const shorten = (v, l = 5) => !v ? v : `${v.substring(0, l) + '...' + v.substring(v.length - l)}`

const link = (text, href, cls) => `<a class="${cls}" href="${href}">${text}</a>`

const copy2clipboard = (text) => {
    // navigator.clipboard.writeText(text)
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
}

$("body").on("click", " .copy-data-to-clipboard", function() {
    copy2clipboard($(this).attr("data-value"));
    Metro.toast.create("Data copied to clipboard!")
})

const exp2dec = (exponentialNumber) => {
    const str = exponentialNumber.toString();
    if (str.indexOf('e') !== -1) {
        const exponent = parseInt(str.split('-')[1], 10);
        return exponentialNumber.toFixed(exponent);
    } else {
        return exponentialNumber;
    }
}

const normMina = (nano = 0, type = "number") => {
    let [_temp1, _temp2] = (nano / 10**9).toFixed(9).toString().split(".")
    let result = [_temp1?_temp1:0, _temp2?_temp2:0]

    switch (type.toLowerCase()) {
        case "array": return result
        case "string": return result.join(".")
        default: return exp2dec(+(result.join(".")))
    }
}

const drawBlocksTable = (data) => {
    let rows = []

    for(let row of data) {
        const [chain_status, height, timestamp, state_hash, coinbase, slots, epoch, trans] = row
        const [global_slot, slot] = slots.split(":")

        let tr = $("<tr>")
        tr.html(`
            <td class="text-center"><span class="mif-stop ${chain_status === 'pending' ? 'fg-cyan' : chain_status === 'canonical' ? 'fg-green' : 'fg-red'}"></span></td>
            <td class="text-left">
                <div>
                    <a class="link" href="/block/${state_hash}">${height}</a>
                    <div class="text-muted text-small">${datetime(+timestamp).timeLapse()}</div>                        
                </div>                
            </td>
            <td style="width: 200px">
                <div class="reduce-1 no-wrap">
                    <a class="link" href="/block/${state_hash}">${shorten(state_hash, 12)}</a>
                    <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${state_hash}"></span>            
                </div>        
                <div class="text-small text-muted">${datetime(+timestamp).format(config.format.datetime)}</div>
            </td>
            <td class="text-center">
                <span>${normMina(coinbase)}</span>
            </td>
            <td class="text-center" style="width: 80px">
                <span>${slot}</span>
                <div class="text-small text-muted">${global_slot}</div>                                
            </td>
            <td class="text-center" style="width: 80px">
                <span>${epoch}</span>
                <div class="text-small text-muted">epoch</div>                                
            </td>
            <td class="text-center">
                <span>${trans}</span>
            </td>
        `)

        rows.push(tr)
    }

    return rows
}

const drawTransTable = (data, address, noDir = false) => {
    let rows = []

    for(let t of data) {
        let transIncoming = t.trans_owner !== address
        let transDir = transIncoming ? "mif-arrow-down fg-lightViolet" : "mif-arrow-up fg-blue"
        let transStatus = t.status === 'applied' ? "mif-checkmark fg-green" : "mif-blocked fg-red"
        let tr = $("<tr>")
        tr.html(`
            <td class="text-center"><span class="${noDir ? "mif-import-export" : transDir}"></span></td>
            <td class="text-center"><span class="${transStatus}"></span></td>
            <td class="">
                <div style="line-height: 1">
                    <span class="${t.type === 'payment' ? transIncoming ? 'bg-lightViolet' : 'bg-blue' : 'bg-pink'} fg-white pl-1 pr-1 reduce-4 text-upper">${t.type}</span>
                    ${t.type === 'payment' && +t.scam && +t.amount > 0 ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-4">SCAM</span>' : ''}
                    ${t.type === 'payment' && +t.scam && +t.amount == 0 ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-4">SPAM</span>' : ''}
                </div>
                <div style="line-height: 1" class="no-wrap">
                    <a class="link" href="/transaction/${t.hash}">${shorten(t.hash, 7)}</a>        
                    <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${t.hash}"></span>                
                </div>                
                <div style="line-height: 1">
                    <div class="text-muted text-small">                        
                        ${t.status === 'failed' ? '<span class="bg-red fg-white pl-1 pr-1 reduce-1">'+t.failure_reason+'</span>' : ''}
                    </div>
                    <div class="text-small text-muted">
                        ${datetime(+t.timestamp).format(config.format.datetime)}
                    </div>
                </div>                
            </td>
            <td class="text-center">
                <span>
                    <a class="link" href="/block/${t.state_hash}">${t.height}</a>
                </span>
            </td>
            <td class="text-center">
                <span>${t.nonce}</span>
            </td>
            <td class="text-center">
                <div>
                    <div class="no-wrap ${address && transIncoming ? '' : 'd-none'}">
                        <a class="link" href="/address/${t.trans_owner}" data-hint-offset="10" data-hint-hide="10000" data-role="hint" data-hint-text="${t.trans_owner_name || 'Unknown'}" data-hint-position="left">${shorten(t.trans_owner, 7)}</a>
                        <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${t.trans_owner}"></span>
                    </div>
                    <div class="no-wrap ${address && transIncoming ? 'd-none' : ''}">
                        <a class="link" href="/address/${t.trans_receiver}" data-hint-offset="10" data-hint-hide="10000" data-role="hint" data-hint-text="${t.trans_receiver_name || 'Unknown'}" data-hint-position="left">${shorten(t.trans_receiver, 7)}</a>
                        <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${t.trans_receiver}"></span>
                    </div>                             
                    <div class="text-muted text-small">
                        ${t.memo}                                            
                    </div>               
                </div>                
            </td>
            <td class="text-right">
                <div>
                    <span class="">${normMina(+t.amount)}</span>
                    <div class="text-muted text-small">${normMina(+t.fee)}</div>                        
                </div>                
            </td>
            <td class="text-center">
                <div>
                    <span class="">${t.confirmation}</span>
                </div>                
            </td>
        `)
        rows.push(tr)
    }

    return rows
}

function blockTransDrawCell(td, val, idx, head, row, table){
    if (['type', 'timestamp', 'trans_receiver', 'fee', 'memo', 'scam'].includes(head.name)) {
        td.addClass("d-none")
    }
    if (head.name === 'status') {
        td.addClass("text-center").html(`
            <span class="${val === 'applied' ? 'fg-green mif-checkmark' : 'fg-red mif-blocked'}"></span>
        `)
    }
    if (head.name === 'hash') {
        td.html(`
            <div class="text-small">
                <span class="${row[1] === 'payment' ? 'bg-blue' : 'bg-pink'} fg-white pl-1 pr-1 reduce-3 text-upper">${row[1]}</span>
                ${row[11] && +(row[8]) > 0 ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-3">SCAM</span>' : ''}
                ${row[11] && +(row[8]) == 0 ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-3">SPAM</span>' : ''}
            </div>
            <a class="link" href="/transaction/${val}">${shorten(val, 12)}</a>
            <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${val}"></span>
            <div class="text-small text-muted">
                ${row[10]}
            </div>
        `)
    }
    if (head.name === 'trans_owner') {
        td.html(`
            <div class="row">
                <div class="mr-2">
                    <span class="ml-2 mt-2 mif-move-down mif-2x"></span>                
                </div>
                <div>
                    <div>
                        <a class="link" href="/address/${val}">${shorten(val, 12)}</a>
                        <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${val}"></span>
                    </div>
                    <div>
                        <a class="link" href="/address/${row[6]}">${shorten(row[6], 12)}</a>
                        <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${row[6]}"></span>
                    </div>                                    
                </div>            
            </div>
        `)
    }
    if (head.name === 'amount') {
        td.addClass("text-right").html(`
            <span>${normMina(val)}</span>
            <div class="text-muted text-small">
                ${normMina(row[8])}            
            </div>
        `)
    }
    if (head.name === 'confirmation') {
        td.addClass("text-center").html(`
            <span>${val}</span>
        `)
    }
}

const drawTransPoolTable = (data) => {
    let rows = []

    for(let t of data) {
        let tr = $("<tr>")
        tr.html(`
            <td class="text-center"><span class="mif-arrow-up fg-cyan"></span></td>
            <td class="text-center"><span class="mif-alarm fg-orange"></span></td>
            <td class="text-center">
                <span>${shorten(t.id, 7)}</span>
                <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy ID to clipboard" data-value="${t.id}"></span>
            </td>
            <td class="text-center">
                <span>${t.nonce}</span>
            </td>
            <td class="text-center">
                <div>
                    <span>
                        <a class="link" href="/transaction/${t.hash}">${shorten(t.hash, 7)}</a>                        
                    </span>
                    <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${t.hash}"></span>
                    <div class="text-muted text-small">${t.kind.toLowerCase() === 'payment' ? t.memo : '<span class="bg-pink fg-white reduce-1 pl-1 pr-1">'+t.type+'</span>'}</div>
                </div>                
            </td>
            <td class="text-center">
                <a class="link" href="/address/${t.to}">${shorten(t.to, 7)}</a>
                <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${t.to}"></span>
            </td>
            <td class="text-center">
                <div>
                    <span class="">${(t.amount/10**9)}</span>
                    <div class="text-muted text-small">${(t.fee/10**9)}</div>                        
                </div>                
            </td>
        `)
        rows.push(tr)
    }

    return rows
}

function addressBlocksTableDrawCell(td, val, idx, head, row, table){
    const [chain_status, height, timestamp, state_hash, coinbase, slot, epoch, trans] = row
    if (head.name === 'chain_status') {
        td.clear().addClass("text-center").append(
            $("<span>").attr("title", val).addClass("mif-stop").addClass(val === 'pending' ? 'fg-cyan' : val === 'canonical' ? 'fg-green' : 'fg-red')
        )
    }
    if (head.name === 'timestamp') {
        td.addClass("d-none")
    }
    if (head.name === 'height') {
        td.html(`
            <a class="link" href="/block/${state_hash}">${val}</a>
            <div class="text-small text-muted">${datetime(+timestamp).timeLapse()}</div>
        `)
    }
    if (head.name === 'state_hash') {
        td.html(`
            <a class="link" href="/block/${val}">${shorten(val, 12)}</a>
            <div class="text-small text-muted">${datetime(+timestamp).format(config.format.datetime)}</div>
        `)
    }
    if (head.name === 'coinbase') {
        td.addClass("text-center").html(`
            ${normMina(val)}
            <div class="text-small text-muted">${normMina(val) === 720 ? "norm" : "super"}</div>
        `)
    }
    if (head.name === 'epoch' || head.name === 'trans_count') {
        td.addClass("text-center").html(`${val}`)
    }
    if (head.name === 'slot') {
        let [global, slot] = val.split(":")
        td.addClass("text-center").html(`
            <span>${global}</span>
            <div class="text-small text-muted">
                <span>${slot}</span>
            </div>
        `)
    }
}

function addressTransTableDrawCell(td, val, idx, head, row, table){
    if (['type', 'agent_name', 'timestamp', 'state_hash', 'memo', 'fee', 'epoch', 'global_slot', 'slot', 'scam'].includes(head.name)) {
        td.addClass("d-none")
    }
    if (head.name === 'dir') {
        td.html(`<span class="${val === 'in' ? 'mif-arrow-down fg-lightViolet' : 'mif-arrow-up fg-blue'}"></span>`)
    }
    if (head.name === 'status') {
        td.html(`<span class="${val === 'applied' ? 'mif-checkmark fg-green' : 'mif-blocked fg-red'}"></span>`)
    }
    if (head.name === 'hash') {
        td.html(`
            <div class="text-small">
                <span class="${row[0] === 'payment' ? 'bg-blue' : 'bg-pink'} fg-white pl-1 pr-1 reduce-4 text-upper">${row[0]}</span>
                ${row[0] === 'payment' && row[16] ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-4">SCAM</span>' : ''}
            </div>
            <a class="link" href="/transaction/${val}">${shorten(val, 7)}</a>
            <div class="text-small text-muted">${datetime(+row[3]).format(config.format.datetime)}</div>
        `)
    }
    if (head.name === 'agent') {
        td.html(`
            <a class="link" href="/address/${val}">${shorten(val, 7)}</a>
            <div class="text-small text-muted">${row[12]}</div>
        `)
    }
    if (head.name === 'height') {
        td.addClass('text-center').html(`
            <a class="link" href="/block/${row[11]}">${val}</a>
            <div class="text-small text-muted" title="Epoch/Slot in">
                <span class="text-bold">${row[13]}/${row[15]}</span>            
            </div>
        `)
    }
    if (head.name === 'amount') {
        td.addClass("text-right").html(`
            ${normMina(val)}
            <div class="text-muted text-small">${normMina(row[9])}</div>
        `)
    }
    if (head.name === 'nonce' || head.name === 'confirmation') {
        td.addClass("text-center").html(`${val}`)
    }
}

function addressDelegationsTableDrawCell(td, val, idx, head, row, table){
    if (head.name === 'name') {
        td.addClass("d-none")
    }
    if (head.name === 'stack_holder') {
        td.html(`
            ${val === 1 ? '<span title="Stack Holder" class="text-small radius success p-1">SH</span>' : ''}
        `)
    }
    if (head.name === 'ledger_balance') {
        td.addClass("text-right").html(`${normMina(val)}`)
    }
    if (head.name === 'public_key') {
        td.html(`
            <a class="link" href="/address/${val}">${shorten(val, 12)}</a>
            <div class="text-small">${row[2] || ""}</div>
        `)
    }
}

function searchInBlockchain(val) {
    const _val = val.trim()

    if (!_val) {
        Metro.toast.create("Please define a search request!")
        return
    }

    window.location.href = `/search?q=${_val}`
}

