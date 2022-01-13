import {isset} from "./isset"

export const setValue = (val, def) => {
    return isset(val, false) ? val : def
}
