
function searchInBlockchain (val, btn) {
    if (!val.trim()) {
        Metro.toast.create("Please define a search request!")
        return
    }

    console.log("Search for: ", val)
    console.log(""+(1/10**9).toFixed(9))
}