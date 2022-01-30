const updateEpoch = data => {
    const {height, epoch, slot, global_slot} = data

    $("#height").html((+height).format(0, null, " ", "."))
    $("#epoch").html((+epoch).format(0, null, " ", "."))
    $("#slot").html((+slot).format(0, null, " ", "."))
}

const updateAddressBalance = (data) => {
    let balance = normMina(data.total, "array")
    let movable = normMina(data.liquid, "array")
    $("#balance").html(`
        <span>${(+balance[0]).format(0, null, " ", ".")}</span>
        <span class="reduce-5 ml-2-minus">.${balance[1]}</span>
    `)
    $("#movable-balance").html(`
        <span>${(+movable[0]).format(0, null, " ", ".")}</span>
        <span class="reduce-5 ml-2-minus">.${movable[1]}</span>
    `)
}

const updateAddressInfo = (data) => {
    const genStart = datetime("2021-03-17 02:00:00.000000+02:00")
    const fields = {
        name: "Name",
        site: "Website",
        telegram: "Telegram",
        discord: "Discord"
    }
    const fieldsLedger = {
        initial_balance: "Initial Balance",
        initial_minimum_balance: "Minimum Balance",
        receipt_chain_hash: "Receipt Chain Hash",
        voting_for: "Voting For",
        cliff_time: "Cliff Time",
        cliff_amount: "Cliff Amount",
        vesting_period: "Vesting Period",
        vesting_increment: "Vesting Increment",
        delegate_key: "Stack Delegated in Epoch To",
        ledger_balance: "Stack Size in Epoch"
    }
    const target = $("#address-info tbody").clear()
    const targetLedger = $("#ledger-info tbody").clear()

    let tr, val

    if (+data.scammer) {
        $("#scammer-marker").show()
    } else {
        $("#scammer-marker").hide()
    }

    const addressTags = $("#address-tags").clear()

    if (data.is_producer) {
        addressTags.append(
            $("<span>").addClass("radius reduce-4 badge inline bg-green fg-white text-upper").html(`Block Producer`)
        )
    }

    if (data.delegate_key !== address) {
        addressTags.append(
            $("<span>").addClass("radius reduce-4 badge inline bg-red fg-white text-upper").html(`Delegator`)
        )
    }

    let stack = normMina(data.stack, 'array')
    $("#stack-current").html(`
        <span>${(+stack[0]).format(0, null, " ", ".")}</span>
        <span class="reduce-5 ml-2-minus">.${stack[1]}</span>    
    `)

    let stack_next = normMina(data.stack_next, 'array')
    $("#stack-next").html(`
        <span>${(+stack_next[0]).format(0, null, " ", ".")}</span>
        <span class="reduce-5 ml-2-minus">.${stack_next[1]}</span>    
    `)

    $("#blocks_count").html(`
        <span class="">${data.blocks_total}</span>
        <span class="reduce-4 text-bold ml-auto">
            <span class="fg-green" title="Canonical blocks produced">
                ${data.blocks_canonical}
            </span>
            <span class="text-light">/</span>
            <span class="fg-red" title="Blocks lost">
                ${data.blocks_total - data.blocks_canonical}
            </span>
        </span>
    `)
    $("#blocks-cpy").html(`
        <span class="text-bold">${Math.round((data.blocks_canonical * 100) / data.blocks_total) || 0}%</span>
    `)

    $("#trans_count").html(`
        <span class="">
            ${data.trans_count}
        </span>
        <span class="reduce-4 text-bold ml-auto">
            <span class="fg-green" title="Outgoing transactions">${data.trans_out}</span>
            <span class="text-light">/</span>
            <span class="fg-cyan" title="Incoming transactions">${data.trans_count - data.trans_out}</span>
        </span>
    `)
    $("#trans-fail").html(`
        <span>
            <span class="text-bold">${data.trans_failed}</span>
        </span>
    `)


    $("#snark_jobs").html(`${data.snarks_count}`)
    $("#validator-fee").html(`${data.fee ? data.fee : 0}%`)
    $("#validator-rules").html(`${data.description || 'Not available'}`)

    for(let o in fields) {
        tr = $("<tr>").appendTo(target)
        tr.append($("<td>").css({width: 160}).addClass("light").html(fields[o]))
        if (o === 'site') {
            val = $("<a>").attr("href", data[o]).attr("target", "_blank").html(data[o])
            tr.append($("<td>").append(val))
        } else {
            tr.append($("<td>").html(data[o] || 'Not available'))
        }
    }

    const cliffTime = genStart.addSecond(data["cliff_time"] * (180000/1000))

    for(let o in fieldsLedger) {
        tr = $("<tr>").appendTo(targetLedger)
        tr.append($("<td>").css({width: 160}).addClass("light").html(fieldsLedger[o]))
        if (o === 'cliff_time') {
            tr.append($("<td>").html(cliffTime.format("DD/MM/YYYY HH:mm")))
        } else if (o === 'cliff_amount' || o === 'vesting_increment' || o === 'initial_balance' || o === 'initial_minimum_balance') {
            tr.append($("<td>").html( normMina(data[o]) + ' <span class="text-small">MINA</span>' ))
        } else if (o === 'vesting_period') {
            tr.append($("<td>").html( !data[o] ? "NONE" : data[o] + ' <span class="text-small">BLOCK(s)</span>' ))
        } else if (['receipt_chain_hash', 'voting_for'].includes(o)) {
            tr.append($("<td>").html(`
                <div class="d-flex flex-align-center">
                    <span>${!data[o] ? 'NONE' : shorten(data[o], 10)}</span> 
                    <span class="ml-auto mif-copy c-pointer copy-data-to-clipboard" title="Click to copy hash to clipboard" data-value="${data[o]}"></span>
                </div>
            `))
        } else if (['delegate_key'].includes(o)) {

            tr.append($("<td>").html(`
                <div class="d-flex flex-align-center">
                    <span class="reduce-3 mr-1 text-bold text-muted d-inline-block" style="width: 60px;">CURRENT:</span>
                    <a class="link" href="/address/${data[o]}" data-hint-offset="10" data-hint-hide="10000" data-role="hint" data-hint-text="${data['delegate_name'] || 'Unknown'}" data-hint-position="left">${shorten(data[o], 10)}</a> 
                    <span class="ml-auto mif-copy c-pointer copy-data-to-clipboard" title="Click to copy hash to clipboard" data-value="${data[o]}"></span>
                </div>
                <div class="d-flex flex-align-center">
                    <span class="reduce-3 mr-1 text-bold text-muted d-inline-block" style="width: 60px;">NEXT:</span>
                    <a class="link" href="/address/${data['delegate_key_next']}" data-hint-offset="10" data-hint-hide="10000" data-role="hint" data-hint-text="${data['delegate_name_next'] || 'Unknown'}" data-hint-position="left">${shorten(data['delegate_key_next'], 10)}</a> 
                    <span class="ml-auto mif-copy c-pointer copy-data-to-clipboard" title="Click to copy hash to clipboard" data-value="${data['delegate_key_next']}"></span>
                </div>
            `))

        } else if (['ledger_balance'].includes(o)) {
            let lb = normMina(data['ledger_balance'], 'array')
            let lbn = normMina(data['ledger_balance_next'], 'array')
            tr.append($("<td>").html(`
                <div class="">
                    <span class="reduce-3 mr-1 text-bold text-muted d-inline-block" style="width: 60px;">CURRENT:</span>
                    <span>${(+(lb[0])).format(0, null, " ", ".")}</span>.<span class="reduce-3">${lb[1]}</span> 
                    <span class="reduce-4 mr-1 text-bold text-muted" style="width: 70px;">MINA</span>
                </div>
                <div class="">
                    <span class="reduce-3 mr-1 text-bold text-muted d-inline-block" style="width: 60px;">NEXT:</span>
                    <span>${(+(lbn[0])).format(0, null, " ", ".")}</span>.<span class="reduce-3">${lbn[1]}</span> 
                    <span class="reduce-4 mr-1 text-bold text-muted" style="width: 70px;">MINA</span>
                </div>
            `))

        } else {
            tr.append($("<td>").html(data[o]))
        }

    }
}

