import path from "path"
import { fileURLToPath } from 'url'
import {run} from "./modules/server.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

globalThis.rootPath = path.dirname(__dirname)
globalThis.appPath = __dirname
globalThis.configPath = __dirname

run()