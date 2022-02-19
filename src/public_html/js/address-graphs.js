const areaDefaultOptions = {
    axis: {
        x: {
            line: {
                color: "#fafbfc",
                shortLineSize: 0
            },
            label: {
                count: 10,
                fixed: 0,
                color: "#24292e",
                font: {
                    size: 10
                }
            },
            skip: 2,
        },
        y: {
            line: {
                color: "#fafbfc"
            },
            label: {
                count: 10,
                fixed: 0,
                color: "#24292e",
                font: {
                    size: 10
                },
                skip: 2,
                align: "left",
                shift: {
                    x: 20
                },
                showMin: false,
                showLabel: false
            }
        }
    },
    border: false,
    legend: {
        vertical: true,
        position: "top-right",
        margin: {
            top: 10
        },
        border: {
            color: 'transparent'
        }
    },
}

const graphBalancePerEpoch = data => {
    if (!data || !data.length) {
        $("#graph-balance-per-epoch").parent().hide()
        return
    }

    const points = []
    const _data = data.reverse()

    let maxY = 0
    let minY = 100000000
    for(let r of _data) {
        const m = Math.round(normMina(r.balance))
        const e = +(r.epoch)
        points.push([e, m])
        if (m > maxY) maxY = m
        if (m < minY) minY = m
    }

    $("#min-balance").html(num2fmt(minY))
    $("#max-balance").html(num2fmt(maxY))

    maxY = Math.round(maxY * 1.2)
    minY = Math.round(minY * 0.8)

    const areas = [
        {
            name: "Balance per Epoch",
            dots: {
                size: 4
            },
            size: 2
        }
    ]

    chart.areaChart("#graph-balance-per-epoch", [points], {
        ...areaDefaultOptions,
        areas,
        colors: [Metro.colors.toRGBA('#00AFF0', .5)],
        boundaries: {
            minY,
            maxY
        },
        onTooltipShow: (d) => {
            return `<span class="text-bold">${num2fmt(d[1])} <small class="text-light">MINA</small></span>`
        }
    })

}

const graphStakePerEpoch = data => {
    if (!data || !data.length) {
        $("#graph-stake-per-epoch").parent().hide()
        return
    }

    const points = []
    const _data = data.reverse()

    let maxY = 0
    let minY = 100000000
    for(let r of _data) {
        const m = Math.round(normMina(r.sum))
        const e = +(r.epoch)
        points.push([e, m])
        if (maxY < m) maxY = m
        if (minY > m) minY = m
    }

    $("#min-stake").html(num2fmt(minY))
    $("#max-stake").html(num2fmt(maxY))

    maxY = Math.round(maxY * 1.2)
    minY = Math.round(minY * 0.8)

    const areas = [
        {
            name: "Stake per Epoch",
            dots: {
                size: 4
            },
            size: 2
        }
    ]

    chart.areaChart("#graph-stake-per-epoch", [points], {
        ...areaDefaultOptions,
        areas,
        colors: [Metro.colors.toRGBA('#47bd0c', .5)],
        boundaries: {
            minY,
            maxY
        },
        onTooltipShow: (d) => {
            return `<span class="text-bold">${num2fmt(d[1])} <small class="text-light">MINA</small></span>`
        }
    })

}

const graphBlocksPerEpoch = data => {
    if (!data || !data.length) {
        $("#graph-blocks-per-epoch").parent().hide()
        return
    }

    const points = []
    const _data = data.reverse()

    let maxY = 0
    let minY = 100000000
    for(let r of _data) {
        const m = +(r.sum)
        const e = +(r.epoch)
        points.push([e, m])
        if (maxY < m) maxY = m
        if (minY > m) minY = m
    }

    $("#min-blocks").html(num2fmt(minY))
    $("#max-blocks").html(num2fmt(maxY))

    maxY = Math.round(maxY * 1.2)
    minY = Math.round(minY * 0.8)

    const areas = [
        {
            name: "Blocks per Epoch",
            dots: {
                size: 4
            },
            size: 2
        }
    ]

    chart.areaChart("#graph-blocks-per-epoch", [points], {
        ...areaDefaultOptions,
        areas,
        colors: [Metro.colors.toRGBA('#ec7618', .5)],
        boundaries: {
            minY,
            maxY
        },
        onTooltipShow: (d) => {
            return `<span class="text-bold">${num2fmt(d[1])} <small class="text-light">BLOCK(s)</small></span>`
        }
    })

}

const graphAddressUptime = data => {
    // console.log(data)
    if (!data || !data.length) {
        $("#graph-blocks-per-epoch").parent().hide()
        return
    }

    const points = []
    const _data = data.reverse()

    for(let r of _data) {
        let x = datetime(r.time).time()
        let y = 120 - r.position
        if (y < 0) y = 0
        points.push([x, y])
    }

    const target = $("#uptime-graph-dates").clear()

    for(let r of _data) {
        target.append(
            $("<div>").html(datetime(r.time).format("DD MMM"))
        )
    }

    const areas = [
        {
            name: "Uptime Line",
            dots: {
                size: 3,
                type: 'circle'
            },
            size: 2
        }
    ]

    chart.lineChart("#uptime-graph", [points], {
        ...areaDefaultOptions,
        height: 100,
        padding: {
            top: 0,
            left: 25,
            right: 5,
            bottom: 20
        },
        lines: areas,
        legend: false,
        colors: [Metro.colors.toRGBA('#7528d2', 1)],
        boundaries: {
            minY: 0,
            maxY: 120
        },
        axis: {
            y: {
                line: {
                    color: "#dadada"
                },
                label: {
                    showLabel: false
                }
            },
            x: {
                label: {
                    showLabel: false,
                    skip: 0,
                    count: 30
                }
            }
        },
        type: 'curve',
        arrows: false,
        cross: false,
        onDrawLabelX: (v) => {
            return datetime(+v).format("DD MMM")
        },
        onTooltipShow: (d) => {
            return `
                <span>Pos:</span>
                <span class="text-bold">${120 - d[1]}</span>
                <span>at</span>
                <span class="text-bold">${datetime(d[0]).format(config.format.date)}</span>
            `
        }
    })

    const graph = $("#uptime-graph")
    graph.append(
        $("<div>").addClass("max-graph-value").html(`1`)
    )
    graph.append(
        $("<div>").addClass("min-graph-value").html(`120`)
    )
}