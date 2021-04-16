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

const queryPgTableConstraints = (targetTableOID = 0, foreignKey = false) => {
    let constQueryConditions = "";
    if (targetTableOID > 0) {
        constQueryConditions += " AND c.conrelid = " + targetTableOID;
        if (foreignKey) {
            constQueryConditions += " AND c.contype = 'f'";
        }
    }
    return `SELECT c.oid, c.conname, c.contype, c.conrelid, c.conkey, c.confrelid, c.confkey, pg_catalog.pg_get_constraintdef(c.oid)
        AS con_def FROM pg_catalog.pg_constraint c
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.connamespace 
        WHERE n.nspname = 'public'${constQueryConditions};`;
}

const queryPgTableForeignKeys = (targetTableOID = 0) => {
    let constQueryConditions = "";
    if (targetTableOID > 0) {
        constQueryConditions += " AND c1.conrelid = " + targetTableOID;
        constQueryConditions += " AND c1.contype = 'f'";
    }
    return `SELECT c1.oid, c1.conname, c1.contype, c1.conrelid, c1.conkey, c1.confrelid, c1.confkey, 
        c2.relname as confname, pg_catalog.pg_get_constraintdef(c1.oid)
        AS con_def FROM pg_catalog.pg_constraint c1
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c1.connamespace
        INNER JOIN pg_catalog.pg_class c2 ON c1.confrelid = c2.oid
        WHERE n.nspname = 'public'${constQueryConditions};`;
}

const queryPgAttributesByTable = (targetTableOID) => {
    if (targetTableOID > 0) {
        return `SELECT a.attname, a.attlen, a.attnum, a.attndims, t.typname, t.typcategory, a.attrelid, c.relname from pg_catalog.pg_attribute a
            INNER JOIN pg_catalog.pg_type t ON a.atttypid = t.oid
            INNER JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND a.attnum >= 0 AND a.attrelid = ${targetTableOID}
            ORDER BY a.attnum;`;
    } else {
        throw new Error("targetTableOID not positive");
    }
}

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

async function singlePoolRequest(query) {
    const pool = new Pool(connConfig);
    pool.on("error", (err, client) => errorHandling(err));

    poolQuery = await pool.query(query);
    pool.end();

    return poolQuery["rows"];
}

async function getTableForeignKeys(oid) {
    const pool = new Pool(connConfig);
    pool.on("error", (err, client) => errorHandling(err));
    let thisQuery = queryPgTableForeignKeys(oid);

    poolQuery = await pool.query(thisQuery);
    pool.end();

    return poolQuery["rows"];
}

async function getTableNames() {
    return singlePoolRequest(queryPgTableNames);
}

async function getTableAttributes(oid) {
    return singlePoolRequest(queryPgAttributesByTable(oid));
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

module.exports = { getTableInfo, getTableNames, getTableForeignKeys, getTableAttributes }