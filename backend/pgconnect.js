const { Pool } = require("pg");
const YAML = require("yaml");
const fs = require("fs");
const { exception } = require("console");

// SQL boilerplates
const dataSelectByTableNameAndFields = (tableName, fields) => `SELECT ${fields.length === 0 ? "*" : fields.join(", ")} FROM ${tableName};`;

const dataSelectByRelationshipsQuery = (attrs, fks, parentTableNames, primaryKeys) => {
    // If no parent table has been selected, or no attrs/fks/pks has been selected, return undefined
    if (parentTableNames.length === 0) {
        return undefined;
    }
    
    if ((attrs[0] === undefined || attrs[0].length === 0) && (attrs[1] === undefined || attrs[1].length === 0)) {
        if (primaryKeys === undefined || primaryKeys.length === 0) {
            if (fks === undefined || fks.length === 0) {
                return undefined;           
            }
        }
    }


    primaryKeyAttributeQueries = primaryKeys.map(pk => {
        const columnName = pk["columnName"],
            listIndex = pk["listIndex"];
        return `t${listIndex}.${columnName} AS pk_${parentTableNames[listIndex]}_${columnName}`;
    }).join(", ");

    let listedTables = [];
    let lastRoundUnprocessedForeignKeys = [];
    let unprocessedForeignKeys = [];
    
    const [mandatoryAttrs, optionalAttrs] = attrs;

    let mandatoryAttrQueries = "";
    if (mandatoryAttrs !== null && mandatoryAttrs !== undefined && mandatoryAttrs.length > 0 && !mandatoryAttrs.every(attr => attr === undefined)) {
        mandatoryAttrQueries = mandatoryAttrs.map(attr => {
            const listIndex = attr["listIndex"];
            const columnName = attr["columnName"];
            return `t${listIndex}.${columnName} AS a_${parentTableNames[listIndex]}_${columnName}`;
        }).join(", ");
    }
    
    let optionalAttrQueries = "";
    if (optionalAttrs !== null && optionalAttrs !== undefined && optionalAttrs.length > 0 && !optionalAttrs.every(attr => attr === undefined)) {
        optionalAttrQueries = optionalAttrs.map(attr => {
            const listIndex = attr["listIndex"];
            const columnName = attr["columnName"];
            return `t${listIndex}.${columnName} AS a_${parentTableNames[listIndex]}_${columnName}`;
        }).join(", ");
    }

    
    let attrQueries = "";
    if (mandatoryAttrQueries !== "") attrQueries = ", " + mandatoryAttrQueries;
    if (optionalAttrQueries !== "") attrQueries = attrQueries + ", " + optionalAttrQueries;
    // console.log(attrQueries);

    const convertFKToQueryFunc = (fk) => {
        let {t1, t2, attrs} = fk;
        t1 = parseInt(t1);
        t2 = parseInt(t2);
        const t1Name = parentTableNames[t1],
        t2Name = parentTableNames[t2];
        
        const t1IsListed = listedTables.includes(t1),
        t2IsListed = listedTables.includes(t2);
        if (t1IsListed && t2IsListed) {
            return;
        }
        if (!t1IsListed && !t2IsListed) {
            if (listedTables.length !== 0) {
                // This pair 
                unprocessedForeignKeys.push(fk);
                return;
            }
            listedTables.push(t1, t2);
            return `${t1Name} AS t${t1} INNER JOIN ${t2Name} AS t${t2} ON ${attrs.map(attr => `t${t1}.${attr[0]}=t${t2}.${attr[1]}`).join(" AND ")}`
        }
        if (!t1IsListed) {
            listedTables.push(t1);
            return `INNER JOIN ${t1Name} AS t${t1} ON ${attrs.map(attr => `t${t1}.${attr[0]}=t${t2}.${attr[1]}`).join(" AND ")}`
        } else {
            listedTables.push(t2);
            return `INNER JOIN ${t2Name} AS t${t2} ON ${attrs.map(attr => `t${t1}.${attr[0]}=t${t2}.${attr[1]}`).join(" AND ")}`
        }
    }

    tableJoinQueries = fks.length === 0 ? [`${parentTableNames[0]} AS t0`] : fks.map(convertFKToQueryFunc);
    
    while (lastRoundUnprocessedForeignKeys.length !== unprocessedForeignKeys.length) {
        lastRoundUnprocessedForeignKeys = unprocessedForeignKeys;
        unprocessedForeignKeys = [];
        tableJoinQueries.push(...lastRoundUnprocessedForeignKeys.map(convertFKToQueryFunc));
    }

    if (unprocessedForeignKeys.length > 0) {
        throw new Error("Some relations are disjoint.")
    }

    const completedQuery = `SELECT ${primaryKeyAttributeQueries} ${attrQueries} FROM ${tableJoinQueries.join(" ")};`;
    // console.log(completedQuery)

    return completedQuery;
}
const dataSelectMultiTablesQuery = (attrs, fks, parentTableName, primaryKeys) => {
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
    const attrsQuery = attrs.map(attr => attr["tableName"] + "." + attr["columnName"]).join(", ");
    const primaryKeyQueries = [].concat(...primaryKeys.map(pk => {
        if (Array.isArray(pk)) {
            return pk.map(col => col["tableName"] + "." + col["columnName"])
        } else {
            return [pk["tableName"] + "." + pk["columnName"]]
        }
    })).join(", ");
    const connector = primaryKeyQueries === "" ? "" : ","

    return `SELECT ${attrsQuery} ${connector} ${primaryKeyQueries} FROM ${joinStatement(fks, parentTableName)}`
}

