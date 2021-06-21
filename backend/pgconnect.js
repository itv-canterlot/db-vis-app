const { Pool } = require("pg");
const YAML = require("yaml");
const fs = require("fs");
const { exception } = require("console");

// SQL boilerplates
const dataSelectByTableNameAndFields = (tableName, fields) => `SELECT ${fields.length === 0 ? "*" : fields.join(", ")} FROM ${tableName};`;

const dataSelectMultiTables = (attrs, fks, parentTableName) => {
    const allTableNames = attrs.map(attr => attr["tableName"])
    const joinStatement = (fks, parentTableName) => {
        let statement = parentTableName;
        if (fks) {
            statement = statement + fks
                .map(fkCols => {
                    const {fkTableName, pkTableName, linkedColumns} = fkCols;
                    const columnConstrinatsMap = linkedColumns.map(fks => {
                        const
                            pkColName = fks["pkColName"],
                            fkColName = fks["fkColName"];
                        return `${pkTableName}.${pkColName}=${fkTableName}.${fkColName}`
                    }).join(" AND ");
                    return ` JOIN ${fkTableName} ON ${columnConstrinatsMap}`;
                }).join(" ")
        }
        return statement;
    }
    return `SELECT ${attrs.map(attr => attr["tableName"] + "." + attr["columnName"]).join(", ")} FROM ${joinStatement(fks, parentTableName)}`
}

const dataSelectAllColumnsByTableName = (tablename) => `SELECT * FROM ${tableName};`;

const individualCountsByColumn = (tableName, fieldName) => `SELECT COUNT(${fieldName}) as count, COUNT(DISTINCT ${fieldName}) as distinct_count FROM ${tableName};`;
const totalCountByColumnGroup = (tableName, fieldNames) => `SELECT COUNT(*) from (SELECT ${fieldNames.join(", ")} FROM ${tableName}) t;`;

/* PostgreSQL oriented queries */
const queryPgCatConstraints = 
    `SELECT c.oid, c.conname, c.contype, c.conrelid, c.conkey, c.confrelid, c.confkey, pg_catalog.pg_get_constraintdef(c.oid)
        AS con_def FROM pg_catalog.pg_constraint c
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.connamespace 
        WHERE n.nspname = 'public';`;

const queryPgTableForeignKeys = (targetTableOID = 0) => {
    let constQueryConditions = "";
    if (targetTableOID > 0) {
        constQueryConditions += " AND c1.conrelid = " + targetTableOID;
        constQueryConditions += " AND c1.contype = 'f'";
    }
    return `SELECT c1.oid, c1.conname, c1.conkey, c1.confrelid, c1.confkey, 
        c2.relname as confname, pg_catalog.pg_get_constraintdef(c1.oid)
        AS con_def FROM pg_catalog.pg_constraint c1
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c1.connamespace
        INNER JOIN pg_catalog.pg_class c2 ON c1.confrelid = c2.oid
        WHERE n.nspname = 'public'${constQueryConditions};`;
}

const queryPgTablePrimaryKeys = (targetTableOID = 0) => {
    let constQueryConditions = "";
    if (targetTableOID > 0) {
        constQueryConditions += " AND c1.conrelid = " + targetTableOID;
        constQueryConditions += " AND c1.contype = 'p'";
    }
    return `SELECT c1.oid, c1.conname, c1.conkey,
        pg_catalog.pg_get_constraintdef(c1.oid) AS con_def 
        FROM pg_catalog.pg_constraint c1
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c1.connamespace
        WHERE n.nspname = 'public'${constQueryConditions};`;
    }
    
