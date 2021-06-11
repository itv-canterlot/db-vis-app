import { Table, RelationNode, VISSCHEMATYPES, ForeignKey, PrimaryKey, ChildRelation } from './ts/types';

const getKeyPosFromPK = (pk: PrimaryKey) => pk.columns.map(key => key.colPos);
const getKeyPosFromFK = (fk: ForeignKey) => fk.columns.map(key => key.fkColPos);

/**
 * Find out if the entity is a weak entity, and if so, which entity does it lead to.
 * @param table Table in question
 * @returns Empty array if the entity is not a weak entity. Otherwise the array contains all foreign keys 
 * that formed a subset of the primary key. 
 */
 const getWeakEntityStatus = (table: Table) => {
    // An entity is a weak entity if:
    // > It has a compound key
    // > A proper subset of those key attributes are foreign
    // First - check the existance of PK/FK
    if (!tableHasPKAndFK(table)) return [];
    const conkeyLength = table.pk.columns ? table.pk.columns.length : 0;

    let subsetKeyIdx: number[] = []; // TODO: should I also pass this on?
    for (let i = 0; i < table.fk.length; i++) {
        let fkElem = table.fk[i];
        let fkKeys = getKeyPosFromFK(fkElem);
        if (fkKeys.length >= conkeyLength) {
            // If this key is longer than the primary key it self, it is not a proper subset
            continue;
        } else {
            if (fkKeys.every(val => getKeyPosFromPK(table.pk).includes(val))) {
                // This is a proper subset
                subsetKeyIdx.push(i);
            }
        }
    }

    return subsetKeyIdx;
}

/**
 * Find out if the entity is a junction table - meaning that it is link a many-to-many relationship(s).
 * @param table Table in question
 * @returns Boolean indicating the property of the table.
 */
const getJunctionTableLinks = (table: Table) => {
    // Return nothing if no PK/FK exist
    if (!tableHasPKAndFK(table)) return [];

    // Return if there is less than 2 foreign keys
    if (table.fk.length < 2) {
        return [];
    }

    // This entity might be a link table between many-to-many relationships
    // For each FK, check if the PK set covered all of its constraints
    var comparedFKKeys: ForeignKey[] = []; // Keeping track for duplicates
    table.fk.forEach(key => {
        // If this FK is a subset of the PK
        let thisFK = getKeyPosFromFK(key) as [number];
        
        // Comparing past keys
        for (let comparedIndex = 0; comparedIndex < comparedFKKeys.length; comparedIndex++) {
            const comparedKey = getKeyPosFromFK(comparedFKKeys[comparedIndex]) as [number];
            if (thisFK.length === comparedKey.length) {
                if (thisFK.every(v => comparedKey.includes(v))) {
                    return false;
                }
            }
        }

        if (thisFK.every(v => getKeyPosFromPK(table.pk).includes(v))) {
            comparedFKKeys.push(key);
        }
    });

    if (comparedFKKeys.length >= 2) {
        // This is a many-to-many link table
        // Return sets of 
        return comparedFKKeys;
    } else {
        return [];
    }
        
}

/**
 * Helper function that returns true if a table contains at least one primary and one foreign key.
 * @param table Table in question
 * @returns Boolean indicating the existence of a primary and foreign key.
 */
const tableHasPKAndFK = (table: Table) => {
    // Return nothing if no PK/FK exist
    if (!table.pk) return false;
    if (!table.pk.columns || table.pk.columns.length === 0) {
        return false;
    }
    if (!table.fk || table.fk.length === 0) {
        return false;
    }

    let fkHasLength = false;
    for (var i = 0; i < table.fk.length; i++) {
        if (table.fk[i].columns.length != 0) {
            fkHasLength = true;
            break;
        }
    }

    return fkHasLength;
}

export const getRelationInListByName = (relationsList: RelationNode[], tableName: string) => {
    for (let i = 0; i < relationsList.length; i++) {
        if (relationsList[i].parentEntity.tableName === tableName) {
            return relationsList[i];
        }
    }

    return undefined;
}

export const isAttributeInPrimaryKey = (idx: number, pk: PrimaryKey) => {
    return (pk.columns.map(col => col.colPos).includes(idx));
}

export const isAttributeInForeignKey = (idx: number, fk: ForeignKey) => {
    return (fk.columns.map(col => col.fkColPos).includes(idx));
}

const constructManyManyRelation = (tableList: Table[], table: Table, fks: ForeignKey[]) => {
    const childRelations: ChildRelation[] = fks.map(fk => {
        return {
            table: searchTableListByName(tableList, fk.pkTableName),
            fkIndex: table.fk.indexOf(fk)
        };
    });

    return {
        type: VISSCHEMATYPES.MANYMANY,
        parentEntity: table,
        childRelations: childRelations
    };
}

const constructWeakEntityRelation = (tableList: Table[], table: Table, weakEntitiesIndices: number[]) => {
    const childRelations: ChildRelation[] = weakEntitiesIndices.map(wIndex => {
        const thisFk = table.fk[wIndex];
        return {
            table: searchTableListByName(tableList, thisFk.pkTableName),
            fkIndex: wIndex
        }
    });

    return {
        type: VISSCHEMATYPES.WEAKENTITY,
        parentEntity: table,
        childRelations: childRelations
    }
}

function constructOneManyRelation(tableList: Table[], table: Table, weakEntitiesIndices: number[]) {
    throw new Error('Function not implemented.');
}

/**
 * Called after the table metadata has been retrieved. Extracts relations and prepare for display.
 * @param tableList List of entities to be marked or processed.
 * @returns Same list of tables after annotation.
 */
export const preprocessEntities = (tableList: Table[]) => {
    let relationsList: RelationNode[] = [];

    tableList.forEach((thisTable: Table, index) => {
        thisTable.idx = index;
        let junctionTableSearchResult: ForeignKey[] = getJunctionTableLinks(thisTable);
        if (junctionTableSearchResult.length >= 2) {
            let thisRelation = constructManyManyRelation(tableList, thisTable, junctionTableSearchResult);
            relationsList.push(thisRelation);
        }
        else {
            // Check if this entity is a weak entity
            // TODO: if there is anything else
            let weakEntitiesIndices = getWeakEntityStatus(thisTable);
            if (weakEntitiesIndices.length > 0) {
                // This table is a lesser member of a weak entity relationship
                let thisRelation = constructWeakEntityRelation(tableList, thisTable, weakEntitiesIndices)
                relationsList.push(thisRelation);
            }
        }

    });

    // let relationsList = constructRelation(tableList);
    
    return {
        tableList: tableList,
        relationsList: relationsList
    };
}

// Some searcher helper function - might need in the future
const searchTableListByOID = (tableList: Table[], oid: number) => {
    for (let i = 0; i < tableList.length; i++) {
        if (tableList[i].oid === oid) {
            return tableList[i];
        }
    }
    return undefined;
}

const searchTableListByName = (tableList: Table[], searchString: string) => {
    for (let i = 0; i < tableList.length; i++) {
        if (tableList[i].tableName === searchString) {
            return tableList[i];
        }
    }
    return undefined;
}

export const getEntityJunctionRelations = (table: Table, relationsList: RelationNode[]) => {
    return relationsList.filter(rel => {
        return rel.type === VISSCHEMATYPES.MANYMANY && rel.parentEntity === table;
    })
}

export const getEntityWeakRelations = (table: Table, relationsList: RelationNode[]) => {
    return relationsList.filter(rel => {
        return rel.type === VISSCHEMATYPES.MANYMANY && rel.parentEntity === table;
    })
}