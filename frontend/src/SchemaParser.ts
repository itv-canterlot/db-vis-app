import { Table, RelationNode, VISSCHEMATYPES, ForeignKey, PrimaryKey } from './ts/types';

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

const constructRelation = (tableList: Table[]) => {
    let relationsList: RelationNode[] = [];
    tableList.forEach(item => {
        let newRelation: RelationNode;
        if (item.isJunction) {
            newRelation = {
                type: VISSCHEMATYPES.MANYMANY,
                parentEntity: item,
                childEntities: [],
            }
        } else if (item.weakEntitiesIndices.length !== 0) {
            newRelation = {
                type: VISSCHEMATYPES.WEAKENTITY,
                parentEntity: item,
                childEntities: []
            }
        } else {
            // Determine one-to-many or one-to-one?
            newRelation = {
                type: VISSCHEMATYPES.ONEMANY,
                parentEntity: item,
                childEntities: []
            }
        }
        relationsList.push(newRelation);
    });
    // Fill in the child entities

    relationsList.forEach((rel, idx) => {
        rel["index"] = idx;
        let relFks = rel.parentEntity.fk;
        if (relFks.length !== 0) {
            rel.childEntities = relFks.map(key => getRelationInListByName(relationsList, key.pkTableName));
        }
    });

    return relationsList;
}

/**
 * Called after the table metadata has been retrieved. Extracts relations and prepare for display.
 * @param tableList List of entities to be marked or processed.
 * @returns Same list of tables after annotation.
 */
export const preprocessEntities = (tableList: Table[]) => {
    tableList.forEach((item: Table, index) => {
        item.idx = index;
        let junctionTableSearchResult: ForeignKey[] = getJunctionTableLinks(item);
        if (junctionTableSearchResult.length >= 2) {
            item.isJunction = true;
        }
        else {
            // Check if this entity is a weak entity
            item.weakEntitiesIndices = getWeakEntityStatus(item);
        }
        // let fkString = "";
        // if (item.fk && item.fk.length > 0) {
        //     item.fk.forEach(f => {
        //         fkString += "\n  " + f.confname;
        //     })
        // }
        
        // console.log(
        //     (item.weakEntitiesIndices && item.weakEntitiesIndices.length > 0 ? "*" : "") + 
        //     (item.isJunction ? "°" : "") + 
        //     item.relname + 
        //     ((item.fk && item.fk.length > 0) ? (" -> " + fkString) : ""));

    });

    let relationsList = constructRelation(tableList);
    
    return {
        tableList: tableList,
        relationsList: relationsList
    };
}

// Some searcher helper function - might need in the future
let searchTableListByOID = (tableList: Table[], oid: number) => {
    for (let i = 0; i < tableList.length; i++) {
        if (tableList[i].oid === oid) {
            return tableList[i];
        }
    }
    return undefined;
}

let searchTableListByName = (tableList: Table[], searchString: string) => {
    for (let i = 0; i < tableList.length; i++) {
        if (tableList[i].tableName === searchString) {
            return tableList[i];
        }
    }
    return undefined;
}