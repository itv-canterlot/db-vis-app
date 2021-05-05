import { randomNormal } from 'd3-random';
import { table } from 'node:console';
import { Table, RelationNode, VISSCHEMATYPES, ForeignKey } from './ts/types';

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
    const conkeyLength = table.pk ? table.pk.keyPos.length : 0;

    let subsetKeyIdx: number[] = []; // TODO: should I also pass this on?
    for (let i = 0; i < table.fk.length; i++) {
        let fkElem = table.fk[i];
        let fkKeys = fkElem.keyPos;
        if (fkKeys.length >= conkeyLength) {
            // If this key is longer than the primary key it self, it is not a proper subset
            continue;
        } else {
            if (fkKeys.every(val => table.pk.keyPos.includes(val))) {
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
    table.fk.forEach(element => {
        // If this FK is a subset of the PK
        let thisTableKey = element.keyPos as [number];
        for (let comparedIndex = 0; comparedIndex < comparedFKKeys.length; comparedIndex++) {
            const comparedKey = comparedFKKeys[comparedIndex].keyPos as [number];
            if (thisTableKey.length === comparedKey.length) {
                if (thisTableKey.every(v => comparedKey.includes(v))) {
                    return false;
                }
            }
        }

        if (thisTableKey.every(v => table.pk.keyPos.includes(v))) {
            comparedFKKeys.push(element);
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
    if (!table.pk.keyPos || table.pk.keyPos.length === 0) {
        return false;
    }
    if (!table.fk || table.fk.length === 0) {
        return false;
    }

    let fkHasLength = false;
    for (var i = 0; i < table.fk.length; i++) {
        if (table.fk[i].keyPos.length != 0) {
            fkHasLength = true;
            break;
        }
    }

    return fkHasLength;
}

// Not sure what to do with this
// const getRelationByName = (searchObjective: RelationNode[], visitedNodes: RelationNode[], tableList: Table[], tableName: string) => {
//     // Search in the existing relations list for the element
//     let newSearchObjective: RelationNode[] = [];
//     let existingRelation = undefined;
//     for (let ri = 0; ri < searchObjective.length; ri++) {
//         let rnode = searchObjective[ri];
//         // If this node has been visited already, skip
//         if (visitedNodes.some(vnode => vnode.parentEntity.relname === rnode.parentEntity.relname)) {
//             continue;
//         }

//         // Check if this rnode is the one being searched for
//         if (rnode.parentEntity.relname === tableName) {
//             existingRelation = rnode;
//             break;
//         } else {
//             // Look for children nodes
//             if (rnode.childEntities.length === 0) {
//                 continue;
//             } else {
//                 // Add new objectives for recursive search (?)
//                 newSearchObjective.push(...rnode.childEntities);
//                 visitedNodes.push(rnode);
//             }
//         }
//     }

//     if (existingRelation !== undefined) {
//         return existingRelation;
//     } else {
//         if (newSearchObjective.length === 0) {
//             // Search ended, return a new relation
//             let thisTable = searchTableListByName(tableList, tableName);
//             if (thisTable.isJunction) {
//                 let newRelation: RelationNode = {
//                     type: VISSCHEMATYPES.MANYMANY,
//                     parentEntity: thisTable,
//                     childEntities: thisTable.fk.map(key => getRelationByName(searchObjective, [], tableList, key.conname))
//                 }
//             } else if (thisTable.weakEntitiesIndices.length !== 0) {
//                 let newRelation: RelationNode = {
//                     type: VISSCHEMATYPES.WEAKENTITY,
//                     parentEntity: thisTable,
//                     childEntities: [] // TODO
//                 }
//             } else {
//                 // Determine one-to-many or one-to-one?
//                 let newRelation: RelationNode = {
//                     type: VISSCHEMATYPES.ONEMANY,
//                     parentEntity: thisTable,
//                     childEntities: [] // TODO
//                 }
//             }
//         }
//         return getRelationByName(newSearchObjective, visitedNodes, tableList, tableName)
//     }
// }

const getRelationInListByName = (relationsList: RelationNode[], tableName: string) => {
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
                childEntities: []
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

    relationsList.forEach(rel => {
        let relFks = rel.parentEntity.fk;
        if (relFks.length !== 0) {
            rel.childEntities = relFks.map(key => getRelationInListByName(relationsList, key.confname));
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
    tableList.forEach((item: Table, _) => {
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