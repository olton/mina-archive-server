const {isset} = require("./isset");

const setValue = (val, def) => {
    return isset(val, false) ? val : def
}

module.exports = {
    setValue
}