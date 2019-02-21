import fs from "fs";
import mysql, { MysqlError, PoolConnection } from "mysql";
import { FieldInfo, GeometryType, Pool, PoolConfig } from "mysql";
let pool: Pool = null;

if (fs.existsSync("./.dbtoken")) {
    console.log("attempting to connect...");
    const connectionObject: PoolConfig = JSON.parse(fs.readFileSync("./.dbtoken").toString()) as PoolConfig;
    connectionObject.connectionLimit = 10;
    connectionObject.typeCast = customCaster;
    pool = mysql.createPool( connectionObject );
} else {
    console.log(".dbtoken file not found, creating .dbtoken");
    const connectionObject: PoolConfig = {
        host: "",
        port: 0,
        user: "",
        password: "",
        database: ""
    };
    fs.writeFileSync("./.dbtoken", JSON.stringify(connectionObject, null, 4));
    console.log("Please fill out .dbtoken with the database connection info");
    process.exit(0);
}

pool.getConnection((err: MysqlError, connection: PoolConnection) => {
    if (err) {
        console.error(err);
    }
    if (connection) {
        console.log("Established connection with database");
        connection.release();
    }
});

function customCaster( field: ICasterFieldInfo, next: () => void): any {
    if (field.type === "BIT") {
        // convert the field into a list of bits, least significant at index 0
        const bytes: Buffer = field.buffer();
        return bytes[0] === 1;
    }
    return next();
}

interface ICasterFieldInfo extends FieldInfo {
    type: any;
    length: number;
    string(): string;
    buffer(): Buffer;
    geometry(): null | GeometryType;
}

module.exports = pool; // here for javascript compatibility
export default pool;
