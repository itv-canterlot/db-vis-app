import * as SchemaParser from "./SchemaParser";
import {Attribute, RelationNode, Table, VisKey, VisParam, VISPARAMTYPES, VisSchema, VISSCHEMATYPES, PatternMatchResult, PatternMatchAttribute, PatternMismatchReason, PATTERN_MISMATCH_REASON_TYPE, ChildRelation} from "./ts/types";
import * as TypeConstants from "./TypeConstants";
import { getRelationOneManyStatus } from "./DatasetUtils";
import { DBSchemaContextInterface } from "./DBSchemaContext";

export const keyCountCheck = (key: VisKey, nPks: number): boolean => {
    const keyMinCount = key.minCount,
        keyMaxCount = key.maxCount,
        tableKeyCount = nPks;
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
        // If param type is colour, process the parameter separately
        if (param.type === VISPARAMTYPES.COLOR) {
            // For now, just add it into the list?
            paramMatchableIndices.push({
                table: table,
                attributeIndex: i
            });
        }
        const thisAttr = table.attr[i];
        // Skip pks
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
            if (param.type === VISPARAMTYPES.COLOR) {
                // For now, just add it into the list?
                matchResult.push({
                    table: table,
                    attributeIndex: i
                });
            }
            const thisAttr = table.attr[i];
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

const isPatternMatchSuccessful = (result: PatternMatchResult, vs: VisSchema) => {
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

/* Different matchers */
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

export const matchRelationWithAllVisPatterns = async (context: DBSchemaContextInterface, targetRelation: RelationNode): Promise<PatternMatchResult[][]> => {
    const oneManyMaxPairedVal = await getRelationOneManyStatus(context, targetRelation);
    const selectedRelationsIndices = context.selectedRelationsIndices.slice(0, 1); // *not* including the auxilliary rel for now
    const relationsForOptionalParams = selectedRelationsIndices.flat().map(relIdx => context.relationsList[relIdx]);

    let out = [];
    const vss = context.visSchema;
    // If the table is in a set, treat the set as a big table
    // getTablesWithinSet(rels, tablesWithinSet, relsWithoutSubset);
    vss.forEach((vs, idx) => {
        const thisVisSchemaMatchResult = matchRelationWithVisPattern(targetRelation, vs, oneManyMaxPairedVal, relationsForOptionalParams);
        if (thisVisSchemaMatchResult) {
            out.push(thisVisSchemaMatchResult);
        } else {
            out.push(undefined);
        }
    });
    return out;
}

export const matchAllSelectedRelationsWithVisPatterns = (context: DBSchemaContextInterface): Promise<PatternMatchResult[][][]> => {
    return Promise.all(
        context.selectedRelationsIndices.map(relIdx => {
            const thisRelation = context.relationsList[relIdx];
            return matchRelationWithAllVisPatterns(context, thisRelation);
        })
    )
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

const basicEntityVisMatch = (table: Table, vs: VisSchema, nKeys?: number, subsetRel?: RelationNode, relationsForOptionalParams?: RelationNode[]): PatternMatchResult => {
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
        let thisConstMatchableIndices: PatternMatchAttribute[];
        if (subsetRel) {
            thisConstMatchableIndices = getMatchAttributesFromSet(subsetRel, mp)
            thisPatternMatchResult.responsibleRelation = subsetRel;
        } else {
            thisConstMatchableIndices = getMatchingAttributesByParameter(table, mp);
        }
        thisPatternMatchResult.mandatoryAttributes.push(thisConstMatchableIndices);
    }

    if (isPatternMatchSuccessful(thisPatternMatchResult, vs)) {
        thisPatternMatchResult.matched = true;
    } else {
        return failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE});
    }

    if (vs.optionalParameters) {
        for (let op of vs.optionalParameters) {
            let thisConstMatchableIndices: PatternMatchAttribute[];
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

const weakEntityVisMatch = (table: Table, rel: RelationNode, vs: VisSchema, nKeys?: number, ignoreKeyCountMismatch?: boolean, relationsForOptionalParams?: RelationNode[]): PatternMatchResult[] => {
    if (rel.type !== VISSCHEMATYPES.WEAKENTITY) {
        return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.PATTERN_TYPE_MISMATCH})]
    };
    
    if (vs.type !== VISSCHEMATYPES.WEAKENTITY) return;
    
    if (vs.complete) {
        // Complete path - TODO
        // if (!isRelationComplete(rel)) return;
        return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.PATTERN_TYPE_MISMATCH})];
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
        
        if (!keyCountCheck(vs.localKey, nKeys ? nKeys : table.pk.keyCount)) {
            if (ignoreKeyCountMismatch) {
                parentKeyIsMismatch = true;
            } else {
                return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH})];
            }
        }

        const createWeakRelResultFromChildRelation = (cr: ChildRelation, isKeyMismatch?: boolean) => {
            let thisPatternMatchResult: PatternMatchResult = {
                vs: vs,
                mandatoryAttributes: [],
                optionalAttributes: [],
                responsibleRelation: rel,
                matched: false,
                keyCountMatched: ignoreKeyCountMismatch ? !isKeyMismatch : undefined
            };

            // Both a1 and a2 are located in the WE table
            let thisChildRelMandatoryParameters =
                getAllMatchingAttributesFromListOfParams(cr.table, vs.mandatoryParameters);
            thisPatternMatchResult.mandatoryAttributes = thisChildRelMandatoryParameters;
            // TODO: mirror the scalar key check above

            if (isPatternMatchSuccessful(thisPatternMatchResult, vs)) {
                thisPatternMatchResult.matched = true;
            } else {
                return failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE});
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

            if (!keyCountCheck(vs.localKey, nKeys ? nKeys : cr.table.pk.keyCount)) {
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

                // If no error returned, push this child relation to the list
            }
            
            return createWeakRelResultFromChildRelation(cr, ignoreKeyCountMismatch ? (crKeyIsMismatch || parentKeyIsMismatch) : undefined);
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

        if (!keyCountCheck(vs.localKey, nKeys ? nKeys : rel.parentEntity.pk.keyCount) || !keyCountCheck(vs.foreignKey, nKeys ? nKeys : table.pk.keyCount)) {
            if (ignoreKeyCountMismatch) {
                keyIsMismatch = true;
            } else {
                return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH})]
            }
        }

        // Construct the pattern match result
        let thisPatternMatchResult: PatternMatchResult = {
            vs: vs,
            mandatoryAttributes: [],
            optionalAttributes: [],
            responsibleRelation: rel,
            matched: false,
            keyCountMatched: ignoreKeyCountMismatch ? keyIsMismatch : undefined
        };

        // Both a1 and a2 are located in the WE table
        let thisChildRelMandatoryParameters =
            getAllMatchingAttributesFromListOfParams(table, vs.mandatoryParameters);
        thisPatternMatchResult.mandatoryAttributes = thisChildRelMandatoryParameters;

        if (isPatternMatchSuccessful(thisPatternMatchResult, vs)) {
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

    } else {
        console.log("uh where did we end up here")
        return;
    };
}

