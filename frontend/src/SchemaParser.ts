import { Table, RelationNode, VISSCHEMATYPES, ForeignKey, PrimaryKey, ChildRelation, SuperSetRelationType, GroupedSuperSetRelationType } from './ts/types';

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

    let subsetKeyIdx: number[] = [];
    for (let i = 0; i < table.fk.length; i++) {
        let fkElem = table.fk[i];
        let fkKeys = getKeyPosFromFK(fkElem);
        if (fkKeys.length >= conkeyLength) {
            // If this key is longer than the primary key it self, it is not a proper subset
            continue;
        } else {
            if (fkKeys.every(val => getKeyPosFromPK(table.pk).includes(val))) {
                // This is a proper subset
                // Check if any of the already-added foreign keys is identical to this key
                if (subsetKeyIdx.every(fkIdx => {
                    const existingKey = table.fk[fkIdx];
                    return JSON.stringify(existingKey.columns) !== JSON.stringify(fkElem.columns)
                        && JSON.stringify(existingKey.pkTableName !== JSON.stringify(fkElem.pkTableName))
                })) {
                    subsetKeyIdx.push(i);
                }
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
 * Find out if the entity is a subset of another table, by checking if its (candidate) key is also a foreign key
 * @param table Table in question
 * @returns Boolean indicating the property of the table.
 */
const getSubsetStatus = (table: Table) => {
    const tablePk = table.pk,
    tableFks = table.fk;

    const fkColPosInTable = tableFks.map(fk => fk.columns.map(col => col.fkColPos));
    const pkColPos = tablePk.columns.map(col => col.colPos);

    for (let i = 0; i < fkColPosInTable.length; i++) {
        const fk = fkColPosInTable[i];
        const isSubset = JSON.stringify(fk.sort()) === JSON.stringify(pkColPos.sort());

        // If is subset, return the key index
        if (isSubset) return i;
    }

    return undefined;
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

export const getRelationsInListByName = (relationsList: RelationNode[], tableName: string) => {
    return relationsList.filter(rel => {
        // Relations where the parent entity matches tableName
        const parentMatch = rel.parentEntity.tableName === tableName;
        if (parentMatch) return true;

        // Relations where the table is one of the child nodes
        const childMatch = rel.childRelations.some(childRel => {
            return childRel.table.tableName === tableName;
        })

        return childMatch;
    })
}

export const filterTablesByExistingRelations = (allEntitiesList: Table[], allRelationsList: RelationNode[], 
        availableEntityIndices?: number[], availableRelationsIndices?: number[]) => {
    let allRelationsRelatedToSelectedEntities: RelationNode[] = [];
    if (availableEntityIndices !== undefined && availableEntityIndices.length > 0) {
        availableEntityIndices.forEach(entIndex => {
            const thisEntity = allEntitiesList[entIndex];
            allRelationsRelatedToSelectedEntities.push(...getRelationsInListByName(allRelationsList, thisEntity.tableName));
        });
    }

    let allSelectedRelations: RelationNode[] = [];
    if (availableRelationsIndices !== undefined && availableRelationsIndices.length > 0) {
        allSelectedRelations.push(...availableRelationsIndices.map(relIndex => allRelationsList[relIndex]));
    }

    let entitiesList: Table[] = [];

    entitiesList.push(...allEntitiesList.filter(ent => {
        return allRelationsRelatedToSelectedEntities.some(rel => {
            return rel.childRelations.some(cr => cr.table.idx === ent.idx) || rel.parentEntity.idx === ent.idx;
        });
    }));

    allSelectedRelations.forEach(rel => {
        entitiesList.push(rel.parentEntity);
        entitiesList.push(...rel.childRelations.map(cr => cr.table))
    })

    // Filter and sort the entities list
    entitiesList.sort((t1, t2) => (t1.idx - t2.idx));

    if (entitiesList.length >= 2) {
        for (let i = entitiesList.length - 1; i > 0; i--) {
            if (entitiesList[i].idx === entitiesList[i - 1].idx) {
                entitiesList.splice(i, 1);
            }
        }
    }


    return entitiesList;
}

export const isTableAtRootOfRel = (table: Table, rel: RelationNode) => {
    return rel.parentEntity === table;
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

const constructWeakEntityRelation = (tableList: Table[], thisTable: Table, weakEntitiesIndices: number[]) => {
    return weakEntitiesIndices.map(wIndex => {
        const childRelations: ChildRelation[] = weakEntitiesIndices.map(wIndex => {
            return {
                table: thisTable,
                fkIndex: wIndex
            }
        });
        const thisFk = thisTable.fk[wIndex];
        return {
            type: VISSCHEMATYPES.WEAKENTITY,
            parentEntity: searchTableListByName(tableList, thisFk.pkTableName),
            childRelations: childRelations
        }
    })
}

const constructSubsetRelation = (tableList: Table[], groupedSubsetsByTable: GroupedSuperSetRelationType, parentName: string) => {
    const subsets = groupedSubsetsByTable[parentName];
    const childRelations: ChildRelation[] = 
        subsets.map(subset => {
            return {
                    table: subset.table,
                    fkIndex: subset.fkIndex
                }
            });
        
    return {
        type: VISSCHEMATYPES.SUBSET,
        parentEntity: searchTableListByName(tableList, parentName),
        childRelations: childRelations
    }
}

function constructOneManyRelation(tableList: Table[], childTable: Table) {
    const childRelations: ChildRelation = {
        table: childTable,
        fkIndex: 0
    }
    return {
        type: VISSCHEMATYPES.ONEMANY,
        parentEntity: searchTableListByName(tableList, childTable.fk[0].pkTableName),
        childRelations: [childRelations]
    }
}

const getRelationType = (allTables: Table[]) => {
    let relationsList: RelationNode[] = [];
    let tablesThatAreSubset: SuperSetRelationType[] = [];
    
    // TODO: multiple foreign keys?
    allTables.forEach((table: Table) => {
        // Check 1: the table must have primary key and at least one foreign key
        if (!tableHasPKAndFK(table)) return [];
        if (table.fk.length === 0) return [];
    
        // Check 2: is this table a junction table?
        let junctionTableSearchResult: ForeignKey[] = getJunctionTableLinks(table);
        if (junctionTableSearchResult.length >= 2) {
            relationsList.push(constructManyManyRelation(allTables, table, junctionTableSearchResult));
            return;
        }
    
        // Check 3: Optional multi-valued attribute (to be implemented)
    
        // Check 4: is the table the dependent part of a weak entity?
        let weakEntitiesIndices = getWeakEntityStatus(table);
        if (weakEntitiesIndices.length > 0) {
            // This table is a lesser member of a weak entity relationship
            relationsList.push(...constructWeakEntityRelation(allTables, table, weakEntitiesIndices));
            return;
        }
    
        // Otherwise, this table is an ER identity
        // Check 5: is the table a subset of another table?
        const tableSubsetIndex = getSubsetStatus(table);
        if (tableSubsetIndex !== undefined) {
            tablesThatAreSubset.push({
                table: table,
                fkIndex: tableSubsetIndex,
                parentTableName: table.fk[tableSubsetIndex].pkTableName
            });
            return;
        } else {
            // Otherwise this relation is a one-to-many relation
            relationsList.push(constructOneManyRelation(allTables, table));
        }
    });

    // Construct subset-related relation nodes
    const superSetTablesGroupByParentTableName: GroupedSuperSetRelationType = groupBy(tablesThatAreSubset, "parentTableName");
    
    for (let parentName in superSetTablesGroupByParentTableName) {
        relationsList.push(constructSubsetRelation(allTables, superSetTablesGroupByParentTableName, parentName))
    }

    relationsList.forEach((rel, idx) => {
        rel.index = idx
    })
        
    return relationsList;
}

/**
 * Called after the table metadata has been retrieved. Extracts relations and prepare for display.
 * @param tableList List of entities to be marked or processed.
 * @returns Same list of tables after annotation.
 */
export const preprocessEntities = (tableList: Table[]) => {
    const relationsList = getRelationType(tableList)
    
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

const groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};