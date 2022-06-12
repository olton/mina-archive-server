import {UPTIME_SIDECAR, UPTIME_SNARKWORK, uptimeScore, uptimeScoreTop} from "../../src/modules/uptime-api.js";
import {log, logObject} from "../../src/helpers/logging.js";

log(`============== uptimeScore ===============`)
logObject("uptimeScore()")
// logObject(await uptimeScore(UPTIME_SNARKWORK))
logObject(await uptimeScore(UPTIME_SIDECAR))
