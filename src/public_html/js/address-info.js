let addressId = null

const updateEpoch = data => {
    const {height, epoch, slot, global_slot, epoch_start_block, blocks_produced} = data

    $("#epoch-number").html((+epoch).format(0, null, " ", "."))
    $("#epoch-current-height").html((+height).format(0, null, " ", "."))
    $("#epoch-start-block").html((+epoch_start_block).format(0, null, " ", "."))
    $("#epoch-blocks-produced").html((+blocks_produced).format(0, null, " ", "."))
    $("#epoch-slot").html((+slot).format(0, null, " ", "."))
    $("#epoch-global-slot").html((+global_slot).format(0, null, " ", "."))
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
        discord: "Discord",
        email: "Email",
        twitter: "Twitter",
        github: "GitHub",
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
        delegate_key: "Stake Delegated in Epoch To",
        ledger_balance: "Stake Size in Epoch"
    }
    const target = $("#address-info tbody").clear()
    const targetLedger = $("#ledger-info tbody").clear()
    const cliffTime = genStart.addSecond(data["cliff_time"] * (180000/1000))

    let tr, val

    addressId = +(data.public_key_id)

    $(".scam")[data.scammer ? 'show' : 'hide']()

    $("#address-logo").attr("src", data.logo ? data.logo : "/images/no-image.png")

    $("#address-name").html(`${data.name || 'No data'}`)

    const addressTags = $("#address-tags").clear()
    if (data.scammer) {
        addressTags.append(
            $("<span>").addClass("radius reduce-4 badge inline bg-red fg-white text-upper").html(`SCAMMER`)
        )
        $("#scammer-reason").parent().removeClass("d-none")
        $("#scammer-reason").html(data.scammer_reason)
    }

    if (data.is_producer) {
        addressTags.append(
            $("<span>").addClass("radius reduce-4 badge inline bg-green fg-white text-upper").html(`Block Producer`)
        )
    }

    if (data.delegate_key && data.delegate_key !== address) {
        addressTags.append(
            $("<span>").addClass("radius reduce-4 badge inline bg-orange fg-white text-upper").html(`Delegator`)
        )
    }

    // if (!data.delegate_key || data.delegate_key === address) {
    //     addressTags.append(
    //         $("<span>").addClass("radius reduce-4 badge inline bg-violet fg-white text-upper").html(`OWN DELEGATE`)
    //     )
    // }

    if (data.cliff_time && cliffTime > datetime()) {
        addressTags.append(
            $("<span>").addClass("radius reduce-4 badge inline bg-red fg-white text-upper").html(`BALANCE LOCKED`)
        )
    }

    if (+data.found) {
        addressTags.append(
            $("<span>").addClass("radius reduce-4 badge inline bg-darkIndigo fg-white text-upper").html(`DELEGATION FUND`)
        )
    }

    if (+data.is_delegation_program_participant) {
        addressTags.append(
            $("<span>").addClass("radius reduce-4 badge inline bg-teal fg-white text-upper").html(`DELEGATION PROGRAM`)
        )
    }

    let stake = normMina(data.stake, 'array')
    $("#stack-current, #stack-value").html(`
        <span>${(+stake[0]).format(0, null, " ", ".")}</span>
        <span class="reduce-5 ml-2-minus">.${stake[1]}</span>    
    `)

    let stake_next = normMina(data.stake_next, 'array')
    $("#stack-next, #next-stack-value").html(`
        <span>${(+stake_next[0]).format(0, null, " ", ".")}</span>
        <span class="reduce-5 ml-2-minus">.${stake_next[1]}</span>    
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

    for(let o in fieldsLedger) {
        tr = $("<tr>").appendTo(targetLedger)
        tr.append($("<td>").css({width: 160}).addClass("light").html(fieldsLedger[o]))
        if (o === 'cliff_time') {
            tr.append($("<td>").html(cliffTime.format(config.format.datetime)))
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

const updateAddressBlocksInEpoch = data => {
    if (!data) return

    $("#block_produced").text(data.blocks)
    $("#attempts").text(data.attempts)
    $("#current-rewards").text(Number(data.coinbase/10**9).format(0, null, " ", "."))
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

    const wrapper = $("#trans-pool-wrapper")
    const target = $("#address-pool-trans tbody").clear()
    const rows = drawTransPoolTable(data, address)
    if (rows.length) {
        wrapper.show()
        rows.map(r => target.append(r))
    } else {
        wrapper.hide()
        target.html(`
            <tr>
                <td colspan="7">
                    <div class="m-4 text-center">Nothing to show</div>                
                </td>
            </tr>            
        `)
    }
}

const updateAddressUptime = (data = {}) => {
    const {position = "---", rate = "--", score = "---", range = {min: 0, max: 0}} = data

    $("#uptime-position").html(position)
    $("#uptime-rate").html(`${rate}%`)
    $("#uptime-score").html(score)
    $("#uptime-range").html(`${range.min}..${range.max}`)
}

const updateAddressBlocksTable = data => {
    if (!data || !Array.isArray(data)) return

    const table = Metro.getPlugin('#address-blocks-table', 'table')
    table.setData({data})
}

const updateAddressTransTable = data => {
    if (!data || !Array.isArray(data)) return

    const table = Metro.getPlugin('#address-trans-table', 'table')
    table.setData({data})
}

const updateAddressDelegations = (data, next = false) => {
    if (!data || !Array.isArray(data)) return

    const table = Metro.getPlugin(`#address-delegations${next ? '-next' : ''}-table`, 'table')

    table.setData({data})
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLastActivity = (ws) => {
        if (isOpen(ws)) {
            request('address_trans_pool', address)
            request('address_last_trans', {pk: address, count: 20})
            request('address_last_blocks', {pk: address, type: ['canonical', 'orphaned', 'pending'], count: 20})
        }

        setTimeout(requestLastActivity, 60000, ws)
    }

    const requestData = (ws) => {
        if (!isOpen(ws)) return

        request('epoch')
        request('address', address)
        request('address_balance', address)
    }

    const requestDelegations = (ws) => {
        if (!isOpen(ws)) return

        request('address_delegations', address)
        request('address_delegations_next', address)
    }

    const requestUptime = (ws) => {
        if (isOpen(ws)) {
            request('address_uptime', address)
            request('address_uptime_line', {pk: address, limit: 60, trunc: 'day'})
        }
        setTimeout(requestUptime, 60000*10, ws)
    }

    const requestGraphs = (ws) => {
        if (isOpen(ws)) {
            request('address_balance_per_epoch', {pk: address, len: 10})
            request('address_stake_per_epoch', {pk: address, len: 10})
            request('address_blocks_per_epoch', {pk: address, len: 10})
        }

        setTimeout(requestUptime, 60000, ws)
    }

    switch(channel) {
        case 'welcome': {
            requestData(ws)
            requestLastActivity(ws)
            requestDelegations(ws)
            requestUptime(ws)
            requestGraphs(ws)

            request('address_blocks', {pk: address, type: ['canonical', 'orphaned', 'pending'], count: 1000000000})
            request('address_trans', address)
            request('address_blocks_current_epoch', address)

            break
        }
        case 'new_block': {
            requestData(ws)
            if (addressId && addressId === +(data.creator_id)) {
                request('address_blocks', {pk: address, type: ['canonical', 'orphaned', 'pending'], count: 1000000000})
                request('address_last_blocks', {pk: address, type: ['canonical', 'orphaned', 'pending'], count: 20})
                request('address_blocks_current_epoch', address)
            }
            break
        }
        case 'address': {
            updateAddressInfo(data)
            break
        }
        case 'epoch': {
            updateEpoch(data)
            break
        }
        case 'address_last_blocks': {
            updateAddressLastBlocks(data)
            break
        }
        case 'address_last_trans': {
            updateAddressLastTrans(data)
            break
        }
        case 'address_balance': {
            updateAddressBalance(data)
            break
        }
        case 'address_trans_pool': {
            updateAddressTransPool(data)
            break
        }
        case 'address_uptime': {
            updateAddressUptime(data)
            break
        }
        case 'address_blocks': {
            updateAddressBlocksTable(data)
            break
        }
        case 'address_trans': {
            updateAddressTransTable(data)
            break
        }
        case 'address_delegations': {
            updateAddressDelegations(data)
            break
        }
        case 'address_delegations_next': {
            updateAddressDelegations(data, true)
            break
        }
        case 'address_balance_per_epoch': {
            graphBalancePerEpoch(data)
            break
        }
        case 'address_stake_per_epoch': {
            graphStakePerEpoch(data)
            break
        }
        case 'address_blocks_per_epoch': {
            graphBlocksPerEpoch(data)
            break
        }
        case 'address_uptime_line': {
            graphAddressUptime(data)
            break
        }
        case 'address_blocks_current_epoch': {
            updateAddressBlocksInEpoch(data)
            break
        }
    }
}

