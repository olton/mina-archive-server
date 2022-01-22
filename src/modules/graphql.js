import {log} from "../helpers/logging.js";
import fetch from "node-fetch";
import {query} from "./postgres.js";
import {TextDecoder} from "util";
import {decode} from "@faustbrian/node-base58";
import {isset} from "../helpers/isset.js";

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
            unknown: 0
        }
    }
}

export const checkTransactionStatus = async (id) => {
    let result = await fetchGraphQL(qTransactionStatus, {payment: id})
    try {
        return result.data.transaction
    } catch (e) {
        return 'Unknown'
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
        r.memo = (new TextDecoder().decode(decode(r.memo).slice(3, -4)))
    })

    return result
}