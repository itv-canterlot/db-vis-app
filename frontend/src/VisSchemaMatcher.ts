import * as SchemaParser from "./SchemaParser";
import {Attribute, RelationNode, Table, VisKey, VisParam, VISPARAMTYPES, VisSchema, VISSCHEMATYPES, PatternMatchResult, PatternMatchAttribute} from "./ts/types";
import * as TypeConstants from "./TypeConstants";



const basicKeyConditionCheck = (table: Table, key: VisKey) => {
    // Check if there *is* a key
    if (table.pk.columns.length < 1) return false;

    const keyMinCount = key.minCount,
        keyMaxCount = key.maxCount,
        tableKeyCount = table.pk.keyCount;
    // Count checks
    if (keyMaxCount) {
        if (tableKeyCount > keyMaxCount) return false;
    }
    if (tableKeyCount < keyMinCount) return false;
    

    // Key type check
    if (key.type) {
        for (let pkCol of table.pk.columns) {
            const thisAttr = table.attr[pkCol.colPos]
            if (key.type === VISPARAMTYPES.TEMPORAL) {
                if (!TypeConstants.isAttributeTemporal(thisAttr)) {
                    return false;
                }
            } else if (key.type === VISPARAMTYPES.LEXICAL) {
                if (table.pk.columns.length > 1) return false;
                if (!TypeConstants.isAttributeLexical(thisAttr)) {
                    return false;
                }
            } else if (key.type === VISPARAMTYPES.COLOR) {
                // Assumption: there's only one key column for colour?
                if (table.pk.columns.length > 1) return false;
                if (!TypeConstants.isAttributeLexical(thisAttr)) return false;
            } else if (key.type === VISPARAMTYPES.GEOGRAPHICAL) {
                if (!TypeConstants.isAttributeGeographical(thisAttr)) {
                    return false;
                }
            }
        }
    }

    return true;
}

const isThisTableJunction = (rel: RelationNode) => {
    return rel.type === VISSCHEMATYPES.WEAKENTITY;
}

const weKeyConditionCheck = (rel: RelationNode, keys: VisKey) => {
    // Check if this entity is a weak entity
    if (rel.type === VISSCHEMATYPES.WEAKENTITY) {
        // TODO
    } else {
        // Check if any of the child rel nodes is a junction table
        
    }

    return false;
}

const doesAttributeMatchVisParamType = (attr: Attribute, param: VisParam) => {
    if (param.type) {
        if (param.type === VISPARAMTYPES.TEMPORAL) {
            if (!TypeConstants.isAttributeTemporal(attr)) {
                return false;
            }
        } else if (param.type === VISPARAMTYPES.LEXICAL) {
            if (!TypeConstants.isAttributeLexical(attr)) {
                return false;
            }
        } else if (param.type === VISPARAMTYPES.COLOR) {
            if (!TypeConstants.isAttributeLexical(attr)) {
                return false;
            };
        } else if (param.type === VISPARAMTYPES.GEOGRAPHICAL) {
            if (!TypeConstants.isAttributeGeographical(attr)) {
                return false;
            }
        }
    } else if (param.scalar) {
        if (!TypeConstants.isAttributeScalar(attr)) {
            return false;
        }
    }

    return true;
}

const getMatchingAttributesByParameter = (table: Table, param: VisParam) => {
    let paramMatchableIndices: PatternMatchAttribute[] = [];
    for (let i = 0; i < table.attr.length; i++) {
        const thisAttr = table.attr[i];
        // Skip pks(?)
        if (SchemaParser.isAttributeInPrimaryKey(i + 1, table.pk)) continue;
        // Check specific types first
        if (!doesAttributeMatchVisParamType(thisAttr, param)) continue;

        // Add this attribute to the list above
        paramMatchableIndices.push({
            table: table,
            attributeIndex: i
        });
    }

    paramMatchableIndices.forEach((attr, idx) => {
        attr.matchIndex = idx;
    })

    return paramMatchableIndices;
}

