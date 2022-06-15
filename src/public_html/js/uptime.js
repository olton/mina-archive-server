
const updateUptimeTable = data => {
    console.log(data)

    let {leaderboard, nextSnapshot} = data
    let timestamp = datetime(leaderboard[0].timestamp)

    let [segmentDate, segmentTime] = [datetime(timestamp).format(config.format.date), datetime(timestamp).format(config.format.time)]

    $("#segment").html(`
        <span>${segmentDate}</span>
        <span class="reduce-4">${segmentTime}</span>
    `)

    let [nextDate, nextTime] = [datetime(nextSnapshot).format(config.format.date), datetime(nextSnapshot).format(config.format.time)]

    $("#next-round").html(`
        <span>${nextDate}</span>
        <span class="reduce-4">${nextTime}</span>
    `)

    const nextRoundTimer = $("#next-round-timer")

    if (nextRoundTimer.attr("data-date") !== nextSnapshot) {
        const cd = Metro.getPlugin("#next-round-timer", "countdown")
        cd.resetWith(nextSnapshot)
    }

    const target = $("#leaderboard tbody").clear()
    let tr

    let counter = 1
    let prevScore = 0
    let group = 1

    for(let r of leaderboard) {
        if (r.score !== prevScore) {
            prevScore = r.score
            tr = $("<tr>").addClass("no-hover bg-white").append(
                $("<td>").attr("colspan", 5).html(`<div class="pl-6 pt-1 pb-1 enlarge-2 text-muted text-left">Group ${group}</div>`)
            ).appendTo(target)
            group++
        }

        tr = $("<tr>").appendTo(target)

        let prodLabel = !r.is_block_producer ? "" : "<span class='text-small radius success p-1'>BP</span>"

        tr.append( $("<td>").addClass("text-center").html(`${r.position}`) )
        tr.append( $("<td>").html(`
            <a class="link" data-hint-offset="10" data-hint-hide="10000" data-role="hint" data-hint-text="${r.name || 'Unknown'}" data-hint-position="right" href="/address/${r.public_key}">${shorten(r.public_key, 12)}</a>
            <span class="ml-1 mif-copy copy-data-to-clipboard c-pointer" title="Copy hash to clipboard" data-value="${r.public_key}"></span>
            <div>${r.name ? "<span class='text-small fg-darkViolet'>"+r.name+"</span>" : ""}</div>
        `) )
        tr.append( $("<td>").html(`
            <span>${r.score}</span>
            <div class="text-small text-muted">${r.sc_score}</div>
        `) )
        tr.append( $("<td>").html(`
            <span>${r.score_percent}%</span>
            <div class="text-small text-muted">${r.sc_score_percent}%</div>
        `) )
        tr.append( $("<td>").addClass("text-center").html(`${prodLabel}`) )

        counter++
        if (counter === 241) {
            tr = $("<tr>").addClass("no-hover bg-white").append(
                $("<td>").attr("colspan", 5).html(`<div class="pl-6 pt-1 pb-1 enlarge-2 text-muted text-left">Outsiders from TOP240</div>`)
            ).appendTo(target)
        }
    }
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLeaderboard = () => {
        if (isOpen(ws)) {
            request('uptime')
        }
        setTimeout(requestLeaderboard, 300000)
    }

    switch(channel) {
        case 'welcome': {
            request('epoch')
            requestLeaderboard()
            break;
        }
        case 'new_block': {
            request('epoch')
            break;
        }
        case 'uptime': {
            updateUptimeTable(data)
            break;
        }
    }
}