
import { Filter, PatternMatchAttribute, PatternMatchResult, Query, QueryAttribute, QueryAttributeGroup, QueryForeignKeys, RelationNode, Table, VISSCHEMATYPES } from "./ts/types";

export const getAllTableMetadata = () => {
    // TODO/Work under progress: new backend hook
    const rawFetch = fetch('http://localhost:3000/tables')
        .then(rawResponse => {
            if (rawResponse.ok) {
                return rawResponse.json()
            } else {
                throw new Error("Connection failed")
            }
        }).catch(rej => {
            return undefined;
        });
        
    return rawFetch.then(res => {
        return res;
    })
        
}

// Loads schema files
export async function readVisSchemaJSON() {
    return fetch('http://localhost:3000/vis-encodings')
        .then(rawResponse => rawResponse.json())
        .then(res => {
            return res;
        });
}

export async function getTableDistCounts(tableName:string, columnNames?:string[]) {
    const rawResponse = fetch("http://localhost:3000/table-dist-counts", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            "tableName": tableName,
            "columnNames": columnNames === undefined ? [] : columnNames
        }),  
    });

    return rawResponse.then(val => {
        return val.json();
    });
}

export async function getDataFromSingleTableByName(tableName:string, columnNames?:string[]) {
    const rawResponse = fetch("http://localhost:3000/data-single-table-name-fields", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            "tableName": tableName,
            "columnNames": columnNames === undefined ? [] : columnNames
        }),  
    });

    return rawResponse.then(val => {
        return val.json();
    });
}

const mapTablePublicKeyColumnsToQuery = (table: Table) => {
    return table.pk.columns
        .map(col => {
            return {
                tableName: table.tableName,
                columnName: col.colName 
            }
});
}

const getSingleTableQuery = (table: Table, attQueries: QueryAttribute[], params?: object) => {
    const tablePublicKeyColumnQueries = 
        mapTablePublicKeyColumnsToQuery(table);
    return {
        attrs: attQueries,
        parentTableName: table.tableName,
        primaryKeys: tablePublicKeyColumnQueries,
        params: params
    };
}

const getMultiTableQuery = (parentTableName: string, tables: Table[], attQueries: QueryAttribute[], queryFks: QueryForeignKeys[], params?: object) => {
    const primaryKeyCols = Object.keys(tables).map(tableName => {
        const thisTable = tables[tableName];
        return mapTablePublicKeyColumnsToQuery(thisTable);
    })
    return {
        attrs: attQueries,
        foreignKeys: queryFks,
        parentTableName: parentTableName,
        primaryKeys: primaryKeyCols,
        params: params
    };
}

const getFkColsQueriesByTables = (pkTable: Table, fkTable: Table, fkIndex: number) => {
    return {
        fkTableName: fkTable.tableName,
        pkTableName: pkTable.tableName,
        linkedColumns: fkTable.fk[fkIndex].columns.map(fkCol => {
            return {
                fkColName: fkCol.fkColName,
                pkColName: fkCol.pkColName,
            }
        }
    )}
}

const getFkColsQueriesByRels = (rel: RelationNode, queryAttributeGroup: QueryAttributeGroup[]) => {
    return rel.childRelations
        .filter(childRels => childRels.table.tableName in queryAttributeGroup)
        .map(childRels => {
            return getFkColsQueriesByTables(rel.parentEntity, childRels.table, childRels.fkIndex);
        });
}

export async function getDataByMatchAttrs(attrs: PatternMatchAttribute[][], patternMatchResult: PatternMatchResult) {
    const [mandatoryAttrs, optionalAttrs] = attrs;
    const responsibleRelation = patternMatchResult.responsibleRelation;

    const allDefinedAttrs = [...mandatoryAttrs, ...optionalAttrs].filter(attr => attr !== undefined && attr !== null);

    // Find the foreign keys that links the selected attributes
    // First group the attributes by their table
    let queryInvolvedTables: {[tableName: string]: Table} = {};
    const attrsMappedToQuery = allDefinedAttrs.map(matchedAttrs => {
        const matchedAttrsTable = matchedAttrs.table;
        if (!Object.keys(queryInvolvedTables).includes(matchedAttrsTable.tableName)) {
            queryInvolvedTables[matchedAttrsTable.tableName] = matchedAttrsTable;
        }
        return {
            tableName: matchedAttrsTable.tableName,
            columnName: matchedAttrsTable.attr[matchedAttrs.attributeIndex].attname
        }
    });

    const queryGroupedByTableName: QueryAttributeGroup[] = groupBy(attrsMappedToQuery, "tableName");
    
    let query: Query;
    // Split depending on the number of tables involved
    if (Object.keys(queryGroupedByTableName).length == 0) {
        console.log("No table found")
        return;
    } else if (Object.keys(queryGroupedByTableName).length == 1) {
        const tableName = Object.keys(queryGroupedByTableName)[0];
        const queryAttributes = queryGroupedByTableName[tableName];
        const thisTable = queryInvolvedTables[tableName];

        query = getSingleTableQuery(thisTable, queryAttributes);
    } else {
        // For each of the grouped tables, find the foreign keys connecting each of the tables
        if (responsibleRelation && responsibleRelation.type === VISSCHEMATYPES.SUBSET) {
            const childEntityFkCols = getFkColsQueriesByRels(responsibleRelation, queryGroupedByTableName);
            query = 
                getMultiTableQuery(
                    responsibleRelation.parentEntity.tableName, 
                    Object.keys(queryInvolvedTables).map(key => queryInvolvedTables[key]), 
                    attrsMappedToQuery, 
                    childEntityFkCols
                )
        } else {
            throw new Error("Not implemented")
        }
    }

    
    const rawResponse = fetch("http://localhost:3000/data-match-attrs", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(query),  
    })

    return rawResponse.then(val => {
        return val.json();
    }).catch(err => {
        // TODO
        throw(err);
    });
}

export async function getFilteredData(baseTable: Table, allEntities: Table[], filters?: Filter[]) {
    let query: Query;

    // Find filters that have foreign key involved
    const filtersWithFK = filters.filter(f => f.fkIndex !== undefined);
    
    if (filtersWithFK.length == 0) {
        // Filter is based on a single table
        query = getSingleTableQuery(baseTable, undefined, {"filters": filters})
    } else {
        let queryInvolvedTables: {[tableName: string]: Table} = {};
        filters.forEach(filter => {
            const thisTable = allEntities[filter.tableIndex];
            if (!Object.keys(queryInvolvedTables).includes(thisTable.tableName)) {
                queryInvolvedTables[thisTable.tableName] = thisTable;
            }
        })

        const queryFks = filtersWithFK.map(filter => {
            const fkTable = allEntities[filter.tableIndex];
            return getFkColsQueriesByTables(baseTable, fkTable, filter.fkIndex);
        });
        query = getMultiTableQuery(
            baseTable.tableName, 
            Object.keys(queryInvolvedTables).map(k => queryInvolvedTables[k]), 
            undefined, 
            queryFks,
            {
                "filters": filters
            }
        );
    }

    console.log(query);
    
}


let groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};