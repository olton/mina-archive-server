export const age = d => {
    let old = new Date(Number(d))
    let now = new Date()
    let val = now - old

    let seconds = Math.floor(val/1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)
    let days = Math.floor(hours / 24)
    let months = Math.floor(days / 30)
    let years = Math.floor(months / 12)

    if (years >= 1) return `${years} year`
    if (months >= 1 && years < 1) return `${months} mon`
    if (days >= 1 && days <= 30) return `${days} days`
    if (hours && hours < 24) return `${hours} hour`
    if (hours && hours < 2) return `less a hour`
    if (hours && hours < 1) return `${minutes} min`
    if (minutes && minutes < 60) return `${minutes} min`
    if (seconds < 30) return `few sec`
}
