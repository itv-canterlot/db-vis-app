import * as React from 'react';
import { Filter, PatternMatchAttribute, PatternMatchResult, RelationNode, Table, VisSchema } from './ts/types';

export interface DBSchemaContextInterface {
    allEntitiesList: Table[],
    data: object[],
    filters: Filter[],
    dataLoaded: boolean
    relationsList: RelationNode[],
    visSchema: VisSchema[],
    visSchemaMatchStatus: PatternMatchResult[]
    selectedPatternIndex: number,
    selectedFirstTableIndex: number
    selectedAttributesIndices: PatternMatchAttribute[][]
}

export const DBSchemaContext = React.createContext<DBSchemaContextInterface>({
    allEntitiesList: [],
    data: [],
    dataLoaded: false,
    filters: [],
    relationsList: [],
    visSchema: [],
    visSchemaMatchStatus: [],
    selectedPatternIndex: -1,
    selectedFirstTableIndex: -1,
    selectedAttributesIndices: [[], []]
});