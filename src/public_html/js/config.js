const histogramDefaultOptions = {
    bars: [{
        name: "Bar",
        stroke: '#fff',
        color: Metro.colors.toRGBA('#00AFF0', .5)
    }],
    boundaries: {
        maxY: 60,
        minY: 0
    },
    //graphSize: 50,
    legend: {
        position: 'top-left',
        vertical: true,
        background: Metro.colors.toRGBA('#ffffff', .2),
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
                color: "#24292e",
            },
            arrow: false
        },
        y: {
            line: {
                color: "#fafbfc"
            },
            label: {
                count: 10,
                font: {
                    size: 10
                },
                color: "#24292e",
                skip: 2,
                fixed: 0
            },
            arrow: false,
        }
    },
    padding: 1,
    border: {
        color: "transparent"
    },
    onDrawLabelX: () => "",
    onDrawLabelY: () => ""
}

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