function refreshAddressTransactionsTable(){
    if (globalThis.webSocket)
        request('address_trans', address)
}

function refreshAddressBlocksTable(){
    if (globalThis.webSocket)
        request('address_blocks', {pk: address, type: ['canonical', 'orphaned', 'pending'], count: 1000000000})
}

function refreshAddressDelegations(){
    if (globalThis.webSocket) {
        request('address_delegations', address)
        request('address_delegations_next', address)
    }
}

let fltBlockPending,
    fltBlockCanonical,
    fltBlockOrphaned,
    fltTransPayment,
    fltTransDelegation

function tableFilter(field, flt) {
    return function(row, heads){
        let is_active_index = 0;
        heads.forEach(function(el, i){
            if (el.name === field) {
                is_active_index = i;
            }
        });
        return row[is_active_index] === flt
    }
}

function initBlocksFilters(){
    const table = Metro.getPlugin("#address-blocks-table", "table")

    fltBlockPending = table.addFilter(tableFilter('chain_status', 'pending'), false);
    fltBlockCanonical = table.addFilter(tableFilter('chain_status', 'canonical'), false);
    fltBlockOrphaned = table.addFilter(tableFilter('chain_status', 'orphaned'), false);

    table.draw()
}

function initTransFilters(){
    const table = Metro.getPlugin("#address-trans-table", "table")

    fltTransPayment = table.addFilter(tableFilter('type','payment'), false);
    fltTransDelegation = table.addFilter(tableFilter('type','delegation'), false);

    table.draw()
}

