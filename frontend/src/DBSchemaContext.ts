import * as React from 'react';
import { RelationNode, Table } from './ts/types';

export interface DBSchemaContextInterface {
    allEntitiesList: Table[],
    relationsList: RelationNode[]
}

export const DBSchemaContext = React.createContext<DBSchemaContextInterface>({
    allEntitiesList: [],
    relationsList: []
});