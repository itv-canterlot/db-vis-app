import { Attribute, Filter, FilterType, FilterCondition, VISSCHEMATYPES, PatternMatchAttribute, VisSchema, RelationNode, ForeignKey } from "./ts/types";
import { DBSchemaContextInterface } from "./DBSchemaContext"
import * as FilterConditions from "./ts/FilterConditions";
import { keyCountCheck } from "./VisSchemaMatcher";
import { getRelationBasedData } from "./Connections";

export const filterDataByFilters = (data: object[], dbSchemaContext: DBSchemaContextInterface, filters?: Filter[]): any[] => {
    let filteredData;

    if (filters && filters.length > 0) {
        filteredData = data.filter(d => {
            return filters.every(filter => {
                const thisTable = dbSchemaContext.allEntitiesList[filter.tableIndex];
                const filterAtt = thisTable.attr[filter.attNum - 1];
                const shortName = filterAtt.attname;
                
                let attRetrievalName;
                if (shortName in d) {
                    attRetrievalName = shortName
                } else {
                    const longNameSuffix = `${thisTable.tableName}_${filterAtt.attname}`;
                    attRetrievalName = Object.keys(d).find(el => el.endsWith(longNameSuffix))
                }
                
                let param = {
                    baseVal: d[attRetrievalName],
                    std: undefined,
                    mean: undefined
                };

                if (filter.condition.filterType === FilterType.STD) {
                    const thisFilterRelatedData =  data.filter(d => d[attRetrievalName] !== undefined && d[attRetrievalName] !== null)
                    .map(d => d[attRetrievalName]);

                    param.std = getStandardDeviation(thisFilterRelatedData);
                    param.mean = getAverage(thisFilterRelatedData);
                }
                
                return FilterConditions.computeFilterCondition(param, filter)
            })
        })
    } else {
        filteredData = data;
    }

    return filteredData;
}

export const filterDataByAttribute = (data: object[], dbSchemaContext: DBSchemaContextInterface, attr: Attribute, filters?: Filter[], removeNull?: boolean) => {
    let nullRemoved: object[],
        filteredData = filterDataByFilters(data, dbSchemaContext, filters);
    if (removeNull) {
        nullRemoved = filteredData.filter(d => d[attr.attname] !== undefined && d[attr.attname] !== null);
    } else {
        nullRemoved = filteredData;
    }

    return nullRemoved.map(d => d[attr.attname]);
}

const getOneManyCountPairFromManyManyRel = (relFks: ForeignKey[], filteredData: object[]) => {
    const countCheckResult = relFks.map(fk => {
        const pkAttributeNames = fk.columns.map(col => `pk_${fk.pkTableName}_${col.pkColName}`);
        return getKeyPairCountFromData(filteredData, pkAttributeNames);
    });
    
    const fkIndexOnOneSide = countCheckResult.findIndex(pair => pair[1] === 1);
    if (fkIndexOnOneSide < 0) {
        // None fits
        return {
            pairCount: undefined,
            pairFkIndex: -1
        };
    } else {
        let keyPairCountToCheck;
        if (fkIndexOnOneSide === 0) keyPairCountToCheck = countCheckResult[1];
        else keyPairCountToCheck = countCheckResult[0];

        return {
            pairCount: keyPairCountToCheck,
            pairFkIndex: fkIndexOnOneSide === 0 ? 1 : 0
        }
    }
}

const oneManyKeyCountMatchWithPatternFromData = (relation: RelationNode, visPattern: VisSchema, filteredData: object[]): boolean => {
    if (visPattern.type !== VISSCHEMATYPES.ONEMANY) return false;
    // Need to check fk per pk
    if (relation.type !== VISSCHEMATYPES.MANYMANY) {
        const relFk = relation.childRelations[0].table.fk[relation.childRelations[0].fkIndex];
        const pkAttributeNames = relFk.columns.map(col => `pk_${relation.parentEntity.tableName}_${col.pkColName}`);
        const oneManyKeyPairCount = getKeyPairCountFromData(filteredData, pkAttributeNames);
        const localKeyCountPassed = visPattern.localKey.maxCount >= oneManyKeyPairCount[0];
        const foreignKeyCountPassed = oneManyKeyPairCount[1] >= 0 && visPattern.foreignKey.maxCount >= oneManyKeyPairCount[1];
        return localKeyCountPassed && foreignKeyCountPassed;
    }
    else {
        // For many-many and weak entity type transformations
        const relFks = relation.childRelations.map(childRel => childRel.fkIndex).map(idx => relation.parentEntity.fk[idx]);
        let {pairCount, pairFkIndex} = getOneManyCountPairFromManyManyRel(relFks, filteredData);
        
        if (pairFkIndex < 0) {
            return false;
        } else {
            const localKeyCountPassed = visPattern.localKey.maxCount >= pairCount[0];
            const foreignKeyCountPassed = pairCount[1] >= 0 && visPattern.foreignKey.maxCount >= pairCount[1];
            return localKeyCountPassed && foreignKeyCountPassed;
        }

    }
}

