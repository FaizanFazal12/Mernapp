
const mongoose = require("mongoose");
const {MOGODB_CONNECTION_STRING} = require("../config/index")

const dbconnect = async () => {
    try {
        let conn = await mongoose.connect(MOGODB_CONNECTION_STRING)
        console.log(`Database connected to a host ${conn.connection.host}`)

    } catch (error) {
        console.error(`Error :${error}`)
    }
}
module.exports = dbconnect