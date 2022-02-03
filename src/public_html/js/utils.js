
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

    for(let r of data) {
        let tr = $("<tr>")
        tr.html(`
            <td class="text-center"><span class="mif-stop ${r.chain_status === 'pending' ? 'fg-cyan' : r.chain_status === 'canonical' ? 'fg-green' : 'fg-red'}"></span></td>
            <td class="text-left">
                <div>
                    <a class="link" href="/block/${r.state_hash}">${r.height}</a>
                    <div class="text-muted text-small">${datetime(+r.timestamp).timeLapse()}</div>                        
                </div>                
            </td>
            <td>
                <div class="no-wrap">
                    <a class="link" href="/address/${r.creator_key}">${shorten(r.creator_key, 8)}</a>       
                    <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${r.creator_key}"></span>             
                </div>                
                <div class="text-small text-muted">
                    ${r.creator_name || 'Unknown'}                
                </div>
            </td>
            <td class="text-center">
                <span>${normMina(r.coinbase)}</span>
                <div class="text-small text-muted">${normMina(r.snark_fee)}</div>                                
            </td>
            <td class="text-center" style="width: 80px">
                <span>${r.slot}</span>
                <div class="text-small text-muted">${r.global_slot}</div>                                
            </td>
            <td class="text-center" style="width: 80px">
                <span>${r.epoch}</span>
                <div class="text-small text-muted">epoch</div>                                
            </td>
            <td class="text-center">
                <span>${r.tr_applied}</span>
                <div class="text-small text-muted">${r.trans_fee / 10**9}</div>                                
            </td>
            <td style="width: 200px">
                <div class="reduce-1 no-wrap">
                    <a class="link" href="/block/${r.state_hash}">${shorten(r.state_hash, 7)}</a>
                    <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${r.state_hash}"></span>            
                </div>        
                <div class="text-small text-muted">${datetime(+r.timestamp).format("DD/MM/YYYY HH:mm")}</div>
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
                    <span class="${t.type === 'payment' ? transIncoming ? 'bg-green' : 'bg-blue' : 'bg-pink'} fg-white pl-1 pr-1 reduce-4 text-upper">${t.type}</span>
                    ${+t.scam ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-4">SCAM!</span>' : ''}
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
                        ${datetime(+t.timestamp).format("DD/MM/YYYY HH:mm")}
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
            <td class="text-center">
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
                <div>
                    <div>
                        FROM: <a class="link" href="/address/${t.from}">${shorten(t.from, 7)}</a>
                        <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${t.from}"></span>
                    </div>
                    <div>
                        &nbsp;&nbsp;TO: <a class="link" href="/address/${t.to}">${shorten(t.to, 7)}</a>
                        <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${t.to}"></span>
                    </div>                                            
                </div>                
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
    if (head.name === 'chain_status') {
        td.clear().addClass("text-center").append(
            $("<span>").attr("title", val).addClass("mif-stop").addClass(val === 'pending' ? 'fg-cyan' : val === 'canonical' ? 'fg-green' : 'fg-red')
        )
    }
    if (head.name === 'timestamp') {
        td.clear().html(`${datetime(+val).format("DD/MM/YYYY HH:mm")}`)
    }
    if (head.name === 'height') {
        td.clear().addClass("text-center").append(
            $("<a>").addClass("link").attr("href", `/block/${row[3]}`).html(val)
        )
    }
    if (head.name === 'state_hash') {
        td.clear().append(
            $("<a>").addClass("link").attr("href", `/block/${val}`).html(shorten(val, 12))
        )
    }
    if (head.name === 'coinbase') {
        td.addClass("text-center").html(`${normMina(val)}`)
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
                ${+row[16] ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-4">SCAM!</span>' : ''}
            </div>
            <a class="link" href="/transaction/${val}">${shorten(val, 7)}</a>
            <div class="text-small text-muted">${row[12]}</div>
        `)
    }
    if (head.name === 'agent') {
        td.html(`<a class="link" href="/address/${val}">${shorten(val, 7)}</a>`)
    }
    if (head.name === 'height') {
        td.addClass('text-center').html(`
            <a class="link" href="/block/${row[10]}">${val}</a>
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

function addressTableDrawCell(td, val, idx, head, row, table){
    if (idx === 0) {
        td.html(`
            <a class="link ml-2" href="/address/${val}">${shorten(val, 12)}</a>
        `)
    }
    if (idx === 1 || idx === 2) {
        td.html(`
            ${normMina(val)}
        `)
    }
}

function topStackHoldersTableDrawCell(td, val, idx, head, row, table){
    if (idx === 0) {
        td.html(`
            <a class="link ml-2" href="/address/${val}">${shorten(val, 7)}</a>
        `)
    }
    if (idx === 1 || idx === 2) {
        td.html(`
            ${Number(normMina(val).toFixed(0)).format(0, null, " ", ".")}
        `).addClass('text-right')
    }
}

function lastBlockWinnersTableDrawCell(td, val, idx, head, row, table){
    if (idx === 0) {
        td.html(`
            <a class="link ml-2" href="/address/${val}">${shorten(val, 7)}</a>
        `)
    }
    if (idx === 2) {
        td.html(`
            ${Number(normMina(val).toFixed(0)).format(0, null, " ", ".")}
        `).addClass('text-right')
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

