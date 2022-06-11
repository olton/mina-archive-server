import {UPTIME_SIDECAR, UPTIME_SNARKWORK, uptime} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";

log(`============== uptime ===============`)
logObject("uptime()")
logObject(await uptime(UPTIME_SNARKWORK))
// logObject(await uptime(UPTIME_SIDECAR))