const queryPgAttributesByTable = (targetTableOID) => {
    if (targetTableOID > 0) {
        return `SELECT a.attname, a.attlen, a.attnum, a.attndims, t.typname, t.typcategory, a.attrelid from pg_catalog.pg_attribute a
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
/* ENDS */

const queryTableForeignKeys = (tableName = undefined) => {
    let constQueryConditions = "";
    if (tableName !== undefined) {
        constQueryConditions += " AND primary_key.table_name = '" + tableName + "'";
    }
    return `SELECT foreign_key.constraint_name,
            foreign_key.table_name AS fk_table,
            fk_column_usage.column_name AS fk_column,
            primary_key.table_name AS pk_table,
            pk_column_usage.column_name AS pk_column
            FROM   information_schema.table_constraints AS foreign_key
                JOIN information_schema.key_column_usage AS fk_column_usage
                ON   foreign_key.constraint_name=fk_column_usage.constraint_name
                JOIN information_schema.referential_constraints
                ON   foreign_key.constraint_name=referential_constraints.constraint_name
                JOIN information_schema.table_constraints AS primary_key
                ON   referential_constraints.unique_constraint_name=primary_key.constraint_name
                JOIN information_schema.key_column_usage AS pk_column_usage
                ON   primary_key.constraint_name=pk_column_usage.constraint_name
                AND  pk_column_usage.ordinal_position=fk_column_usage.ordinal_position
            WHERE  foreign_key.constraint_type='FOREIGN KEY'${constQueryConditions}
            AND    foreign_key.constraint_schema='public'
            ORDER BY foreign_key.table_name, fk_column_usage.ordinal_position;`;
}

const queryTablePrimaryKeys = (tableName = undefined) => {
    let constQueryConditions = "";
    if (tableName !== undefined) {
        constQueryConditions += " AND table_constraints.table_name = '" + tableName + "'";
    }
    return `SELECT table_constraints.constraint_name, table_constraints.table_name, column_name
                FROM information_schema.table_constraints 
                    JOIN information_schema.key_column_usage
                        ON table_constraints.constraint_name = key_column_usage.constraint_name
                WHERE table_constraints.constraint_type='PRIMARY KEY'
                    AND table_constraints.constraint_schema='public'${constQueryConditions}
                ORDER BY table_name, ordinal_position;`;
}

const queryAttributesByTable = (tableName) => 
    `SELECT tables.table_name, ordinal_position, column_name, data_type, is_nullable
        FROM information_schema.tables 
            JOIN information_schema.columns 
            ON information_schema.tables.table_name=information_schema.columns.table_name
        WHERE tables.table_schema='public' AND tables.table_name = '${tableName}'
        ORDER BY tables.table_name,
            ordinal_position;`

const queryTableAttributes = () => 
    `SELECT tables.table_name, ordinal_position, column_name, data_type, is_nullable
        FROM information_schema.tables 
            JOIN information_schema.columns 
            ON information_schema.tables.table_name=information_schema.columns.table_name
        WHERE tables.table_schema='public'
        ORDER BY tables.table_name,
            ordinal_position;`

const queryTableNames = 
    `SELECT table_name FROM information_schema.tables 
        WHERE tables.table_schema = 'public'
        ORDER BY table_name`;

const queryTableColumns = (tableName) =>
    `SELECT column_name
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'`;

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

async function getTablePrimaryKeys(tableName) {
    const pool = new Pool(connConfig);
    pool.on("error", (err, client) => errorHandling(err));
    // let thisQuery = queryPgTablePrimaryKeys(oid);
    let thisQuery = queryTablePrimaryKeys(tableName)

    poolQuery = await pool.query(thisQuery);
    pool.end();

    return poolQuery["rows"][0];
}

async function getTableForeignKeys(tableName) {
    const pool = new Pool(connConfig);
    pool.on("error", (err, client) => errorHandling(err));
    let thisQuery = queryTableForeignKeys(tableName);

    poolQuery = await pool.query(thisQuery);
    pool.end();

    return poolQuery["rows"];
}

function attrMatchDename(name, keys, attrName) {
    let matchedKeys = keys.filter(key => key[attrName] === name);
    matchedKeys.forEach(key => delete key[attrName]);

    return matchedKeys
}

const findColumnPosByName = (attributes, columnName) => {
    // Middle of transition, search both keys
    let thisKeyAtt = attributes.find(att => att["attname"] === columnName);
    if (thisKeyAtt === undefined) {
        thisKeyAtt = attributes.find(att => att["column_name"] === columnName);
    }

    let keyPos = thisKeyAtt["ordinal_position"] === undefined ? thisKeyAtt["attnum"] : thisKeyAtt["ordinal_position"];
    return keyPos;
}

async function getTableMetatdata() {
    const tableNamesRes = await getTableNames();
    let pk = await singlePoolRequest(queryTablePrimaryKeys());
    let fk = await singlePoolRequest(queryTableForeignKeys());
    let attrs = await singlePoolRequest(queryTableAttributes());


    let tableObjects = tableNamesRes.map((tn, idx) => {
        let tableName = tn["table_name"]
        let tablePks = attrMatchDename(tableName, pk, "table_name");
        let tableFks = attrMatchDename(tableName, fk, "fk_table");
        let tableAtts = attrMatchDename(tableName, attrs, "table_name");
        
        return {
            tableName: tableName,
            pk: tablePks.length == 0 ? null : tablePks,
            fk: tableFks,
            attr: tableAtts,
            idx: idx
        }
    });

    let tablePkCountPromises = tableObjects.map(table => {
        const tableFks = table["fk"], tablePks = table["pk"], tableAtts = table["attr"], tableName = table["tableName"];

        table["attr"] = tableAtts.map(att => {
            return {
                "attname": att["column_name"],
                "typname": att["data_type"],
                "isNullable": att["is_nullable"],
                "attnum": att["ordinal_position"]
            }
        });

        // Grouping PK columns together into one object
        let tablePksColumns;
        if (tablePks && tablePks.length !== 0) {
            tablePksColumns = tablePks.map(key => {
                const thisKeyColumnName = key["attname"] === undefined ? key["column_name"] : key["attname"];
                return {
                    "colName": thisKeyColumnName,
                    "colPos": findColumnPosByName(tableAtts, thisKeyColumnName)
                };
            });
        }

        // Grouping FKs by their names, affixiating their ordinal positions in their respective tables
        let tableFksGrouped = groupBy(tableFks, "constraint_name");
        let tableFksProcessed = [];
        for (const [conName, keys] of Object.entries(tableFksGrouped)) {
            const pkTableName = keys[0]["pk_table"];
            const columns = keys.map(k => {
                return {
                    "fkColName": k["fk_column"],
                    "fkColPos": findColumnPosByName(tableAtts, k["fk_column"]),
                    "pkColName": k["pk_column"],
                    "pkColPos": findColumnPosByName(tableObjects.find(tt => tt["tableName"] === k["pk_table"])["attr"], k["pk_column"]),
                };
            });
    
            let newFkObject = {
                "keyName": conName,
                "pkTableName": pkTableName,
                "columns": columns
            }
            tableFksProcessed.push(newFkObject);
        }
        table["fk"] = tableFksProcessed;

        if (tablePks && tablePks.length > 0) {
            table["pk"] = {
                "keyName": tablePks[0]["constraint_name"],
                "columns": tablePksColumns,
            };
            const pkCountQuery = totalCountByColumnGroup(tableName, tablePksColumns.map(col => col["colName"]));
            return singlePoolRequest(pkCountQuery).then(res => {
                return res[0]["count"]
            });
        } else {
            return new Promise((resolver, rejector) => {
                resolver(null);
                rejector(null);
            });
        }
    });

    return Promise.all(tablePkCountPromises).then(res => {
        res.forEach((count, idx) => {
            if (count != null) {
                tableObjects[idx]["pk"]["keyCount"] = parseInt(count);
            }
        })
        return tableObjects;
    });


}

async function getTableNames() {
    return singlePoolRequest(queryTableNames);
}

async function getTableAttributes(tableName) {
    return singlePoolRequest(queryAttributesByTable(tableName));
}

async function getDataMultiTableQuery(attrs, fks, parentTableName) {
    const query = dataSelectMultiTables(attrs, fks, parentTableName);
    return await singlePoolRequest(query);
}

async function getTableDistinctColumnCountByColumnName(tableName, columnNames) {
    columnCountPromises = columnNames.map(val => singlePoolRequest(individualCountsByColumn(tableName, val)));
    return Promise.all(columnCountPromises).then(columnRes => {
        columnRes = columnRes.map(val => val[0]);
        for (let i = 0; i < columnRes.length; i++) {
            columnRes[i]["columnName"] = columnNames[i];
        }
        return columnRes;
    });
}

let groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};

module.exports = { getTableForeignKeys, getTablePrimaryKeys, getTableAttributes, getDataMultiTableQuery, getTableMetatdata,
    getTableDistinctColumnCountByColumnName
};