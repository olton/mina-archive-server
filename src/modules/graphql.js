import {log} from "../helpers/logging.js";
import fetch from "node-fetch";
import {query} from "./postgres.js";
import {TextDecoder} from "util";
import {decode} from "@faustbrian/node-base58";
import {isset} from "../helpers/isset.js";
import {parseTime} from "../helpers/parsers.js";
import {decodeMemo} from "../helpers/memo.js";
import {checkMemoForScam} from "../helpers/scam.js";

const fetchGraphQL = async (query, variables = {}) => {
    try {
        const result = await fetch(
            `http://${config.mina.graphql}/graphql`,
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    variables,
                })
            }
        )

        return result.ok ? await result.json() : null
    } catch (e) {
        log(`The Request to GraphQL war aborted! ${e.message}`, 'error', e.stack)
        return null
    }
}

const qBalance = `
query ($publicKey: String!) {
  account(publicKey: $publicKey) {
    balance {
      total
      blockHeight
      liquid
      locked
      stateHash
      unknown
    }
  }
}
`;
// PSJ6tbskxprEcucuCKvoyV3ujHYFFvF3crYB37cjvPWsFzwkTTem7pXZRuwMJWSgr6JRDZhj2Gt1K8H9zDeG2gFhmLGAjG1auDKCXTBH3J19Z1iNTt5qvrCqDjmEvmzEgEyTXHuWkGiL35jM555X3qXLGZaPvnhrNW7T5T3mqMHfQvNLbT6UckD26nSiE4Vko2Q1kDTU7JRauWz6McAvDbjiNt86pxpYj9ETQAkvcA4BLB6RUzf4zUxXnTE8zDHhRtsVwGV4rHBA6ANBeU2BqhN28VuynW4WbRGCEVpbmjvxifwkU2v7EA5kL3JtDwMKxpcsB36hTknQEsDxwE9EKjv6MGJpGr6hgnW1r3MrCsTRCDUkewwCbd99vR83AKAgJQSV1e8g3hSCq
// rKAkRnV1yvr54MuYW8xFd7sTWPiYQkTHycMZD2g8xz83kQ4xKjRjVfD2aLTX1taPTM4hF8mB8fUC98DwrsgS3yTwzk2XhmNNXrQjmDSJV5EWF9Kk432fhGcBsdf5rLSzjJAUiViN4t4WaFtpBDcerVj66Bm6RFQC1ahzawR35mUte27L3E2qWGvvxaRNqF7tKQCWmndQ5padhiaLRz88CwKxMmXxU3T75mSbN4fkdwzGXiB5ps4BWYR6pN8o97jSqYeYBiXxAmeJ5B91WQQm7XGSHSH4PgMmaZ9MDeDM4quuorKagFdMgRoWkQq166HVDeSZnVkjgqpZVfAdqAUm6mnVeEDAQrKobnWK4JSpaTpPNx82By89q4EqimxEWGB1P4SDfBeC4WmLJL8S2CVxa
const qTransactionStatus = `
query ($payment: String!) {
  version
  transactionStatus(payment: $payment)
}
`

const qTransactionInPool = `
query {
  version
  pooledUserCommands {
    id
    amount
    failureReason
    fee
    from
    hash
    isDelegation
    kind
    memo
    nonce
    to
  }
}
`

const qTransactionInPoolForAddress = `
query ($publicKey: String!) {
  version
  pooledUserCommands(publicKey: $publicKey) {
    id
    amount
    failureReason
    fee
    from
    hash
    isDelegation
    kind
    memo
    nonce
    to
  }
}
`

export const getAddressBalance = async (address) => {
    let result = await fetchGraphQL(qBalance, {publicKey: address})
    try {
        return result.data.account.balance
    } catch (e) {
        return {
            total: 0,
            blockHeight: 0,
            liquid: 0,
            locked: 0,
            stateHash: "",
            unknown: 0,
            error: e.message
        }
    }
}

export const checkPaymentStatus = async (id) => {
    let result = await fetchGraphQL(qTransactionStatus, {payment: id})
    console.log(result)
    try {
        return result.data ? result.data.transactionStatus : false
    } catch (e) {
        return false
    }
}

export const getTransactionInPool = async (address) => {
    let sql = address ? qTransactionInPoolForAddress : qTransactionInPool
    let result = await fetchGraphQL(sql, {publicKey: address})

    if (!isset(result.data.pooledUserCommands, false)) {
        return []
    }

    result = result.data.pooledUserCommands

    result.map((r) => {
        r.memo = decodeMemo(r.memo)
        r.scam = checkMemoForScam(r.memo)
    })

    return result
}

export const processTransactionPool = async () => {
    globalThis.cache.transactionPool = await getTransactionInPool()

    setTimeout(processTransactionPool, parseTime("30s"))
}