const manyManyEntityMatch = (rel: RelationNode, vs: VisSchema, nKeys: number, ignoreKeyCountMismatch?: boolean, relationsForOptionalParams?: RelationNode[]): PatternMatchResult[] => {
    if (vs.type !== VISSCHEMATYPES.MANYMANY) return;
    if (rel.type !== VISSCHEMATYPES.MANYMANY) {
        return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.PATTERN_TYPE_MISMATCH})];
    }

    // For each combination of the child entities of the relationship:
    let allPatternMatchResults: PatternMatchResult[] = [];
    for (let i = 0; i < rel.childRelations.length; i++) {
        for (let j = i + 1; j < rel.childRelations.length; j++) {
            const r1 = rel.childRelations[i];
            const r2 = rel.childRelations[j];
            let keyMismatch = false;

            // Reflexivity check
            if (vs.reflexive) {
                if (r1.table.idx !== r2.table.idx) {
                    allPatternMatchResults.push(failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.REFLEXITIVITY_MISMATCH}));
                    continue;
                }
            } else {
                // TODO: is the reflexivity=no mandatory or optional?
            }

            // Child relation table count check
            // Using localKey as k1, foreignKey as k2
            if (!keyCountCheck(vs.localKey, nKeys ? nKeys : r1.table.pk.keyCount)) {
                if (ignoreKeyCountMismatch) {
                    keyMismatch = true;
                } else {
                    allPatternMatchResults.push(failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH}));
                    continue;
                }
            }

            if (!keyCountCheck(vs.foreignKey, nKeys ? nKeys : r2.table.pk.keyCount)) {
                if (ignoreKeyCountMismatch) {
                    keyMismatch = true;
                } else {
                    allPatternMatchResults.push(failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH}));
                    continue;
                }
            }

            let thisPatternMatchResult: PatternMatchResult = {
                vs: vs,
                mandatoryAttributes: [],
                optionalAttributes: [],
                matched: false,
                responsibleRelation: rel,
                keyCountMatched: ignoreKeyCountMismatch ? !keyMismatch : undefined
            };
            
            for (let mp of vs.mandatoryParameters) {
                // Reflexive: check against one table is enough
                // const childTable = rel.childRelations[0].table; /// Hmmmm
                let thisConstMatchableIndices = getMatchingAttributesByParameter(rel.parentEntity, mp);
                thisPatternMatchResult.mandatoryAttributes.push(thisConstMatchableIndices);
            }
        
            if (isPatternMatchSuccessful(thisPatternMatchResult, vs)) {
                thisPatternMatchResult.matched = true;
            } else {
                allPatternMatchResults.push(failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE}));
                continue;
            }
        
            if (vs.optionalParameters) {
                for (let op of vs.optionalParameters) {
                    let thisConstMatchableIndices = getMatchingAttributesByParameter(rel.parentEntity, op);
                    thisPatternMatchResult.optionalAttributes.push(thisConstMatchableIndices);
                }
            }

            allPatternMatchResults.push(thisPatternMatchResult);
        }
    }

    return allPatternMatchResults;
}

