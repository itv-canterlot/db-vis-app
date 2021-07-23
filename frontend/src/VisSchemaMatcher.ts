import * as SchemaParser from "./SchemaParser";
import {Attribute, RelationNode, Table, VisKey, VisParam, VISPARAMTYPES, VisSchema, VISSCHEMATYPES, PatternMatchResult, PatternMatchAttribute, PatternMismatchReason, PATTERN_MISMATCH_REASON_TYPE, ChildRelation} from "./ts/types";
import * as TypeConstants from "./TypeConstants";

const keyCountCheck = (table: Table, key: VisKey, nPks?: number): boolean => {
    const keyMinCount = key.minCount,
        keyMaxCount = key.maxCount,
        tableKeyCount = nPks ? nPks : table.pk.keyCount;
    // Count checks
    if (keyMaxCount) {
        if (tableKeyCount > keyMaxCount) {
            return false;
        };
    }
    if (tableKeyCount < keyMinCount) {
        return false;
    };

    return true;
}

const basicKeyConditionCheck = (table: Table, key: VisKey, nPks?: number): PatternMismatchReason => {
    // Check if there *is* a key
    if (table.pk.columns.length < 1) {
        return {
            reason: PATTERN_MISMATCH_REASON_TYPE.NO_PK
        };
    };

    // Key type check
    if (key.type) {
        // TODO: multi-column keys
        for (let i = 0; i < table.pk.columns.length; i++) {
            let pkCol = table.pk.columns[i];
            const thisAttr = table.attr[pkCol.colPos]
            let keyMatchResult = true;
            if (key.type === VISPARAMTYPES.TEMPORAL) {
                if (!TypeConstants.isAttributeTemporal(thisAttr)) {
                    keyMatchResult = false;
                }
            } else if (key.type === VISPARAMTYPES.LEXICAL) {
                if (table.pk.columns.length > 1) keyMatchResult = false;
                if (!TypeConstants.isAttributeLexical(thisAttr)) {
                    keyMatchResult = false;
                }
            } else if (key.type === VISPARAMTYPES.GEOGRAPHICAL) {
                if (!TypeConstants.isAttributeGeographical(thisAttr)) {
                    keyMatchResult = false;
                }
            }

            if (!keyMatchResult) {
                return {
                    reason: PATTERN_MISMATCH_REASON_TYPE.KEY_TYPE_MISMATCH,
                    position: i
                }
            }
        }
    }

    return undefined;
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

const getAllMatchingAttributesFromListOfParams = (table: Table, params: VisParam[]) => {
    let attrMatchResult: PatternMatchAttribute[][] = [];
    for (let param of params) {
        let thisParamMatchResult = getMatchingAttributesByParameter(table, param);
        attrMatchResult.push(thisParamMatchResult);
    }

    return attrMatchResult;
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

export const matchTableWithAllVisPatterns = (table: Table, rels: RelationNode[], vss:VisSchema[], nKeys?: number): PatternMatchResult[][] => {
    let out = [];
    // If the table is in a set, treat the set as a big table
    // getTablesWithinSet(rels, tablesWithinSet, relsWithoutSubset);
    vss.forEach((vs, idx) => {
        const thisVisSchemaMatchResult = matchTableWithVisPattern(table, rels, vs, nKeys)
        if (thisVisSchemaMatchResult) {
            out.push(thisVisSchemaMatchResult);
        } else {
            out.push(undefined);
        }
    })

    return out;
}

export const matchRelationWithAllVisPatterns = (rel: RelationNode, vss:VisSchema[], nKeys?: number): PatternMatchResult[][] => {
    let out = [];
    // If the table is in a set, treat the set as a big table
    // getTablesWithinSet(rels, tablesWithinSet, relsWithoutSubset);
    vss.forEach((vs, idx) => {
        const thisVisSchemaMatchResult = matchRelationWithVisPattern(rel, vs, nKeys)
        if (thisVisSchemaMatchResult) {
            out.push(thisVisSchemaMatchResult);
        } else {
            out.push(undefined);
        }
    })

    return out;
}

const patternMatchSuccessful = (result: PatternMatchResult, vs: VisSchema) => {
    const eachMandatoryAttributeHasElem = result.mandatoryAttributes.every(ma => ma.length > 0);
    if (eachMandatoryAttributeHasElem) {
        // Length of each mandatory attribute match >= number of mandatory attributes
        const maLength = vs.mandatoryParameters.length;
        const mandatoryAttributeLengthLargerThanAvailableParams = 
            result.mandatoryAttributes.every(ma => ma.length >= maLength)

        return mandatoryAttributeLengthLargerThanAvailableParams;
    } else {
        return false;
    }
}

const failedPatternMatchObject = (vs: VisSchema, mismatchReason?: PatternMismatchReason): PatternMatchResult => {
    return {
        vs: vs,
        mandatoryAttributes: [],
        optionalAttributes: [],
        matched: false,
        mismatchReason: mismatchReason
    };
}

const basicEntityVisMatch = (table: Table, vs: VisSchema, nKeys?: number, subsetRel?: RelationNode): PatternMatchResult => {
    // Check base condition of the table - use the one specified
    const basicKeyConditionCheckResult = basicKeyConditionCheck(table, vs.localKey, nKeys)
    if (basicKeyConditionCheckResult) {
        return failedPatternMatchObject(vs, basicKeyConditionCheckResult);
    }

    
    // Find combinations of attributes that match the requirements
    let thisPatternMatchResult: PatternMatchResult = {
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
    } else {
        return failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE});
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
}

const weakEntityVisMatch = (table: Table, rel: RelationNode, vs: VisSchema, nKeys?: number, ignoreKeyCountMismatch?: boolean): PatternMatchResult[] => {
    if (rel.type !== VISSCHEMATYPES.WEAKENTITY) {
        return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.PATTERN_TYPE_MISMATCH})]
    };
    
    if (vs.type !== VISSCHEMATYPES.WEAKENTITY) return;
    
    if (vs.complete) {
        // Complete path - TODO
        // if (!isRelationComplete(rel)) return;
        return;
    }
    
    // Perform key condition check for the two involved entities
    // Is this table the parent or the child?
    if (rel.parentEntity.idx === table.idx) {
        let parentKeyIsMismatch = false;
        // table is the parent table
        const parentTableBasicCheckResult = basicKeyConditionCheck(table, vs.localKey, nKeys);
        if (parentTableBasicCheckResult) {
            return [failedPatternMatchObject(vs, parentTableBasicCheckResult)];
        }
        
        if (!keyCountCheck(table, vs.localKey, nKeys)) {
            if (ignoreKeyCountMismatch) {
                parentKeyIsMismatch = true;
            } else {
                return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH})];
            }
        }

        const createWeakRelResultFromChildRelation = (cr: ChildRelation, isChildKeyMismatch?: boolean) => {
            let thisPatternMatchResult = {
                vs: vs,
                mandatoryAttributes: [],
                optionalAttributes: [],
                responsibleRelation: rel,
                matched: false,
                keyCountCheck: ignoreKeyCountMismatch ? parentKeyIsMismatch : undefined
            };

            // Both a1 and a2 are located in the WE table
            let thisChildRelMandatoryParameters =
                getAllMatchingAttributesFromListOfParams(cr.table, vs.mandatoryParameters);
            thisPatternMatchResult.mandatoryAttributes = thisChildRelMandatoryParameters;
            // TODO: mirror the scalar key check above

            if (patternMatchSuccessful(thisPatternMatchResult, vs)) {
                thisPatternMatchResult.matched = true;
            } else {
                return;
            }

            if (vs.optionalParameters) {
                let thisChildRelOptionalParameters = 
                    getAllMatchingAttributesFromListOfParams(cr.table, vs.optionalParameters);

                thisPatternMatchResult.optionalAttributes = thisChildRelOptionalParameters;
            }

            return thisPatternMatchResult;
        }

        // For each child entity in the WE relation (?)
        return rel.childRelations.map(cr => {
            let crKeyIsMismatch = false;
            const weTableBasicCheckResult = basicKeyConditionCheck(cr.table, vs.foreignKey, nKeys);

            if (weTableBasicCheckResult) {
                return failedPatternMatchObject(vs, weTableBasicCheckResult);
            }

            if (!keyCountCheck(cr.table, vs.localKey, nKeys)) {
                if (ignoreKeyCountMismatch) {
                    crKeyIsMismatch = true;
                } else {
                    // TODO: check this
                    return failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH});
                }
            }

            // Check the scalar requirement of k2
            if (vs.foreignKey.scalar) {
                const thisPrimaryKeyColumns = cr.table.pk.columns;
                // Find key attributes that are outside of the public key subset
                if (vs.foreignKey.scalar) {
                    const pkColsNotInFk = thisPrimaryKeyColumns.filter(pkCol => {
                        // Return PK columns that does not match any FK cols
                        return !cr.table.fk.some(fk => {
                            return fk.columns.some(fkCol => {
                                return fkCol.fkColPos === pkCol.colPos
                            })
                        })
                    })

                    if (!pkColsNotInFk || pkColsNotInFk.length === 0) {
                        return failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_PK});
                    }

                    const allRequiredScalarAttributesValid = pkColsNotInFk.every(pkCol => {
                        const thisAttr = cr.table.attr[pkCol.colPos - 1];
                        return TypeConstants.isAttributeScalar(thisAttr);
                    })

                    if (!allRequiredScalarAttributesValid) {
                        return failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE});
                    }

                }

                // If no error returned, push this child relation to the list
                if (!weTableBasicCheckResult) {
                    return createWeakRelResultFromChildRelation(cr, ignoreKeyCountMismatch ? crKeyIsMismatch : undefined);
                    // childRelationsAvailableForMatching.push(cr);
                }
            }
        });
    } else if (rel.childRelations.some(cr => cr.table.idx === table.idx)) {
        // If any of the child tables of this relation node is exactly the provided table
        const parentTableBasicCheckResult = basicKeyConditionCheck(rel.parentEntity, vs.localKey, nKeys)
        let keyIsMismatch = false;
        if (parentTableBasicCheckResult) {
            return [failedPatternMatchObject(vs, parentTableBasicCheckResult)];
        }

        const weTableBasicCheckResult = basicKeyConditionCheck(table, vs.foreignKey, nKeys);
        if (weTableBasicCheckResult) {
            return [failedPatternMatchObject(vs, weTableBasicCheckResult)];
        }

        if (!keyCountCheck(rel.parentEntity, vs.localKey, nKeys) || !keyCountCheck(table, vs.foreignKey, nKeys)) {
            if (ignoreKeyCountMismatch) {
                keyIsMismatch = true;
            } else {
                return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH})]
            }
        }

        // Construct the pattern match result
        let thisPatternMatchResult = {
            vs: vs,
            mandatoryAttributes: [],
            optionalAttributes: [],
            responsibleRelation: rel,
            matched: false,
            keyIsMismatch: ignoreKeyCountMismatch ? keyIsMismatch : undefined
        };

        // Both a1 and a2 are located in the WE table
        let thisChildRelMandatoryParameters =
            getAllMatchingAttributesFromListOfParams(table, vs.mandatoryParameters);
        thisPatternMatchResult.mandatoryAttributes = thisChildRelMandatoryParameters;

        if (patternMatchSuccessful(thisPatternMatchResult, vs)) {
            thisPatternMatchResult.matched = true;
        } else {
            return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE})];
        }

        if (vs.optionalParameters) {
            let thisChildRelOptionalParameters = 
                getAllMatchingAttributesFromListOfParams(table, vs.optionalParameters);

            thisPatternMatchResult.optionalAttributes = thisChildRelOptionalParameters;
        }

        return [thisPatternMatchResult];

    } else return;
}

