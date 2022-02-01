
const parseSearchResult = (data) => {
    console.log(data)
    let tr, index = 1
    const target = $("#search-result tbody").clear()

    tr = $("<tr>").appendTo(target)
    tr.append(
        $("<td>").attr("colspan", 2).addClass('text-leader').html(`Number of search results: ${data.addresses.length + data.blocks.length + data.transactions.length + data.payments.length}`)
    )

    if (data.addresses.length) {
        tr = $("<tr>").appendTo(target)
        tr.append(
            $("<td>").addClass('text-bold').attr("colspan", 2).html(`Addresses: ${data.addresses.length}`)
        )
        for(let a of data.addresses) {
            tr = $("<tr>").appendTo(target)
            tr.append( $("<td>").css("width", "30px").html(`${index}.`) )
            tr.append( $("<td>").html(`
                <a class="link" href="/address/${a.public_key}">${shorten(a.public_key, 12)}</a>
                ${a.is_producer ? '<span class="reduce-4 pt-1 pb-1 pl-2 pr-2 fg-white bg-green">BLOCK PRODUCER</span>' : ''}
                ${a.public_key !== a.delegate_key ? '<span class="reduce-4 pt-1 pb-1 pl-2 pr-2 fg-white bg-orange">DELEGATOR</span>' : ''}
                ${a.scammer ? '<span class="ml-2-minus reduce-4 pt-1 pb-1 pl-2 pr-2 fg-white bg-darkRed">SCAMMER</span>' : ''}
                <div class="text-small">
                    <span>Name: </span><span class="text-bold">${a.name}</span>
                </div>
                <div class="text-small">
                    <span>Current Stack: </span><span class="text-bold">${a.stack}</span>
                    <span>Next Stack: </span><span class="text-bold">${a.stack_next}</span>
                </div>
            `) )

            index++
        }
    }

    if (data.blocks.length) {
        tr = $("<tr>").appendTo(target)
        tr.append(
            $("<td>").addClass('text-bold').attr("colspan", 2).html(`Blocks: ${data.blocks.length}`)
        )
        for(let a of data.blocks) {
            tr = $("<tr>").appendTo(target)
            tr.append( $("<td>").css("width", "30px").html(`${index}.`) )
            tr.append( $("<td>").html(`
                <a class="link" href="/block/${a.state_hash}">${shorten(a.state_hash, 12)}</a> 
                <span class="${a.chain_status === 'pending' ? 'gf-cyan' : a.chain_status === 'canonical' ? 'fg-green' : 'fg-red'}">(${a.chain_status})</span>
                <div class="text-small">
                    <span>Creator: </span><a class="link text-bold" href="/address/${a.creator_key}">${shorten(a.creator_key, 12)} ${a.creator_name ? "("+a.creator_name+")" : ""}</a>
                </div>
                <div class="text-small">
                    <span>Block date: </span><span class="text-bold">${datetime(+a.timestamp).format("DD/MM/YYYY HH:mm")}</span>
                    <span>Epoch: </span><span class="text-bold">${a.epoch}</span>
                    <span>Slot: </span><span class="text-bold">${a.slot}</span>
                    <span>Global Slot: </span><span class="text-bold">${a.global_slot}</span>
                </div>
            `) )

            index++
        }
    }

    if (data.transactions.length) {
        tr = $("<tr>").appendTo(target)
        tr.append(
            $("<td>").addClass('text-bold').attr("colspan", 2).html(`Transactions: ${data.transactions.length}`)
        )
        for(let a of data.transactions) {
            tr = $("<tr>").appendTo(target)
            tr.append( $("<td>").css("width", "30px").html(`${index}.`) )
            tr.append( $("<td>").html(`
                <a class="link" href="/transaction/${a.hash}">${shorten(a.hash, 12)}</a> 
                <span class="reduce-4 pt-1 pb-1 pl-2 pr-2 fg-white ${a.type === 'payment' ? 'bg-cyan' : 'bg-pink'}">${Cake.upper(a.type)}</span>
                <span class="ml-2-minus reduce-4 pt-1 pb-1 pl-2 pr-2 fg-white ${a.status === 'applied' ? 'bg-green' : 'bg-red'}">${Cake.upper(a.status)}</span>
                ${a.scam ? '<span class="ml-2-minus reduce-4 pt-1 pb-1 pl-2 pr-2 fg-white bg-darkRed">SCAM</span>' : ''}
                <div class="text-small">
                    <span>Amount: </span><span class="text-bold">${normMina(a.amount)}</span>&nbsp;<span class="reduce-3">MINA</span>
                    <span>Fee: </span><span class="text-bold">${normMina(a.fee)}</span>&nbsp;<span class="reduce-3">MINA</span>
                </div>
                <div class="text-small">
                    <span>Creator: </span><a class="link text-bold" href="/address/${a.trans_owner}">${shorten(a.trans_owner, 12)} ${a.trans_owner_name ? "("+a.trans_owner_name+")" : ""}</a>
                </div>
                <div class="text-small">
                    <span>Block Height: </span><span class="text-bold">${a.height}</span>
                    <span>Block date: </span><span class="text-bold">${datetime(+a.timestamp).format("DD/MM/YYYY HH:mm")}</span>
                    <span>Epoch: </span><span class="text-bold">${a.epoch}</span>
                    <span>Slot: </span><span class="text-bold">${a.slot}</span>
                    <span>Global Slot: </span><span class="text-bold">${a.global_slot}</span>
                    <span>Chain Status: </span><span class="text-bold ${a.chain_status === 'pending' ? 'gf-cyan' : a.chain_status === 'canonical' ? 'fg-green' : 'fg-red'}">${a.chain_status}</span>
                </div>
            `) )

            index++
        }
    }

    if (data.payments.length) {
        tr = $("<tr>").appendTo(target)
        tr.append(
            $("<td>").addClass('text-bold').attr("colspan", 2).html(`Payments: ${data.payments.length}`)
        )
        for(let a of data.payments) {
            tr = $("<tr>").appendTo(target)
            tr.append($("<td>").css("width", "30px").html(`${index}.`))
            tr.append(
                $("<td>").html(`
                    <span>${shorten(a[0], 12)}</span>
                    <span class="reduce-4 pt-1 pb-1 pl-2 pr-2 fg-white ${a[1] === 'PENDING' ? 'bg-cyan' : a[1] === 'INCLUDED' ? 'bg-green' : 'bg-red'}">${a[1]}</span>
                `)
            )
            index++
        }
    }
}