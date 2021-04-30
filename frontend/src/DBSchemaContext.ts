import * as React from 'react';
import { Table } from './ts/types';

export interface DBSchemaContextInterface {
    allEntitiesList: Table[]
}

export const DBSchemaContext = React.createContext<DBSchemaContextInterface>({
    allEntitiesList: []
});