import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';

class SchemaExplorer extends React.Component<{expanded: boolean, selectedTableIndex: number}, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        if (this.props.selectedTableIndex < 0) {
            return (
                <div>
                    <em>Select a table to continue...</em>
                </div>
            )
        } else {
            return (
                <div>
                    {dbSchemaContext.allEntitiesList[this.props.selectedTableIndex].tableName}
                </div>
            );
        }
    }
}
SchemaExplorer.contextType = DBSchemaContext;

export class AppMainCont extends React.Component<{selectedTableIndex: number}, {}> {
    render() {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        return (
            <div className="col-8 col-lg-9">
                <div className="row">
                    <div className="col">
                        <div className="row py-2" style={{borderBottom: "2px solid black"}}>
                            <div className="col d-flex justify-content-center">
                                <SchemaExplorer expanded={true} selectedTableIndex={this.props.selectedTableIndex} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                Placeholder 2
                            </div>
                        </div>
                        {/* {this.props.selectedTableIndex >= 0 ? <TableCard selectedTableIndex={this.props.selectedTableIndex} /> : null} */}
                    </div>
                </div>
            </div>
        );
    }
}
AppMainCont.contextType = DBSchemaContext;