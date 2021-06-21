import { PatternMatchAttribute, PatternMatchResult, VISSCHEMATYPES } from "./ts/types";

export const getAllTableMetadata = () => {
    // TODO/Work under progress: new backend hook
    return fetch('http://localhost:3000/tables')
        .then(rawResponse => rawResponse.json())
        .then(res => {
            return res;
        });
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

export async function getDataByMatchAttrs(attrs: PatternMatchAttribute[][], patternMatchResult: PatternMatchResult) {
    const [mandatoryAttrs, optionalAttrs] = attrs;
    const responsibleRelation = patternMatchResult.responsibleRelation;

    const allDefinedAttrs = [...mandatoryAttrs, ...optionalAttrs].filter(attr => attr !== undefined && attr !== null);

    // Find the foreign keys that links the selected attributes
    const attrsMappedToQuery = allDefinedAttrs.map(matchedAttrs => {
        return {
            tableName: matchedAttrs.table.tableName,
            columnName: matchedAttrs.table.attr[matchedAttrs.attributeIndex].attname
        }
    });

    const queryGroupedByTableName: {[tableName: string]: object}[] = groupBy(attrsMappedToQuery, "tableName");
    let query;

    if (Object.keys(queryGroupedByTableName).length == 0) {
        console.log("No table found")
        return;
    } else if (Object.keys(queryGroupedByTableName).length == 1) {
        query = {
            attrs: attrsMappedToQuery,
            parentTableName: Object.keys(queryGroupedByTableName)[0]
        };
    } else {
        // For each of the grouped tables, find the foreign keys connecting each of the tables
        if (responsibleRelation && responsibleRelation.type === VISSCHEMATYPES.SUBSET) {
            const childEntityFkCols = 
                responsibleRelation.childRelations
                    .filter(childRels => childRels.table.tableName in queryGroupedByTableName)
                    .map(childRels => {
                        return {
                            fkTableName: childRels.table.tableName,
                            pkTableName: responsibleRelation.parentEntity.tableName,
                            linkedColumns: childRels.table.fk[childRels.fkIndex].columns.map(fkCol => {
                                return {
                                    fkColName: fkCol.fkColName,
                                    pkColName: fkCol.pkColName,
                                }
                            }
                        )};
                    });
            query = {
                attrs: attrsMappedToQuery,
                foreignKeys: childEntityFkCols,
                parentTableName: responsibleRelation.parentEntity.tableName
            };
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

let groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};