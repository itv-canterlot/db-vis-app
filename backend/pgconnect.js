const { Pool } = require("pg");
const YAML = require("yaml");
const fs = require("fs");

// SQL boilerplates
const queryGeneralInfoSchema = "SELECT * FROM information_schema.tables WHERE table_schema = 'public';"
const queryTableNames = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
const queryTableColumns = "SELECT table_name FROM information_schema.columns WHERE table_schema = 'public';"
const queryColumnInfoSchema = (tableName) => `SELECT * FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${tableName}';`

const queryPgCatConstraints = 
    `SELECT c.oid, c.conname, c.contype, c.conrelid, c.conkey, c.confrelid, c.confkey, pg_catalog.pg_get_constraintdef(c.oid)
        AS con_def FROM pg_catalog.pg_constraint c
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.connamespace 
        WHERE n.nspname = 'public';`;

const queryPgAttributes = 
    `SELECT a.attname, a.attlen, a.attnum, a.attndims, t.typname, t.typcategory, a.attrelid, c.relname from pg_catalog.pg_attribute a
        INNER JOIN pg_catalog.pg_type t ON a.atttypid = t.oid
        INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND a.attnum >= 0 AND c.relkind = 'r';`;

const queryPgTableNames = 
    `SELECT c.oid as oid, c.relname FROM pg_catalog.pg_class c
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.reltype > 0 AND c.relkind = 'r'
        ORDER BY relname;`;

const connConfigFile = fs.readFileSync("./pg-connection.yaml", {encoding: "utf8"});
connConfig = YAML.parse(connConfigFile);

function errorHandling(err) {
    console.log("TODO: to be properly implemented");
    throw err;
}

// Packaged function to talk to the database to retrieve table schemas, grouped by table names
// async function getTableInfo() {
//     const pool = new Pool(connConfig);
//     pool.on("error", (err, client) => errorHandling(err));

//     let tableList = await pool.query(queryTableNames);
//     console.log(tableList);
//     tablesRawSchema = {};
//     for (let tt of tableList.rows) {
//         let tableName = tt["table_name"];
//         tablesRawSchema[tableName] = await pool.query(queryColumnInfoSchema(tableName));
//         tablesRawSchema[tableName] = tablesRawSchema[tableName]["rows"];
//     }

//     pool.end();
//     return tablesRawSchema;
// }

async function getTableNames() {
    const pool = new Pool(connConfig);
    pool.on("error", (err, client) => errorHandling(err));

    let tableNames = await pool.query(queryPgTableNames);
    pool.end();
    
    tableNames = tableNames["rows"];
    return tableNames;
}

async function getTableInfo(constraints = true, rels = true) {
    const pool = new Pool(connConfig);
    let out = [];
    pool.on("error", (err, client) => errorHandling(err));

    if (constraints) {
        let catConstraints = await pool.query(queryPgCatConstraints);
        catConstraints = catConstraints["rows"];
        out.push(catConstraints);
    }

    if (rels) {
        let catRels = await pool.query(queryPgAttributes);
        catRels = catRels["rows"];
        out.push(catRels);
    }

    pool.end();
    return out;
}

module.exports = { getTableInfo, getTableNames }

// pool.connect()
//     .then(async client => {
//         try {
//             const res = await client
//                 .query(queryTableNames);
//             tableList = res["rows"].map(elem => elem["table_name"]);
//             client.release();
//             return tableList;
//         } catch (err_1) {
//             client.release();
//             errorHandling(err_1);
//         }
//     })

// (async () => {
//     const client = await pool.connect();
//     try {
//         // Retrieve names 
//         const res = await client.query(queryTableNames);
//         const dbTablesList = res["rows"].map(elem => elem["table_name"]);
//         console.log(dbTablesList);
//         dbTablesList.forEach(tableName => {
//             console.log(tableName)
//         });
//         client.release();
//     } catch (err) {
//         client.release();
//         errorHandling(err);
//     }
// })();

// pool
//     .connect()
//     .then(client => {
//     return client
//         .query(queryTableNames)
//         .then(res => {
//             client.release();
//             tableList = res["rows"].map(elem => elem["table_name"]);
//         })
//         .catch(err => {
//             client.release();
//             errorHandling(err);
//         })
// })

// pool.query(queryTableNames, (err, res) => {
//     if (err != null) {
//         // Error when connecting to the DB server
//         errorHandling(err);
//     }
//     try {
//         // Retrieve names 
//         const dbTablesList = res["rows"].map(elem => elem["table_name"]);
//         console.log(dbTablesList);
//         dbTablesList.forEach(tableName => {
//             console.log(tableName)
//             pool.query(queryColumnInfoSchema(tableName), (err, res) => {
//                 if (err != null) {
//                     errorHandling(err);
//                 }
//             })
//         });
//         pool.end();
//     } catch (err) {
//         errorHandling(err);
//     }
// });