export const matchTableWithVisPattern = (table: Table, rels: RelationNode[], vs:VisSchema, nKeys?: number): PatternMatchResult[] => {
    if (!table.pk) return undefined; // Not suitable if there is no PK to use

    let subsetRel = rels.find(rel => rel.type === VISSCHEMATYPES.SUBSET); // TODO: multiple subsets?
    let relsInvolvedWithTable = SchemaParser.getRelationsInListByName(rels, table.tableName);


    let allPatternMatches: PatternMatchResult[] = [];
    let thisPatternMatchResult: PatternMatchResult;
    let basicKeyConditionCheckResult: PatternMismatchReason;
    switch (vs.type) {
        case VISSCHEMATYPES.BASIC:
            if (!keyCountCheck(table, vs.localKey, nKeys)) {
                allPatternMatches.push(failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH}));
                break;
            }

            allPatternMatches.push(basicEntityVisMatch(table, vs, nKeys, subsetRel));
            break;

        case VISSCHEMATYPES.WEAKENTITY:
            // Find combinations of attributes that match the requirements
            // For each of the involved relation...
            relsInvolvedWithTable.forEach(rel => {
                const weVisMatchResults = weakEntityVisMatch(table, rel, vs, nKeys);
                if (weVisMatchResults === undefined) return;
                weVisMatchResults.forEach(matchResult => {
                    if (!matchResult) return;
                    // Push the match result into the list if the relation involved had not already been matched
                    if (allPatternMatches.every(matches => matches.responsibleRelation !== matchResult.responsibleRelation)) {
                        allPatternMatches.push(matchResult);
                    } else {
                        return;
                    }
                });
            })

            break;

        case VISSCHEMATYPES.MANYMANY:
            basicKeyConditionCheckResult = basicKeyConditionCheck(table, vs.localKey, nKeys)
            if (basicKeyConditionCheckResult) {
                return [failedPatternMatchObject(vs, basicKeyConditionCheckResult)];
            }

            if (!keyCountCheck(table, vs.localKey, nKeys)) {
                return [
                    failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH})
                ];
            }
            // Find combinations of attributes that match the requirements
            relsInvolvedWithTable.forEach(rel => {
                if (rel.type !== VISSCHEMATYPES.MANYMANY) return;
                if (vs.reflexive) {
                    // Reflexive path
                    if (!isRelationReflexive(rel)) return;
                    
                    thisPatternMatchResult = {
                        vs: vs,
                        mandatoryAttributes: [],
                        optionalAttributes: [],
                        matched: false,
                        responsibleRelation: rel
                    };
                    
                    for (let mp of vs.mandatoryParameters) {
                        // Reflexive: check against one table is enough
                        // const childTable = rel.childRelations[0].table; /// Hmmmm
                        let thisConstMatchableIndices = getMatchingAttributesByParameter(table, mp);
                        thisPatternMatchResult.mandatoryAttributes.push(thisConstMatchableIndices);
                    }
    
                    if (patternMatchSuccessful(thisPatternMatchResult, vs)) {
                        thisPatternMatchResult.matched = true;
                    } else {
                        return;
                    }
        
                    if (vs.optionalParameters) {
                        for (let op of vs.optionalParameters) {
                            let thisConstMatchableIndices = getMatchingAttributesByParameter(table, op);
                            thisPatternMatchResult.optionalAttributes.push(thisConstMatchableIndices);
                        }
                    }

                    allPatternMatches.push(thisPatternMatchResult);
                } else {
                    // TODO
                    return;
                }

            })
            
            break;

        default:
            break; // TODO

        }

    if (allPatternMatches.length === 0) {
        allPatternMatches.push({
            vs: vs,
            mandatoryAttributes: [],
            optionalAttributes: [],
            matched: false,
            mismatchReason: {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_RELATION}
        });
    }

    return allPatternMatches;
}

const matchRelationWithVisPattern = (rel: RelationNode, vs: VisSchema, nKeys?: number): PatternMatchResult => {
    switch(vs.type) {
        case VISSCHEMATYPES.BASIC:
            let basicEntityMatchResult = 
                basicEntityVisMatch(rel.parentEntity, vs, nKeys, rel.type === VISSCHEMATYPES.SUBSET ? rel : undefined);
            if (!keyCountCheck(rel.parentEntity, vs.localKey, nKeys)) {
                basicEntityMatchResult.keyCountMatched = false
            } else {
                basicEntityMatchResult.keyCountMatched = true
            }

            return basicEntityMatchResult;
        case VISSCHEMATYPES.WEAKENTITY:
            return;
    }

    return undefined;
}

const getTablesWithinSet = (rel: RelationNode) => {
    let tablesWithinSet: Table[] = [];
    if (rel.type === VISSCHEMATYPES.SUBSET) {
        tablesWithinSet.push(rel.parentEntity);
        tablesWithinSet.push(...rel.childRelations.map(childRel => childRel.table));
    }

    return tablesWithinSet;
}
