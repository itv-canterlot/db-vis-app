import { Table } from './ts/types';

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
    const conkeyLength = table.pk ? table.pk.conkey.length : 0;

    let subsetKeyIdx: number[] = []; // TODO: should I also pass this on?
    for (let i = 0; i < table.fk.length; i++) {
        let fkElem = table.fk[i];
        let fkKeys = fkElem.conkey;
        if (fkKeys.length >= conkeyLength) {
            // If this key is longer than the primary key it self, it is not a proper subset
            continue;
        } else {
            if (fkKeys.every(val => table.pk.conkey.includes(val))) {
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
const tableIsJunction = (table: Table) => {
    // Return nothing if no PK/FK exist
    if (!tableHasPKAndFK(table)) return false;

    // Return if there is less than 2 foreign keys
    if (table.fk.length < 2) {
        return false;
    }

    // This entity might be a link table between many-to-many relationships
    // For each FK, check if the PK set covered all of its constraints
    var fkMatchCount = 0;
    var comparedFKKeys = []; // Keeping track for duplicates
    table.fk.forEach(element => {
        // If this FK is a subset of the PK
        let thisTableKey = element.conkey as [number];
        for (let comparedIndex = 0; comparedIndex < comparedFKKeys.length; comparedIndex++) {
            const comparedKey = comparedFKKeys[comparedIndex] as [number];
            if (thisTableKey.length === comparedKey.length) {
                if (thisTableKey.every(v => comparedKey.includes(v))) {
                    return false;
                }
            }
        }

        if (thisTableKey.every(v => table.pk.conkey.includes(v))) {
            comparedFKKeys.push(thisTableKey);
            fkMatchCount++;
        }
    });

    if (fkMatchCount >= 2) {
        // This is a many-to-many link table
        return true;
    } else {
        return false;
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
    if (!table.pk.conkey || table.pk.conkey.length === 0) {
        return false;
    }
    if (!table.fk || table.fk.length === 0) {
        return false;
    }

    let fkHasLength = false;
    for (var i = 0; i < table.fk.length; i++) {
        if (table.fk[i].conkey.length != 0) {
            fkHasLength = true;
            break;
        }
    }

    return fkHasLength;
}

/**
 * Called after the table metadata has been retrieved. Extracts relations and prepare for display.
 * @param tableList List of entities to be marked or processed.
 * @returns Same list of tables after annotation.
 */
export const preprocessEntities = (tableList: Table[]) => {
    tableList.forEach((item: Table, _) => {
        if (tableIsJunction(item)) {
            item.isJunction = true;
        }
        else {
            item.weakEntitiesIndices = getWeakEntityStatus(item);
            // Check if this entity is a weak entity
            if (item.weakEntitiesIndices.length > 0) {
                // TODO
            } else {
                // TODO
            }
        }
        let fkString = "";
        if (item.fk && item.fk.length > 0) {
            item.fk.forEach(f => {
                fkString += "\n  " + f.confname;
            })
        }
        console.log(
            (item.weakEntitiesIndices && item.weakEntitiesIndices.length > 0 ? "*" : "") + 
            (item.isJunction ? "°" : "") + 
            item.relname + 
            ((item.fk && item.fk.length > 0) ? (" -> " + fkString) : ""));
    });


    return tableList;
}