export const getDatasetEntryCountStatus = (filteredData: object[], visPattern: VisSchema, relation: RelationNode): boolean => {
    if (relation === undefined || filteredData === undefined) return false;
    
    let localKeyCountPassed: boolean, foreignKeyCountPassed: boolean;
    const localTableName = relation.parentEntity.tableName;
    
    const localPkAttributeList = relation.parentEntity.pk.columns.map(col => `pk_${localTableName}_${col.colName}`);
    
    const localPkFiltered = filteredData.map(d => localPkAttributeList.reduce((o, k) => {o[k] = d[k]; return o;}, {}));
    
    const localPkUnique = [];
    localPkFiltered.forEach(d => {
        if (localPkUnique.length === 0 || !localPkUnique.some(uniq => localPkAttributeList.every(attName => d[attName] === uniq[attName]))) {
            localPkUnique.push(d);
        }
    });

    if (visPattern.type === VISSCHEMATYPES.ONEMANY) {
        return oneManyKeyCountMatchWithPatternFromData(relation, visPattern, filteredData);
    } else {
        const localPkCount = localPkUnique.length;
        localKeyCountPassed = keyCountCheck(visPattern.localKey, localPkCount)
        
        if (visPattern.type !== VISSCHEMATYPES.BASIC) {
            const foreignTableName = relation.childRelations[0].table.tableName; // TODO: multi table?
            const foreignPkAttributeList = relation.childRelations[0].table.pk.columns.map(col => `pk_${foreignTableName}_${col.colName}`);
            const foreignPkFiltered = filteredData.map(d => foreignPkAttributeList.reduce((o, k) => {o[k] = d[k]; return o;}, {}));
            
            const foreignPkUnique = [];
            foreignPkFiltered.forEach(d => {
                if (foreignPkUnique.length === 0 || !foreignPkUnique.some(uniq => foreignPkAttributeList.every(attName => d[attName] === uniq[attName]))) {
                    foreignPkUnique.push(d);
                }
            });
    
            const foreignPkCount = foreignPkUnique.length;
            foreignKeyCountPassed = keyCountCheck(visPattern.foreignKey, foreignPkCount);
        } else {
            foreignKeyCountPassed = true;
        }
    
        return localKeyCountPassed && foreignKeyCountPassed;
    }
}

const getKeyPairCountFromData = (filteredData: object[], localPkAttributeList: string[]) => {
    const keyCounter: {[key: string]: number} = {};
    filteredData.forEach(d => {
        const keySubsetString = JSON.stringify(localPkAttributeList.reduce((o, k) => {o[k] = d[k]; return o;}, {}));
        const findElemInKeyCounter = Object.keys(keyCounter).find(key => key === keySubsetString);
        if (findElemInKeyCounter !== undefined) {
            // Increment counter
            keyCounter[keySubsetString]++;
        } else {
            keyCounter[keySubsetString] = 1;
        }
    });

    const keyPairCount = Math.max(...Object.values(keyCounter));
    return [Object.keys(keyCounter).length, keyPairCount];
}

export const getRelationOneManyStatus = (context: DBSchemaContextInterface, targetRelation?: RelationNode) => {
    const selectedRelation = targetRelation ? targetRelation : context.relationsList[context.relHierarchyIndices[0][0]];
    let getDataPromise = Promise.resolve(context.data);
    
    getDataPromise = getDataPromise.then(data => {
        if (data === undefined) {
            return getRelationBasedData(context.selectedRelationsIndices.map(idx => context.relationsList[idx]), context, undefined, context.filters);
        } else {
            return data;
        }
    })

    if (selectedRelation.type === VISSCHEMATYPES.MANYMANY) {
        // Which side is the "one" side?
        return Promise.resolve(getDataPromise.then(data => {
            const filteredData = filterDataByFilters(data, context, context.filters);
            let {pairCount, pairFkIndex: pairFkOneIndex} = getOneManyCountPairFromManyManyRel(selectedRelation.parentEntity.fk, filteredData);
            // For these key-pair counts, the one with pair[1] = 1 indicates it is on the "many" side of the one-to-many relation
            // For simplicity, assuming this is binary
            if (pairFkOneIndex < 0) {
                // None fits
                pairCount = [-1, -1];
                return {
                    pairCount: pairCount,
                    pairFkOneIndex: pairFkOneIndex
                }
            } else {
                return {
                    pairCount, pairFkOneIndex
                }
            }
        }));
    } else {
        let fkIndex, fk;
        fkIndex = selectedRelation.childRelations[0].fkIndex;
    
        let fkMappedToPM: PatternMatchAttribute[] = selectedRelation.childRelations[0].table.fk[fkIndex].columns.map(col => {
            return {
                table: selectedRelation.childRelations[0].table,
                attributeIndex: col.fkColPos - 1
            }
        })
    
        return Promise.resolve(getRelationBasedData(context.selectedRelationsIndices.map(idx => context.relationsList[idx]), context, [fkMappedToPM], context.filters).then(data => {
            const filteredData = filterDataByFilters(data, context, context.filters);
            const relFk = selectedRelation.childRelations[0].table.fk[selectedRelation.childRelations[0].fkIndex];
            const pkAttributeNames = relFk.columns.map(col => `pk_${selectedRelation.parentEntity.tableName}_${col.pkColName}`);
            return getKeyPairCountFromData(filteredData, pkAttributeNames);            
        }));
    }    
}

export const getStandardDeviation = (array) => {
    if (array.length === 0) return NaN;
    const n = array.length
    const arrayToNums = array.map(a => parseFloat(a));
    const mean = arrayToNums.reduce((a, b) => a + b) / n
    return Math.sqrt(arrayToNums.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
  }

export const getAverage = (arr) => {
    if (arr.length === 0) return NaN;
    return arr
        .map(e => parseFloat(e))
        .reduce( ( p, c ) => p + c, 0 ) / arr.length;
}
