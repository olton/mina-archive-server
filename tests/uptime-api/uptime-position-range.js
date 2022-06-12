import {UPTIME_DEFAULT, uptimePositionRange} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";

log(`============== uptimeScoreRange ===============`)
logObject("uptimePositionRange()")
logObject(await uptimePositionRange(UPTIME_DEFAULT, 4, 5))
