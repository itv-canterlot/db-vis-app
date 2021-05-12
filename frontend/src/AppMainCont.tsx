import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';

export class AppMainCont extends React.Component<{selectedTableIndex: number}, {}> {
    render() {
        return (
            <div className="col-auto p-3">
                {/* {this.props.selectedTableIndex >= 0 ? <TableCard selectedTableIndex={this.props.selectedTableIndex} /> : null} */}
            </div>
        );
    }
}