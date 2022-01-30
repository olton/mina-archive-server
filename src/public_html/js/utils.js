
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
                <div>
                    <a class="link" href="/address/${r.creator_key}">${shorten(r.creator_key, 8)}</a>       
                    <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${r.creator_key}"></span>             
                </div>                
                <div class="text-small text-muted">
                    ${r.creator_name || 'Unknown'}                
                </div>
            </td>
            <td>
                <div>
                    <a class="link" href="/address/${r.coinbase_receiver_key}">${shorten(r.coinbase_receiver_key, 8)}</a>         
                    <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${r.coinbase_receiver_key}"></span>           
                </div>                
                <div>
                    <a class="text-small text-muted no-decor" href="/address/${r.winner_key}">${shorten(r.winner_key, 10)}</a>                    
                </div>
            </td>
            <td class="text-center">
                <span>${normMina(r.coinbase)}</span>
                <div class="text-small text-muted">${normMina(r.snark_fee)}</div>                                
            </td>
            <td class="text-center d-none-fs d-table-cell-lg" style="width: 80px">
                <span>${r.slot}</span>
                <div class="text-small text-muted">${r.global_slot}</div>                                
            </td>
            <td class="text-center d-none-fs d-table-cell-lg" style="width: 80px">
                <span>${r.epoch}</span>
                <div class="text-small text-muted">epoch</div>                                
            </td>
            <td class="text-center">
                <span>${r.tr_applied}</span>
                <div class="text-small text-muted">${r.trans_fee / 10**9}</div>                                
            </td>
            <td class="d-none-fs d-table-cell-md" style="width: 200px">
                <div class="reduce-1">
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
        let transDir = transIncoming ? "mif-arrow-down fg-green" : "mif-arrow-up fg-orange"
        let transStatus = t.status === 'applied' ? "mif-checkmark fg-green" : "mif-blocked fg-red"
        let tr = $("<tr>")
        tr.html(`
            <td class="text-center"><span class="${noDir ? "mif-import-export" : transDir}"></span></td>
            <td class="text-center"><span class="${transStatus}"></span></td>
            <td class="text-center" style="width: 160px">
                <div class="table-time">${datetime(+t.timestamp).format("DD/MM/YYYY HH:mm")}</div>
            </td>
            <td class="text-center">
                <span>
                    <a class="link" href="/block/${t.state_hash}">${t.height}</a>
                </span>
            </td>
            <td class="text-center">
                <span>${t.nonce}</span>
                <div class="text-muted text-small">
                        ${+t.scam ? '<span class="bg-red fg-white pl-1 pr-1 reduce-1">SCAM!</span>' : ''}                
                </div>
            </td>
            <td class="text-center">
                <div>
                    <span>
                        <a class="link" href="/transaction/${t.hash}">${shorten(t.hash, 7)}</a>        
                        <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${t.hash}"></span>                
                    </span>
                    <div class="text-muted text-small">
                        ${t.type === 'payment' ? t.memo : '<span class="bg-pink fg-white pl-1 pr-1 reduce-1">'+t.type+'</span>'}
                        ${t.status === 'failed' ? '<span class="bg-red fg-white pl-1 pr-1 reduce-1">'+t.failure_reason+'</span>' : ''}
                    </div>
                </div>                
            </td>
            <td class="text-center">
                <div>
                    <div class="${address && transIncoming ? '' : 'd-none'}">
                        <a class="link" href="/address/${t.trans_owner}" data-hint-offset="10" data-hint-hide="10000" data-role="hint" data-hint-text="${t.trans_owner_name || 'Unknown'}" data-hint-position="left">${shorten(t.trans_owner, 7)}</a>
                        <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${t.trans_owner}"></span>
                    </div>
                    <div class="${address && transIncoming ? 'd-none' : ''}">
                        <a class="link" href="/address/${t.trans_receiver}" data-hint-offset="10" data-hint-hide="10000" data-role="hint" data-hint-text="${t.trans_receiver_name || 'Unknown'}" data-hint-position="left">${shorten(t.trans_receiver, 7)}</a>
                        <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy address to clipboard" data-value="${t.trans_receiver}"></span>
                    </div>                                            
                </div>                
            </td>
            <td class="text-center">
                <div>
                    <span class="">${normMina(+t.amount)}</span>
                    <div class="text-muted text-small">${normMina(+t.fee)}</div>                        
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

function searchInBlockchain(val) {
    if (!val) {
        Metro.toast.create("Please define a search request!")
        return
    }

    let target = `/search/${val}`

    if (val.substr(0, 4) === 'B62q') {
        target = `/address/${val}`
    } else if (val.substr(0, 3) === 'Ckp') {
        target = `/trans/${val}`
    } else if (val.substr(0, 2) === '3N') {
        target = `/block/${val}`
    }

    window.location.href = target
}