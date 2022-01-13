
const shorten = (v, l = 5) => `${v.substring(0, l) + '...' + v.substring(v.length - l)}`