export const oneManyVisMatch = 
    (rel: RelationNode, vs: VisSchema, ignoreKeyCountMismatch?: boolean, oneManyMaxPairedVal?: any, relationsForOptionalParams?: RelationNode[]): PatternMatchResult[] => {
        if (rel.type !== VISSCHEMATYPES.WEAKENTITY && rel.type !== VISSCHEMATYPES.ONEMANY && rel.type !== VISSCHEMATYPES.MANYMANY) {
            return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.PATTERN_TYPE_MISMATCH})]
        };

        if (vs.type !== VISSCHEMATYPES.ONEMANY) return;
        let keyIsMismatch = false;

        let pairCount, pairFkOneIndex;
        if (Array.isArray(oneManyMaxPairedVal)) {
            pairCount = oneManyMaxPairedVal;
        } else {
            pairCount = oneManyMaxPairedVal.pairCount;
            pairFkOneIndex = oneManyMaxPairedVal.pairFkOneIndex;
        }
        
        if (!keyCountCheck(vs.localKey, pairCount[0])) {
            if (ignoreKeyCountMismatch) {
                keyIsMismatch = true;
            } else {
                return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH})];
            }
        }

        if (pairCount[1] < 0 || pairCount[1] > vs.foreignKey.maxCount) {
            if (ignoreKeyCountMismatch) {
                keyIsMismatch = true;
            } else {
                return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH})];
            }
        }

        let thisPatternMatchResult: PatternMatchResult = {
            vs: vs,
            mandatoryAttributes: [],
            optionalAttributes: [],
            matched: false,
            responsibleRelation: rel,
            keyCountMatched: ignoreKeyCountMismatch ? !keyIsMismatch : undefined
        };

        if (vs.mandatoryParameters) {
            if (rel.type === VISSCHEMATYPES.MANYMANY) {
                // Find out which side of this relationship is "one"
                // Assume relation is binary
                if (pairFkOneIndex < 0) {
                    return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE})];
                }
                const manySideChildEntity = rel.childRelations.find(rel => rel.fkIndex === (pairFkOneIndex === 0 ? 1 : 0)).table;
                for (let mp of vs.mandatoryParameters) {
                    let thisConstMatchableIndices = getMatchingAttributesByParameter(manySideChildEntity, mp);
                    thisPatternMatchResult.mandatoryAttributes.push(thisConstMatchableIndices);
                }
    
                if (isPatternMatchSuccessful(thisPatternMatchResult, vs)) {
                    thisPatternMatchResult.matched = true;
                    thisPatternMatchResult.manyManyOneSideFkIndex = pairFkOneIndex
                } else {
                    return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE})];
                }
            } else {
                for (let mp of vs.mandatoryParameters) {
                    let thisConstMatchableIndices = getMatchingAttributesByParameter(rel.childRelations[0].table, mp);
                    thisPatternMatchResult.mandatoryAttributes.push(thisConstMatchableIndices);
                }
    
                if (isPatternMatchSuccessful(thisPatternMatchResult, vs)) {
                    thisPatternMatchResult.matched = true;
                } else {
                    return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE})];
                }
            }
        } else {
            if (rel.type === VISSCHEMATYPES.MANYMANY && pairFkOneIndex < 0) {
                return [failedPatternMatchObject(vs, {reason: PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_ATTRIBUTE})];
            } else {
                thisPatternMatchResult.matched = true;
            }
        }
    
        if (vs.optionalParameters) {
            if (rel.type === VISSCHEMATYPES.MANYMANY) {
                if (pairFkOneIndex >= 0) {
                    const oneSideChildEntity = rel.childRelations.find(rel => rel.fkIndex === pairFkOneIndex).table;
                    for (let op of vs.optionalParameters) {
                        let thisConstMatchableIndices = getMatchingAttributesByParameter(oneSideChildEntity, op);
                        thisPatternMatchResult.optionalAttributes.push(thisConstMatchableIndices);
                    }    
                }
            } else {
                for (let op of vs.optionalParameters) {
                    let thisConstMatchableIndices = getMatchingAttributesByParameter(rel.childRelations[0].table, op);
                    thisPatternMatchResult.optionalAttributes.push(thisConstMatchableIndices);
                }
            }
        }
        
        return [thisPatternMatchResult];
}

