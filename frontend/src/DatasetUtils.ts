import { Attribute, Filter, FilterType, FilterCondition, VISSCHEMATYPES } from "./ts/types";
import { DBSchemaContextInterface } from "./DBSchemaContext"
import * as FilterConditions from "./ts/FilterConditions";
import { keyCountCheck } from "./VisSchemaMatcher";

export const filterDataByFilters = (data: object[], dbSchemaContext: DBSchemaContextInterface, filters?: Filter[]): any[] => {
    let filteredData;

    if (filters) {
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
                    baseVal: parseFloat(d[attRetrievalName]),
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

export const getDatasetEntryCountStatus = (context: DBSchemaContextInterface) => {
    const filteredData = context.data;
    const selectedPatternIndex = context.selectedPatternIndex;
    const selectedVisPattern = context.visSchema[selectedPatternIndex];
    const selectedRelation = context.relationsList[context.relHierachyIndices[0][0]];

    if (selectedRelation === undefined || filteredData === undefined) return false;
    
    let localKeyCountPassed: boolean, foreignKeyCountPassed: boolean;
    const localTableName = selectedRelation.parentEntity.tableName;
    
    if (selectedPatternIndex === undefined || selectedPatternIndex < 0) return false;
    const localPkAttributeList = selectedRelation.parentEntity.pk.columns.map(col => `pk_${localTableName}_${col.colName}`);
    
    const localPkFiltered = filteredData.map(d => localPkAttributeList.reduce((o, k) => {o[k] = d[k]; return o;}, {}));
    
    const localPkUnique = [];
    localPkFiltered.forEach(d => {
        if (localPkUnique.length === 0 || !localPkUnique.some(uniq => localPkAttributeList.every(attName => d[attName] === uniq[attName]))) {
            localPkUnique.push(d);
        }
    });
    const localPkCount = localPkUnique.length;
    localKeyCountPassed = keyCountCheck(selectedVisPattern.localKey, localPkCount)
    
    if (selectedVisPattern.type !== VISSCHEMATYPES.BASIC) {
        const foreignTableName = selectedRelation.childRelations[0].table.tableName; // TODO: multi table?
        const foreignPkAttributeList = selectedRelation.childRelations[0].table.pk.columns.map(col => `pk_${foreignTableName}_${col.colName}`);
        const foreignPkFiltered = filteredData.map(d => foreignPkAttributeList.reduce((o, k) => {o[k] = d[k]; return o;}, {}));
        
        const foreignPkUnique = [];
        foreignPkFiltered.forEach(d => {
            if (foreignPkUnique.length === 0 || !foreignPkUnique.some(uniq => foreignPkAttributeList.every(attName => d[attName] === uniq[attName]))) {
                foreignPkUnique.push(d);
            }
        });

        const foreignPkCount = foreignPkUnique.length;
        foreignKeyCountPassed = keyCountCheck(selectedVisPattern.foreignKey, foreignPkCount);
    } else {
        foreignKeyCountPassed = true;
    }

    return localKeyCountPassed && foreignKeyCountPassed;
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