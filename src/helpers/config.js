export const defaultConfig = {
    "archive": {
        "user": "mina",
        "host": "localhost:5432",
        "database": "archive",
        "password": "archive_password"
    },
    "mina": {
        "graphql": "localhost:3085"
    },
    "server": {
        "name": "",
        "host": "0.0.0.0:8001",
        "ssl": {
            "cert": "",
            "key": ""
        }
    },
    "client": {
        "theme": "auto",
        "server": {
            "host": "localhost:8001",
            "secure": false
        }
    },
    "debug": {
        "pg_notify": false,
        "pg_query": false
    },
    "coinbase": {
        "regular": [720],
        "supercharge": [1440]
    },
    "price": {
        "currency": "usd",
        "updateInterval": "1m",
        "saveToDB": false
    }
}

export const getDefaultConfig = (extConfig) => Object.assign({}, defaultConfig, extConfig)