export const matchTableWithVisPattern = (table: Table, rels: RelationNode[], vs:VisSchema, nKeys?: number): PatternMatchResult[] => {
    if (!table.pk) return undefined; // Not suitable if there is no PK to use

    let subsetRel = rels.find(rel => rel.type === VISSCHEMATYPES.SUBSET); // TODO: multiple subsets?
    let relsInvolvedWithTable = SchemaParser.getRelationsInListByName(rels, table.tableName);

    let allPatternMatches: PatternMatchResult[] = [];
    switch (vs.type) {
        case VISSCHEMATYPES.BASIC:
            if (!keyCountCheck(vs.localKey, nKeys ? nKeys : table.pk.keyCount)) {
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
            // Find combinations of attributes that match the requirements
            relsInvolvedWithTable.forEach(rel => {
                if (rel.type !== VISSCHEMATYPES.MANYMANY) return;
                allPatternMatches = manyManyEntityMatch(rel, vs, nKeys);
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

const matchRelationWithVisPattern = 
    (targetRelation: RelationNode, vs: VisSchema, oneManyMaxPairedVal?: any, relationsForOptionalParams?: RelationNode[]): PatternMatchResult[] => {
    switch(vs.type) {
        case VISSCHEMATYPES.BASIC:
            let basicEntityMatchResult = 
                basicEntityVisMatch(
                    targetRelation.parentEntity, vs, undefined, targetRelation.type === VISSCHEMATYPES.SUBSET ? targetRelation : undefined, relationsForOptionalParams);
            if (!keyCountCheck(vs.localKey, targetRelation.parentEntity.pk.keyCount)) {
                basicEntityMatchResult.keyCountMatched = false
            } else {
                basicEntityMatchResult.keyCountMatched = true
            }
            return [basicEntityMatchResult];
        case VISSCHEMATYPES.WEAKENTITY:
            return weakEntityVisMatch(targetRelation.parentEntity, targetRelation, vs, undefined, true, relationsForOptionalParams);
        case VISSCHEMATYPES.ONEMANY:
            return oneManyVisMatch(targetRelation, vs, true, oneManyMaxPairedVal, relationsForOptionalParams);
        case VISSCHEMATYPES.MANYMANY:
            return manyManyEntityMatch(targetRelation, vs, undefined, true, relationsForOptionalParams);
        default:
            return;
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
