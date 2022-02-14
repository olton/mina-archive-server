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
    if (!data || !data.length) return

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

    maxY = Math.round(maxY * 1.2)
    minY = Math.round(minY * 0.85)

    const areas = [
        {
            name: "Balance per Epoch",
            dots: {
                size: 3
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
    if (!data || !data.length) return

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

    maxY = Math.round(maxY * 1.2)
    minY = Math.round(minY * 0.85)

    const areas = [
        {
            name: "Stake per Epoch",
            dots: {
                size: 3
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

