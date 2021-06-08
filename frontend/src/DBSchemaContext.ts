import * as React from 'react';
import { RelationNode, Table, VisSchema } from './ts/types';

export interface DBSchemaContextInterface {
    allEntitiesList: Table[],
    relationsList: RelationNode[],
    visSchema: VisSchema[],
    selectedPatternIndex: number
}

export const DBSchemaContext = React.createContext<DBSchemaContextInterface>({
    allEntitiesList: [],
    relationsList: [],
    visSchema: [],
    selectedPatternIndex: -1
});