/**
 * Creates a SQL query to construct a pivot table.
 * @param {*} tableName the name of the table to be pivoted.
 * @param {*} keyAtts attributes used to conjoin the pivoted tables
 * @param {*} pivotAtt attribute (singular) to be separated from the original table
 * @param {*} conditionAtt attribute (singular) to be used as condition for value extraction
 * @param {*} values values to equate to @pivotAtt
 */
const pivotTableQuery = (tableName, keyAtts, pivotAtt, conditionAtt, values) => {
    const keyColumnNames = keyAtts.map(v => `e1.${v}`).join(", ");
    const columnNames = keyColumnNames  + ", " +  values.map((v, i) => `e${i}.${pivotAtt} AS ${pivotAtt}_${v}`).join(", ")
    const tableNames = `${tableName} AS e0` + values.map((v, i) => {
        if (i == 0) return "";
        else return `INNER JOIN ${tableName} AS e${i} ON ${keyAtts.map(att => `e0.${att}=e${i}.${att}`).join(", ")}`
    }).join(" ")
    const conditions = values.map((v, i) => `e${i}.${conditionAtt}=${v}`).join(" AND ")
    return `SELECT ${columnNames} FROM ${tableNames} WHERE ${conditions} ORDER BY (${keyColumnNames});`;
}

const columnCounts = (tableName, fieldNames) => {
    const distQuery = fieldNames.map((name, idx) => `COUNT(${name}) AS count_${idx}, COUNT(DISTINCT(${name})) AS distinct_${idx}`).join(", ")
    return `SELECT ${distQuery} FROM ${tableName};`
};
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

        // Counting the number of distinct public keys
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

        return Promise.all(tableObjects.map(table => {            
            return getTableDistinctColumnCountByColumnName(table["tableName"], table["attr"].map(att => att["attname"]));
        }))
    }).then(res => {
        res.forEach((tableRes, tableIdx) => {
            const thisTableResult = tableRes[0];
            Object.keys(thisTableResult).forEach(k => {
                const keySplit = k.split("_");
                const keyNameForAtt = keySplit[0] === "count" ? "attCount" : "attDistinctCount";
                const count = thisTableResult[k];
                const attIdx = keySplit[1];
                tableObjects[tableIdx]["attr"][attIdx][keyNameForAtt] = parseInt(count);
            })
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

async function getDataMultiTable(attrs, fks, parentTableName, primaryKeys) {
    const query = dataSelectMultiTablesQuery(attrs, fks, parentTableName, primaryKeys);
    return await singlePoolRequest(query);
}

async function getDataRelationshipBased(attrs, fks, parentTableName, primaryKeys) {
    const query = dataSelectByRelationshipsQuery(attrs, fks, parentTableName, primaryKeys);
    if (query === undefined) {
        return {};
    }
    return await singlePoolRequest(query);
}

async function getTableDistinctColumnCountByColumnName(tableName, columnNames) {
    const query = columnCounts(tableName, columnNames);
    // console.log(query);
    return await singlePoolRequest(query);
}

async function getPivotTable(tableName, keyAtts, pivotAtt, conditionAtt, values) {
    const query = pivotTableQuery(tableName, keyAtts, pivotAtt, conditionAtt, values);
    // console.log(query)
    return await singlePoolRequest(query);
}

let groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};

module.exports = { getTableForeignKeys, getTablePrimaryKeys, getTableAttributes, getDataMultiTable, getTableMetatdata,
    getTableDistinctColumnCountByColumnName, getDataRelationshipBased, getPivotTable
};