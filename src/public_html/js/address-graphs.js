const chartOptions = {
    border: {
        color: "transparent"
    },
    height: 100,
    legend: {
        position: 'top-left',
        vertical: true,
        background: "#fff",
        margin: {
            left: 4,
            top: 4
        },
        border: {
            color: "#fafbfc"
        },
        padding: 2,
        font: {
            color: "#24292e",
            size: 10
        },
    },
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
                showLabel: false
            }
        }
    },
    arrows: false,
    padding: 0,
    margin: 0,
    boundaries: {
        maxY: 0,
        minY: 0
    },
    tooltip: false,
    onDrawLabelX: () => ''
}

const graphBalancePerEpoch = data => {
    if (!data || !data.length) return

    const points = []
    const _data = data.reverse()

    let maxY = 0
    let maxX = 0
    let minY = Math.round(normMina(_data[0].balance) * .85)
    for(let r of _data) {
        const m = Math.round(normMina(r.balance))
        const e = +(r.epoch)
        points.push([e, m])
        if (maxY < m) maxY = m
        if (maxX < e) maxX = e
    }

    // maxY = Math.round(maxY * 1.2)

    const areas = [
        {
            name: "Balance per Epoch",
            dots: {
                type: "dot",
                size: 3
            },
            size: 2
        }
    ]

    const graph = chart.areaChart("#graph-balance-per-epoch", [points], {
        areas,
        colors: [Metro.colors.toRGBA('#00AFF0', .5)],
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
        boundaries: {
            minY,
            maxY
        },
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
                    showMin: false
                }
            }
        },
        onTooltipShow: (d, g) => {
            return `<span>${d[1]}</span>`
        }
    })

}