// For simple entity checks, consider the entire set of tables in the subset relation
const getMatchAttributesFromSet = (rel: RelationNode, param: VisParam) => {
    let matchResult: PatternMatchAttribute[] = [];
    if (rel.type !== VISSCHEMATYPES.SUBSET) return;

    const tablesInSet = getTablesWithinSet(rel);
    tablesInSet.forEach(table => {
        for (let i = 0; i < table.attr.length; i++) {
            const thisAttr = table.attr[i];
            // Skip pks(?)
            if (SchemaParser.isAttributeInPrimaryKey(i + 1, table.pk)) continue;
            // Check specific types first
            if (doesAttributeMatchVisParamType(thisAttr, param)) {
                // Add this attribute to the list above
                matchResult.push({
                    table: table,
                    attributeIndex: i
                });
            };
    
        }
    });

    matchResult.forEach((attr, idx) => {
        attr.matchIndex = idx;
    })

    return matchResult;
}


const isRelationReflexive = (rel: RelationNode) => {
    if (rel.type !== VISSCHEMATYPES.MANYMANY) return false;
    // Reflexive: the "child nodes" of this junction table point to the same table
    if (rel.childRelations.length < 2) return false;
    let reflexCounter: {[id: string]: number} = {};

    rel.childRelations.forEach(ent => {
        let pkTableName = ent.table.tableName;
        if (pkTableName in reflexCounter) {
            reflexCounter[pkTableName]++;
        } else {
            reflexCounter[pkTableName] = 1;
        }
    });

    return Object.values(reflexCounter).some(v => v >= 2);
}

export const matchTableWithAllVisPatterns = (table: Table, rels: RelationNode[], vss:VisSchema[]) => {
    let out = [];
    // If the table is in a set, treat the set as a big table
    // getTablesWithinSet(rels, tablesWithinSet, relsWithoutSubset);
    vss.forEach((vs, idx) => {
        out.push(matchTableWithVisPattern(table, rels, vs));
    })

    return out;
}

const patternMatchSuccessful = (result: PatternMatchResult, vs: VisSchema) => {
    return result.mandatoryAttributes.every(ma => ma.length > 0);
}