const updateAddressLastBlocks = data => {
    if (!data || !Array.isArray(data)) return

    const target = $("#address-last-blocks tbody").clear()
    const rows = drawBlocksTable(data, 'any')
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

const updateAddressLastTrans = data => {
    if (!data || !Array.isArray(data)) return

    const target = $("#address-last-trans tbody").clear()
    const rows = drawTransTable(data, address)
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

const updateAddressTransPool = data => {
    if (!data || !Array.isArray(data)) return

    const target = $("#address-pool-trans tbody").clear()
    const rows = drawTransPoolTable(data, address)
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

const updateAddressUptime = data => {
    $("#address-uptime").html(`
        <div class="text-small text-bold m-0 text-muted text-upper">Uptime Tracking</div>
        <div class="h4 row text-light mt-0">
            <div class="cell-4">Position: <span class="text-normal">${data.position}</span></div> 
            <div class="cell-4">Rate: <span class="text-normal">${data.rate}%</span></div> 
            <div class="cell-4">Score: <span class="text-normal">${data.score}</span></div>
        </div>
    `)
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLastActivity = () => {
        ws.send(JSON.stringify({channel: 'address_last_blocks', data: {pk: address, type: ['canonical', 'orphaned', 'pending'], count: 20}}));
        ws.send(JSON.stringify({channel: 'address_last_trans', data: {pk: address, count: 20}}));
        ws.send(JSON.stringify({channel: 'address_balance', data: address}));
        ws.send(JSON.stringify({channel: 'address_trans_pool', data: address}));

        setTimeout(requestLastActivity, 60000)
    }

    switch(channel) {
        case 'welcome': {
            ws.send(JSON.stringify({channel: 'epoch'}));
            ws.send(JSON.stringify({channel: 'address', data: address}));
            requestLastActivity()
            break;
        }
        case 'new_block': {
            ws.send(JSON.stringify({channel: 'epoch'}));
            ws.send(JSON.stringify({channel: 'address', data: address}));
            break;
        }
        case 'address': {
            updateAddressInfo(data)
            if (data && data.is_producer) {
                ws.send(JSON.stringify({channel: 'address_uptime', data: address}));
            }
            break;
        }
        case 'epoch': {
            updateEpoch(data)
            break;
        }
        case 'address_last_blocks': {
            updateAddressLastBlocks(data)
            break;
        }
        case 'address_last_trans': {
            updateAddressLastTrans(data)
            break;
        }
        case 'address_balance': {
            updateAddressBalance(data)
            break;
        }
        case 'address_trans_pool': {
            updateAddressTransPool(data)
            break;
        }
        case 'address_uptime': {
            updateAddressUptime(data)
            break;
        }
    }
}
