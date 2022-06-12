import {UPTIME_DEFAULT, UPTIME_SCORE_MAX, uptimeScore, uptimeScoreRange} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";

log(`============== uptimeScoreRange ===============`)
logObject("uptimeScoreRange()")
logObject(await uptimeScoreRange(UPTIME_DEFAULT, UPTIME_SCORE_MAX, 6079))


