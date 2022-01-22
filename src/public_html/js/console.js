
const log = (...rest) => console.log(datetime().format("DD-MM-YYYY HH:mm "), ...rest)
const info = (...rest) => console.info(datetime().format("DD-MM-YYYY HH:mm "), ...rest)
const error = (...rest) => console.error(datetime().format("DD-MM-YYYY HH:mm "), ...rest)