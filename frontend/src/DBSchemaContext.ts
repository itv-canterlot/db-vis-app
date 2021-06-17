import * as React from 'react';
import { PatternMatchAttribute, PatternMatchResult, RelationNode, Table, VisSchema } from './ts/types';

export interface DBSchemaContextInterface {
    allEntitiesList: Table[],
    relationsList: RelationNode[],
    visSchema: VisSchema[],
    visSchemaMatchStatus: PatternMatchResult[]
    selectedPatternIndex: number,
    selectedFirstTableIndex: number
    selectedAttributesIndices: PatternMatchAttribute[][]
}

export const DBSchemaContext = React.createContext<DBSchemaContextInterface>({
    allEntitiesList: [],
    relationsList: [],
    visSchema: [],
    visSchemaMatchStatus: [],
    selectedPatternIndex: -1,
    selectedFirstTableIndex: -1,
    selectedAttributesIndices: [[], []]
});