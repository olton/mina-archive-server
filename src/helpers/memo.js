import {TextDecoder} from "util";
import {decode} from "@faustbrian/node-base58";

export const decodeMemo = memo => (new TextDecoder().decode(decode(memo).slice(3, -4))).replace(/\0/g, "")