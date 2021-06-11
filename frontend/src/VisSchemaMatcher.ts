import {Attribute, PrimaryKey, RelationNode, Table, VisKey, VisParam, VISPARAMTYPES, VisSchema, VISSCHEMATYPES, MatchedParamIndicesType} from "./ts/types";
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

const getNeighbourJunctionTableIdx = (rel: RelationNode) => {
    let childJunctionTableIndices: number[] = [];
        for (let i = 0; i < rel.childEntities.length; i++) {
            let childNode = rel.childEntities[i];
            if (childNode.type === VISSCHEMATYPES.WEAKENTITY) {
                childJunctionTableIndices.push(i);
            }
        }

    return childJunctionTableIndices;
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
    let paramMatchableIndices: number[] = [];
    for (let i = 0; i < table.attr.length; i++) {
        const thisAttr = table.attr[i];
        // Skip pks(?)
        if (isAttributeInPublicKey(i, table.pk)) continue;
        // Check specific types first
        if (!doesAttributeMatchVisParamType(thisAttr, param)) continue;

        // Add this attribute to the list above
        paramMatchableIndices.push(i);
    }

    return paramMatchableIndices;
}

const isAttributeInPublicKey = (idx: number, pk: PrimaryKey) => {
    return (pk.columns.map(col => col.colPos).includes(idx + 1));
}

const isRelationReflexive = (rel: RelationNode) => {
    if (rel.type !== VISSCHEMATYPES.MANYMANY) return false;
    // Reflexive: the "child nodes" of this junction table point to the same table
    if (rel.childEntities.length < 2) return false;
    let reflexCounter: {[id: string]: number} = {};

    rel.childEntities.forEach(ent => {
        if (ent.parentEntity.tableName in reflexCounter) {
            reflexCounter[ent.parentEntity.tableName]++;
        } else {
            reflexCounter[ent.parentEntity.tableName] = 1;
        }
    });

    return Object.values(reflexCounter).some(v => v >= 2);
}

export const matchTableWithAllRels = (table: Table, rel: RelationNode, vss:VisSchema[]) => {
    let out = [];
    vss.forEach(vs => {
        out.push(matchTableWithRel(table, rel, vs));
    })

    return out;
}

export const matchTableWithRel = (table: Table, rel: RelationNode, vs:VisSchema) => {
    if (!table.pk) return undefined; // Not suitable if there is no PK to use

    if (!basicKeyConditionCheck(table, vs.localKey)) {
        return undefined;
    }

    switch (vs.type) {
        case VISSCHEMATYPES.BASIC:
            // Find combinations of attributes that match the requirements
            let allMatchableParameters: number[][] = [];
            
            // For each attribute in vs, compare against each attr in table, add appropriate indices to list
            for (let mp of vs.mandatoryParameters) {
                let thisConstMatchableIndices: number[] = getMatchingAttributesByParameter(table, mp);
                
                allMatchableParameters.push(thisConstMatchableIndices);
            }

            // Check if there is at least one match for each mandatory attributes
            if (allMatchableParameters.length > 0 && allMatchableParameters.every(idxes => idxes.length > 0)) {
                // TODO: do optional param match here
                let matchedParamIndices: MatchedParamIndicesType = {mandatoryAttributes: allMatchableParameters};

                if (vs.optionalParameters) {
                    let allMatchableOptionalParams: number[][] = [];
                    for (let op of vs.optionalParameters) {
                        let thisConstMatchableIndices = getMatchingAttributesByParameter(table, op);
                        allMatchableOptionalParams.push(thisConstMatchableIndices);
                    }

                    matchedParamIndices.optionalAttributes = allMatchableOptionalParams;
                }
                return matchedParamIndices;
            } else {
                return undefined;
            }
        case VISSCHEMATYPES.MANYMANY:
            if (rel.type === VISSCHEMATYPES.MANYMANY) {
                if (vs.reflexive && !isRelationReflexive(rel)) return undefined; // Check reflexibility

                // Get the indices on the weak entity table that can be used to match foreign tables
                let thisTableValidAttIdx: number[] = getMatchingAttributesByParameter(table, vs.localKey);
                let foreignTablesValidAttIdx: number[][] = [];
                if (thisTableValidAttIdx.length > 0) {
                    // For each neighbour, for each attribute in each neighbour, check key count attribute properties
                    for (let childRel of rel.childEntities) {
                        const ft = childRel.parentEntity;
                        if (!basicKeyConditionCheck(ft, vs.foreignKey)) continue;
                        foreignTablesValidAttIdx.push(getMatchingAttributesByParameter(ft, vs.foreignKey));
                    }
                    if (foreignTablesValidAttIdx.length > 0 && foreignTablesValidAttIdx.every(idxes => idxes.length > 0)) {
                        return true;
                    } else {
                        return undefined;
                    }
                } else {
                    return undefined;
                }
            } else {
                return undefined;
                // const neighbourJunctionIndices = getNeighbourJunctionTableIdx(rel);
                // if (neighbourJunctionIndices.length === 0) return undefined;

                // // Some of the neighbour relation is a junction table - out to where
            }
        case VISSCHEMATYPES.WEAKENTITY:
            if (rel.type === VISSCHEMATYPES.WEAKENTITY)  {
                // Get the indices on the weak entity table that can be used to match foreign tables
                let thisTableValidAttIdx: number[] = getMatchingAttributesByParameter(table, vs.localKey);
                let foreignTablesValidAttIdx: number[][] = [];
                if (thisTableValidAttIdx.length > 0) {
                    // For each neighbour, for each attribute in each neighbour, check key count attribute properties
                    for (let childRel of rel.childEntities) {
                        const ft = childRel.parentEntity;
                        if (!basicKeyConditionCheck(ft, vs.foreignKey)) continue;
                        foreignTablesValidAttIdx.push(getMatchingAttributesByParameter(ft, vs.foreignKey));
                    }
                    if (foreignTablesValidAttIdx.length > 0 && foreignTablesValidAttIdx.every(idxes => idxes.length > 0)) {
                        return true;
                    } else {
                        return undefined;
                    }
                } else {
                    return undefined;
                }
            } else {
                return undefined;
                // const neighbourJunctionIndices = getNeighbourJunctionTableIdx(rel);
                // if (neighbourJunctionIndices.length === 0) return undefined;

                // // Some of the neighbour relation is a junction table - out to where
            }
        case VISSCHEMATYPES.ONEMANY:
            return undefined;
        default:
            return undefined;
    }
}