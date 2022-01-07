const defaultConfig = {
    "archive": {
        "user": "postgres",
        "host": "localhost",
        "database": "archive",
        "password": "",
        "port": 5432
    },
    "server": {
        "name": "Archivist",
        "host": "localhost:8000",
        "ssl": {
            "cert": "",
            "key": ""
        }
    },
    debug: false
}

module.exports = {
    defaultConfig
}