const matchTableWithVisPattern = (table: Table, rels: RelationNode[], vs:VisSchema) => {
    if (!table.pk) return undefined; // Not suitable if there is no PK to use

    if (!basicKeyConditionCheck(table, vs.localKey)) {
        return undefined;
    }

    let subsetRel = rels.find(rel => rel.type === VISSCHEMATYPES.SUBSET); // TODO: multiple subsets?
    let relsInvolvedWithTable = SchemaParser.getRelationsInListByName(rels, table.tableName);

    let thisPatternMatchResult: PatternMatchResult;
    switch (vs.type) {
        case VISSCHEMATYPES.BASIC:
            // Find combinations of attributes that match the requirements
            thisPatternMatchResult = {
                vs: vs,
                mandatoryAttributes: [],
                optionalAttributes: [],
                matched: false
            };
            
            // For each attribute in vs, compare against each attr in table, add appropriate indices to list
            for (let mp of vs.mandatoryParameters) {
                let thisConstMatchableIndices;
                if (subsetRel) {
                    thisConstMatchableIndices = getMatchAttributesFromSet(subsetRel, mp)
                    thisPatternMatchResult.responsibleRelation = subsetRel;
                } else {
                    thisConstMatchableIndices = getMatchingAttributesByParameter(table, mp);
                }
                thisPatternMatchResult.mandatoryAttributes.push(thisConstMatchableIndices);
            }

            if (patternMatchSuccessful(thisPatternMatchResult, vs)) {
                thisPatternMatchResult.matched = true;
            }

            if (vs.optionalParameters) {
                for (let op of vs.optionalParameters) {
                    let thisConstMatchableIndices;
                    if (subsetRel) {
                        thisConstMatchableIndices = getMatchAttributesFromSet(subsetRel, op)
                    } else {
                        thisConstMatchableIndices = getMatchingAttributesByParameter(table, op);
                    }
                    thisPatternMatchResult.optionalAttributes.push(thisConstMatchableIndices);
                }
            }
            return thisPatternMatchResult;

        case VISSCHEMATYPES.WEAKENTITY:
            // Find combinations of attributes that match the requirements
            thisPatternMatchResult = {
                vs: vs,
                mandatoryAttributes: [],
                optionalAttributes: [],
                matched: false
            };
            return undefined;
                
            // For each attribute in vs, compare against each attr in table, add appropriate indices to list
            // for (let mp of vs.mandatoryParameters) {
            //     let thisConstMatchableIndices;
            //     if (subsetRel) {
            //         thisConstMatchableIndices = getMatchAttributesFromSet(subsetRel, mp)
            //         thisPatternMatchResult.responsibleRelation = subsetRel;
            //     } else {
            //         thisConstMatchableIndices = getMatchingAttributesByParameter(table, mp);
            //     }
            //     thisPatternMatchResult.mandatoryAttributes.push(thisConstMatchableIndices);
            // }

            // if (patternMatchSuccessful(thisPatternMatchResult, vs)) {
            //     thisPatternMatchResult.matched = true;
            // }

            // if (vs.optionalParameters) {
            //     for (let op of vs.optionalParameters) {
            //         let thisConstMatchableIndices;
            //         if (subsetRel) {
            //             thisConstMatchableIndices = getMatchAttributesFromSet(subsetRel, op)
            //         } else {
            //             thisConstMatchableIndices = getMatchingAttributesByParameter(table, op);
            //         }
            //         thisPatternMatchResult.optionalAttributes.push(thisConstMatchableIndices);
            //     }
            // }
            // return thisPatternMatchResult;

        // case VISSCHEMATYPES.MANYMANY:
        //     if (!rels) return;
        //     if (rel.type === VISSCHEMATYPES.MANYMANY) {
        //         if (vs.reflexive && !isRelationReflexive(rel)) return undefined; // Check reflexibility

        //         // Get the indices on the weak entity table that can be used to match foreign tables
        //         let thisTableValidAttIdx: number[] = getMatchingAttributesByParameter(table, vs.localKey);
        //         let foreignTablesValidAttIdx: number[][] = [];
        //         if (thisTableValidAttIdx.length > 0) {
        //             // For each neighbour, for each attribute in each neighbour, check key count attribute properties
        //             for (let childRel of rel.childRelations) {
        //                 const ft = childRel.table;
        //                 if (!basicKeyConditionCheck(ft, vs.foreignKey)) continue;
        //                 foreignTablesValidAttIdx.push(getMatchingAttributesByParameter(ft, vs.foreignKey));
        //             }
        //             if (foreignTablesValidAttIdx.length > 0 && foreignTablesValidAttIdx.every(idxes => idxes.length > 0)) {
        //                 return true;
        //             } else {
        //                 return undefined;
        //             }
        //         } else {
        //             return undefined;
        //         }
        //     } else {
        //         return undefined;
        //         // const neighbourJunctionIndices = getNeighbourJunctionTableIdx(rel);
        //         // if (neighbourJunctionIndices.length === 0) return undefined;

        //         // // Some of the neighbour relation is a junction table - out to where
        //     }
        // case VISSCHEMATYPES.WEAKENTITY:
        //     if (!rel) return;
        //     if (rel.type === VISSCHEMATYPES.WEAKENTITY)  {
        //         // Get the indices on the weak entity table that can be used to match foreign tables
        //         let thisTableValidAttIdx: number[] = getMatchingAttributesByParameter(table, vs.localKey);
        //         let foreignTablesValidAttIdx: number[][] = [];
        //         if (thisTableValidAttIdx.length > 0) {
        //             // For each neighbour, for each attribute in each neighbour, check key count attribute properties
        //             for (let childRel of rel.childRelations) {
        //                 const ft = childRel.table;
        //                 if (!basicKeyConditionCheck(ft, vs.foreignKey)) continue;
        //                 foreignTablesValidAttIdx.push(getMatchingAttributesByParameter(ft, vs.foreignKey));
        //             }
        //             if (foreignTablesValidAttIdx.length > 0 && foreignTablesValidAttIdx.every(idxes => idxes.length > 0)) {
        //                 return true;
        //             } else {
        //                 return undefined;
        //             }
        //         } else {
        //             return undefined;
        //         }
        //     } else {
        //         return undefined;
        //         // const neighbourJunctionIndices = getNeighbourJunctionTableIdx(rel);
        //         // if (neighbourJunctionIndices.length === 0) return undefined;

        //         // // Some of the neighbour relation is a junction table - out to where
        //     }
        // case VISSCHEMATYPES.ONEMANY:
        //     return undefined;
        default:
            return undefined; // TODO
    }
}

const getTablesWithinSet = (rel: RelationNode) => {
    let tablesWithinSet: Table[] = [];
    if (rel.type === VISSCHEMATYPES.SUBSET) {
        tablesWithinSet.push(rel.parentEntity);
        tablesWithinSet.push(...rel.childRelations.map(childRel => childRel.table));
    }

    return tablesWithinSet;
}
