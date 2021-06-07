import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { VisSchema } from './ts/types';

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

export class AppMainCont extends React.Component<{selectedTableIndex: number, visSchemaMatchStatus: any[], load: boolean}, {}> {
    render() {
        if (this.props.load) {
            return (<div>Loading...</div>);
        }
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const matchedSchemaCount = () => {
            let matchCount = 0;
            let thisTable = dbSchemaContext.allEntitiesList[this.props.selectedTableIndex];
            if (this.props.visSchemaMatchStatus && dbSchemaContext.visSchema) {
                matchCount = this.props.visSchemaMatchStatus.reduce((acc, curr) => {
                    if (curr) return acc + 1; else return acc;
                }, 0);
                return (<div>
                    Matched schema count: {matchCount}
                    <div>
                        {this.props.visSchemaMatchStatus.map((schemaStatus, schemaIndex) => {
                            if (schemaStatus) {
                                return (
                                <div key={schemaIndex}>
                                    <div>{dbSchemaContext.visSchema[schemaIndex].name}</div>
                                    <div>
                                        {schemaStatus.mandatoryAttributes.map((maMatchedAttributes, maIndex) => {
                                            return (
                                            <div key={maIndex}>
                                                <div>Attribute {maIndex}:</div>
                                                <div>
                                                    {maMatchedAttributes.map((maAttributeLocation, maLocIndex) => {
                                                        return (
                                                        <div key={maLocIndex}>
                                                            {thisTable.attr[maAttributeLocation].attname}
                                                        </div>)
                                                    })}
                                                </div>
                                                <br />
                                            </div>)
                                        })}
                                    </div>
                                    <br />
                                </div>)
                            }
                        })}
                    </div>
                </div>)
            } else {
                return (
                <div>
                    <em>No table selected...</em>
                </div>);
            }
        }
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
                                {matchedSchemaCount()}
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