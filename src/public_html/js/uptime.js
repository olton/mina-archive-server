
const updateUptimeTable = data => {
    let {segment, rows, next} = data
    let timestamp = datetime(segment)

    let [segmentDate, segmentTime] = datetime(timestamp).format("DD/MM/YYYY HH:mm").split(" ")
    let [nextDate, nextTime] = datetime(next).format("DD/MM/YYYY HH:mm").split(" ")

    $("#segment").html(`
        <span>${segmentDate}</span>
        <span class="reduce-4">${segmentTime}</span>
    `)

    $("#next-round").html(`
        <span>${nextDate}</span>
        <span class="reduce-4">${nextTime}</span>
    `)

    const nextRoundTimer = $("#next-round-timer")

    if (nextRoundTimer.attr("data-date") !== next) {
        nextRoundTimer.attr("data-date", next)
        Metro.getPlugin("#next-round-timer", "countdown").reset()
    }

    const target = $("#leaderboard tbody").clear()
    let tr

    let counter = 1
    let prevScore = 0
    let group = 1

    for(let r of rows) {
        if (r.score !== prevScore) {
            prevScore = r.score
            tr = $("<tr>").addClass("no-hover bg-white").append(
                $("<td>").attr("colspan", 6).html(`<div class="pl-6 pt-1 pb-1 enlarge-2 text-muted text-left">Group ${group}</div>`)
            ).appendTo(target)
            group++
        }

        tr = $("<tr>").appendTo(target)

        let prodLabel = !r.is_producer ? "" : "<span class='text-small radius success p-1'>BP</span>"

        tr.append( $("<td>").addClass("text-center").html(`${r.position}`) )
        tr.append( $("<td>").html(`
            <a class="link" data-hint-offset="10" data-hint-hide="10000" data-role="hint" data-hint-text="${r.name || 'Unknown'}" data-hint-position="right" href="/address/${r.public_key}">${r.public_key}</a>
            <div>${r.name ? "<span class='text-small fg-darkViolet'>"+r.name+"</span>" : ""}</div>
        `) )
        tr.append( $("<td>").addClass("text-right").html(`
            <div>${normMina(r.stack, 'number').format(0, null, " ", ".")}</div>
            <div class="text-muted text-small">${normMina(r.stack_next, 'number').format(0, null, " ", ".")}</div>
        `) )
        tr.append( $("<td>").addClass("text-center").html(`
            <div>${r.delegators}</div>
            <div class="text-muted text-small">${r.delegators_next}</div>
        `) )
        tr.append( $("<td>").addClass("text-center").html(`${r.score}`) )
        tr.append( $("<td>").addClass("text-center").html(`${r.rate}%`) )
        tr.append( $("<td>").addClass("text-center").html(`${prodLabel}`) )

        counter++
        if (counter > 120) break;
    }
}

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    const requestLeaderboard = () => {
        ws.send(JSON.stringify({channel: 'uptime'}))
        ws.send(JSON.stringify({channel: 'uptime_next'}))
        setTimeout(requestLeaderboard, 300000)
    }

    switch(channel) {
        case 'welcome': {
            ws.send(JSON.stringify({channel: 'epoch'}));
            requestLeaderboard()
            break;
        }
        case 'new_block': {
            ws.send(JSON.stringify({channel: 'epoch'}));
            break;
        }
        case 'update_next': {
            break;
        }
        case 'uptime': {
            updateUptimeTable(data)
            break;
        }
    }
}