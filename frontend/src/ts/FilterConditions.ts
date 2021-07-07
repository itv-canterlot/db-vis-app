import { Filter, FilterCondition, FilterType } from "./types";

export const scalarConditions: FilterCondition[] = [
    {
        filterType: FilterType.SCALAR_COMPARISON,
        friendlyName: "is equal to",
        sqlCommand: "="
    }, {
        filterType: FilterType.SCALAR_COMPARISON,
        friendlyName: "is not equal to",
        sqlCommand: "!="
    }, {
        filterType: FilterType.SCALAR_COMPARISON,
        friendlyName: "is greater than",
        sqlCommand: ">"
    }, {
        filterType: FilterType.SCALAR_COMPARISON,
        friendlyName: "is less than",
        sqlCommand: "<"
    }, {
        filterType: FilterType.SCALAR_COMPARISON,
        friendlyName: "is greater than or equal to",
        sqlCommand: ">="
    }, {
        filterType: FilterType.SCALAR_COMPARISON,
        friendlyName: "is less than or equal to",
        sqlCommand: "<="
    }
];

export const stdRangeCondition: FilterCondition = {
    filterType: FilterType.STD,
    friendlyName: "standard deviations"
}

export const computeFilterCondition = (params: {[key: string]: number}, filter: Filter) => {
    const filterType = filter.condition.filterType;
    
    if (filterType === FilterType.SCALAR_COMPARISON) {
        computeScalarFilterCondition(params, filter);
    }
    else if (filterType === FilterType.STD) {
        computeStdRangeFilterCondition(params, filter);
    }
    else {
        return undefined;
    }
}

const computeScalarFilterCondition = (params: {[key: string]: number}, filter: Filter) => {
    const filterType = filter.condition.filterType;
    if (filterType !== FilterType.SCALAR_COMPARISON) return undefined;

    const comparedVal = filter.value,
        baseVal = params.baseVal,
        sqlCommand = filter.condition.sqlCommand;

    // TODO: more graceful way?
    if (sqlCommand === "=") {
        return baseVal === comparedVal;
    } else if (sqlCommand === "!=") {
        return baseVal !== comparedVal;
    } else if (sqlCommand === ">") {
        return baseVal > comparedVal;
    } else if (sqlCommand === "<") {
        return baseVal < comparedVal;
    } else if (sqlCommand === ">=") {
        return baseVal >= comparedVal;
    } else if (sqlCommand === "<=") {
        return baseVal <= comparedVal;
    }

    else return undefined;
}

const computeStdRangeFilterCondition = (params: {[key: string]: number}, filter: Filter) => {
    const filterType = filter.condition.filterType;
    if (filterType !== FilterType.STD) return undefined;

    const mean = params.mean, std = params.std, baseVal = params.baseVal;
    
    const stdRange = filter.value * std;
    const highRange = mean + stdRange,
          lowRange = mean - stdRange;

    return baseVal >= lowRange && baseVal <= highRange;
}