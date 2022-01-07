const path = require("path");
const {run} = require("./modules/server");

run(path.resolve(__dirname, "config.json"))