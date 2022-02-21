import {
    getAddressByName,
    getAddressInfo,
    getAddressName,
    getBlockInfo,
    getBlocksByHeight,
    getTransaction, getTransactionFromPool
} from "./queries.js";
import {checkPaymentStatus} from "./graphql.js";
import {checkMemoForScam} from "../helpers/scam.js";
import {datetime} from "@olton/datetime";

export const searchData = async (data) => {
    const query = data.split(",").map(v => v.trim())
    const result = {
        addresses: [],
        blocks: [],
        transactions: [],
        payments: []
    }
    for(let val of query) {
        if (val === '') continue

        if (val.substring(0, 4) === 'B62q') {
            result.addresses.push(await getAddressInfo(val))
        } else if (val.substring(0, 3) === '3NK' || val.substring(0, 3) === '3NL') {
            result.blocks.push(await getBlockInfo(val))
        } else if (val.substring(0, 3) === 'Ckp') {
            const transInBlockchain = await getTransaction(val)
            const transInPool = await getTransactionFromPool(val)
            if (transInBlockchain)
                result.transactions.push(transInBlockchain)
            if (transInPool)
                result.transactions.push(transInPool)
        } else if (!isNaN(+val)) {
            (await getBlocksByHeight(+val)).map( b => {
                result.blocks.push(b)
            })
        } else {
            (await getAddressByName(val)).map( b => {
                result.addresses.push(b)
            })
            const checkPayment = await checkPaymentStatus(val)
            if (checkPayment) {
                result.payments.push([val, checkPayment])
            }
        }
    }
    return result
}