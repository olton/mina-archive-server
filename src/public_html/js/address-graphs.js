

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
                    align: "right",
                    shift: {
                        x: 0
                    },
                    showMin: true,
                    showLabel: true,
                }
            }
        },
        padding: {
            left: 35,
            top: 10,
            right: 0
        },
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

const drawUptimeChart = (chartContainer, lines, data, color, maxY) => {
    return chart.lineChart(chartContainer, data, {
        ...areaDefaultOptions,
        height: 180,
        padding: {
            top: 10,
            left: 35,
            right: 0,
            bottom: 40
        },
        lines,
        legend: {
            vertical: false,
            position: "top-right",
            margin: {
                top: 10
            },
            border: {
                color: 'transparent'
            }
        },
        colors: color,
        boundaries: {
            minY: 0,
            maxY
        },
        axis: {
            y: {
                line: {
                    color: "#dadada"
                },
                label: {
                    // showLabel: false
                    count: 10,
                    font: {
                        size: 10
                    },
                    margin: {
                        bottom: 4
                    }
                }
            },
            x: {
                line: {
                    color: "#dadada"
                },
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
        onDrawLabelY: (v) => {
            return Math.round(maxY + 1 - v)
        },
        onTooltipShow: (d) => {
            return `
                <span>Pos:</span>
                <span class="text-bold">${maxY - d[1]}</span>
                <span>at</span>
                <span class="text-bold">${datetime(d[0]).format(config.format.datetime)}</span>
            `
        }
    })
}

const updateAddressUptimeLine = (data, type = 'short') => {
    if (!data[0].length && !data[0].length) {
        return
    }

    const sidecarPoints = []
    const snarkPoints = []
    const dataSidecar = data[0].reverse()
    const dataSnark = data[1].reverse()


    let borderBottom = 240

    for(let r of dataSidecar) { if (+r.position > +borderBottom) borderBottom = +r.position + 20 }
    for(let r of dataSnark) { if (+r.position > +borderBottom) borderBottom = +r.position + 20 }

    for(let r of dataSidecar) {
        let x = datetime(r.timestamp).time()
        let y = borderBottom - r.position

        sidecarPoints.push([x, y])
    }

    for(let r of dataSnark) {
        let x = datetime(r.timestamp).time()
        let y = borderBottom - r.position

        snarkPoints.push([x, y])
    }

    // const target = $("#uptime-graph-dates"+suffix+subtype).clear()
    //
    // for(let r of _dataAvg) {
    //     target.append(
    //         $("<div>").html(datetime(r.timestamp).format("DD MMM"))
    //     )
    // }

    const lines = [
        {
            name: "Uptime by Sidecar",
            dots: {
                size: 2,
                type: 'circle'
            },
            size: 2
        },
        {
            name: "Uptime by Snark",
            dots: {
                size: 2,
                type: 'diamond'
            },
            size: 2
        }
    ]

    const color = [Metro.colors.toRGBA('#7528d2', 1), Metro.colors.toRGBA('#ff8829', 1)]

    const chartContainer = "#uptime-graph" + (type === 'full' ? '' : '-short')

    drawUptimeChart(chartContainer, lines, [sidecarPoints, snarkPoints], color, borderBottom)

    // const graph = $(chartContainer)
    // graph.append(
    //     $([
    //         $("<div>").addClass("max-graph-value").html(`${borderTop}`),
    //         $("<div>").addClass("min-graph-value").html(`${borderBottom}`)
    //     ])
    // )
}
