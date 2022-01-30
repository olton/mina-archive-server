const updateEpoch = (data) => {

}

const updateTransactionInfo = (data) => {
    console.log(data)

    const tags = $("#trans-tags").clear()
    tags.append(
        $("<span>").addClass(data.type === 'payment' ? 'bg-cyan' : 'bg-pink').addClass("radius reduce-4 badge inline fg-white text-upper").html(`${data.type}`)
    )
    tags.append(
        $("<span>").addClass(data.status === 'applied' ? 'bg-green' : 'bg-red').addClass("radius reduce-4 badge inline fg-white text-upper").html(`${data.status}`)
    )

    if (data.scam) {
        tags.append(
            $("<span>").addClass("radius reduce-4 badge inline bg-darkRed fg-white text-upper").html(`scam`)
        )
    }

    const [transDate, transTime] = datetime(+data.timestamp).format("DD/MM/YYYY HH:mm").split(" ")
    $("#trans-date").html(`
        <span>${transDate}</span>
        <span class="reduce-4">${transTime}</span>
`   )

    $("#block-hash").attr("href", `/block/${data.state_hash}`).html(shorten(data.state_hash, 10))
    $("#block-hash + span").attr("data-value", data.state_hash)
    $("#block-height").html(Number(data.height).format(0, null, " ", "."))
    $("#confirmation").html(Number(data.confirmation).format(0, null, " ", "."))
    $("#global-slot").html(Number(data.global_slot).format(0, null, " ", "."))


    let [amount1, amount2 = '0000'] = (""+normMina(data.amount, "number")).split(".")
    $("#transaction-amount").html(`
        <span>${(+amount1).format(0, null, " ", ".")}</span>
        <span class="reduce-4 ml-1-minus">.&nbsp;${amount2}</span>
    `)
    let [fee1, fee2 = '0000'] = (""+normMina(data.fee, "number")).split(".")
    $("#transaction-fee").html(`
        <span>${(+fee1).format(0, null, " ", ".")}</span>
        <span class="reduce-4 ml-1-minus">.&nbsp;${fee2}</span>
    `)

    $("#transaction-nonce").html(data.nonce)

    $("#transaction-sender").html(`
        <a class="link" href="/address/${data.trans_owner}">${shorten(data.trans_owner, 10)}</a>
        <div class="text-small text-muted">${data.trans_owner_name || ''}</div>
    `)
    $("#transaction-receiver").html(`
        <a class="link" href="/address/${data.trans_receiver}">${shorten(data.trans_receiver, 10)}</a>
        <div class="text-small text-muted">${data.trans_receiver_name || ''}</div>
    `)
    $("#transaction-fee-payer").html(`
        <a class="link" href="/address/${data.trans_fee_payer}">${shorten(data.trans_fee_payer, 10)}</a>
    `)
    $("#transaction-memo").html(data.memo || 'No memo')
    $("#transaction-desc").html(data.failure_reason || 'No data')
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestData = () => {
        ws.send(JSON.stringify({channel: 'epoch'}));
        ws.send(JSON.stringify({channel: 'transaction', data: transactionHash}));
    }

    switch(channel) {
        case 'welcome': {
            requestData()
            break;
        }
        case 'new_block': {
            requestData()
            break;
        }
        case 'epoch': {
            updateEpoch(data)
            break;
        }
        case 'transaction': {
            updateTransactionInfo(data)
            break;
        }
    }
}