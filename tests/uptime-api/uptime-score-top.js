import {
    UPTIME_DEFAULT, UPTIME_SIDECAR, UPTIME_SNARKWORK,
    uptimeScoreTop
} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";

log(`============== uptimeScoreRange ===============`)
logObject("uptimeScoreTop()")
logObject(await uptimeScoreTop(UPTIME_SNARKWORK, 5))

log(`============== uptimeScoreRange ===============`)
logObject("uptimeScoreTop()")
logObject(await uptimeScoreTop(UPTIME_SIDECAR, 5))