$(()=>{
    initBlocksFilters()
    initTransFilters()
})


function addressBlocksApplyFilter(el, filter) {
    const table = Metro.getPlugin("#address-blocks-table", "table")
    const filters = {
        'pending': fltBlockPending,
        'canonical': fltBlockCanonical,
        'orphaned': fltBlockOrphaned,
    }

    if (el.checked) {
        filters[filter] = table.addFilter(tableFilter('chain_status',filter), false)
    } else {
        table.removeFilter(filters[filter], false)
    }

    table.draw()
}

function addressTransApplyFilter(el, flt){
    const [field, filter] = flt.split(":")
    const filters = {
        'type:payment': fltTransPayment,
        'type:delegation': fltTransDelegation,
    }

    const table = Metro.getPlugin("#address-trans-table", "table")

    if (el.checked) {
        filters[flt] = table.addFilter(tableFilter(field, filter), false)
    } else {
        table.removeFilter(filters[flt], false)
    }

    table.draw()
}

function addressTransTableDrawCell(td, val, idx, head, row, table){
    const [type, dir, status, time, hash, agent, block, nonce, amount, fee, confirmation, block_hash, memo, epoch, global_slot, slot, scam, is_fund, trans_owner_balance] = row

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
                <span class="${type === 'payment' ? 'bg-blue' : 'bg-pink'} fg-white pl-1 pr-1 reduce-2 text-upper">${type}</span>
                ${type === 'delegation' && +is_fund ? '<span class="ml-2-minus bg-violet fg-white pl-1 pr-1 reduce-2">FUND</span>' : ''}
                ${type === 'payment' && scam ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-2">SCAM</span>' : ''}
                ${type === 'payment' && !+amount ? '<span class="ml-2-minus bg-red fg-white pl-1 pr-1 reduce-2">SPAM</span>' : ''}
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
            ${normMina(type === 'payment' ? val : trans_owner_balance)}
            <div class="text-muted text-small">${normMina(fee)}</div>
        `)
    }
    if (head.name === 'nonce' || head.name === 'confirmation') {
        td.addClass("text-center").html(`${val}`)
    }
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

function addressDelegationsTableDrawCell(td, val, idx, head, row, table){
    if (head.name === 'name') {
        td.addClass("d-none")
    }
    if (head.name === 'stake_holder') {
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

const pageHash = window.location.hash

function tabOpen(tab, target){
    const ws = globalThis.webSocket
    if (pageHash !== target && target === '#overview') {
        if (ws && isOpen(ws)) {
            setTimeout(()=>{
                ws.send(JSON.stringify({channel: 'address_balance_per_epoch', data: {pk: address, len: 10}}));
                ws.send(JSON.stringify({channel: 'address_stake_per_epoch', data: {pk: address, len: 10}}));
                ws.send(JSON.stringify({channel: 'address_blocks_per_epoch', data: {pk: address, len: 10}}));
            }, 300)
        }
    }
}

$(() => {
    $(window).on("hashchange", () => {
        if (location.hash) {
            setTimeout(function() {
                window.scrollTo(0, 0);
            }, 1);
        }
    })

    const tabs = Metro.getPlugin("#main-tabs", "tabs")
    if (tabs && pageHash) {
        tabs.openByTarget(pageHash)
    }
})