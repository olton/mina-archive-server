import {isset} from "./isset.js"

export const setValue = (val, def) => {
    return isset(val, false) ? val : def
}
