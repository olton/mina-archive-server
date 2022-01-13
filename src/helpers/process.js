import {exec} from "child_process"
import {log} from "./logging.js"

export const execCommand = (cmd) => {
    if (!cmd) return

    return exec(cmd, async (error, stdout, stderr) => {
        if (error) {
            log("Error code: "+error.code)
            log("Signal received: "+error.signal)
        }
        if (stdout) log(stdout)
        if (stderr) log(stderr)
    })
}
