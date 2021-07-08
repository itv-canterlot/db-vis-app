import { Attribute, Filter, FilterType, FilterCondition } from "./ts/types";
import { DBSchemaContextInterface } from "./DBSchemaContext"
import * as FilterConditions from "./ts/FilterConditions";

export const filterDataByFilters = (data: object[], dbSchemaContext: DBSchemaContextInterface, filters?: Filter[]): any[] => {
    let filteredData;

    if (filters) {
        filteredData = data.filter(d => {
            return filters.every(filter => {
                const filterAtt = dbSchemaContext.allEntitiesList[filter.tableIndex].attr[filter.attNum - 1];
                let param = {
                    baseVal: parseFloat(d[filterAtt.attname]),
                    std: undefined,
                    mean: undefined
                };

                if (filter.condition.filterType === FilterType.STD) {
                    const thisFilterRelatedData =  data.filter(d => d[filterAtt.attname] !== undefined && d[filterAtt.attname] !== null)
                    .map(d => d[filterAtt.attname]);

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