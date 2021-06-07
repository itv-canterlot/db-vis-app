import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { Visualiser } from './Visualiser';

class SchemaExplorer extends React.Component<{expanded: boolean, selectedTableIndex: number, visSchemaMatchStatus?: any[]}, {}> {
    constructor(props) {
        super(props);
    }

    getMatchCount = (visStatus) => visStatus.reduce(
        (acc, curr) => {
            if (curr) return acc + 1; else return acc;
        }, 0);

    matchedSchemaDropdownItems = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        if (this.props.visSchemaMatchStatus) {
            return this.props.visSchemaMatchStatus.map((status, idx) => {
                if (status) {
                    const matchedSchema = dbSchemaContext.visSchema[idx];
                    return (
                        <li>
                            <a className="dropdown-item" href="#" key={idx}>
                                {matchedSchema.name}
                            </a>
                        </li>
                    );
                }
            })
        } else {
            return null;
        }
    }

    render() {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        if (this.props.selectedTableIndex < 0) {
            return (
                <div className="d-flex justify-content-center">
                    <div>
                        <em>Select a table to continue...</em>
                    </div>       
                </div>
            )
        } else {
            return (
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        {dbSchemaContext.allEntitiesList[this.props.selectedTableIndex].tableName}
                    </div>
                    <div className="dropdown">
                        <a className="btn btn-secondary dropdown-toggle" href="#" role="button" id="matched-schema-list-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                            Dropdown link
                        </a>

                        <ul className="dropdown-menu" id="matched-schema-list-dropdown-list" aria-labelledby="matched-schema-list-dropdown">
                            {this.matchedSchemaDropdownItems()}
                        </ul>
                    </div>
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
        // const matchedSchemaCount = () => {
        //     let matchCount = 0;
        //     let thisTable = dbSchemaContext.allEntitiesList[this.props.selectedTableIndex];
        //     if (this.props.visSchemaMatchStatus && dbSchemaContext.visSchema) {
        //         matchCount = this.props.visSchemaMatchStatus.reduce((acc, curr) => {
        //             if (curr) return acc + 1; else return acc;
        //         }, 0);
        //         return (<div>
        //             Matched schema count: {matchCount}
        //             <div>
        //                 {this.props.visSchemaMatchStatus.map((schemaStatus, schemaIndex) => {
        //                     if (schemaStatus) {
        //                         return (
        //                         <div key={schemaIndex}>
        //                             <div>{dbSchemaContext.visSchema[schemaIndex].name}</div>
        //                             <div>
        //                                 {schemaStatus.mandatoryAttributes.map((maMatchedAttributes, maIndex) => {
        //                                     return (
        //                                     <div key={maIndex}>
        //                                         <div>Attribute {maIndex}:</div>
        //                                         <div>
        //                                             {maMatchedAttributes.map((maAttributeLocation, maLocIndex) => {
        //                                                 return (
        //                                                 <div key={maLocIndex}>
        //                                                     {thisTable.attr[maAttributeLocation].attname}
        //                                                 </div>)
        //                                             })}
        //                                         </div>
        //                                         <br />
        //                                     </div>)
        //                                 })}
        //                             </div>
        //                             <br />
        //                         </div>)
        //                     }
        //                 })}
        //             </div>
        //         </div>)
        //     } else {
        //         return (
        //         <div>
        //             <em>No table selected...</em>
        //         </div>);
        //     }
        // }
        return (
            <div className="col-8 col-lg-9">
                <div className="row">
                    <div className="col">
                        <div className="row py-2" style={{borderBottom: "2px solid black"}}>
                            <div className="col">
                                <SchemaExplorer expanded={true} selectedTableIndex={this.props.selectedTableIndex} visSchemaMatchStatus={this.props.visSchemaMatchStatus} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <Visualiser selectedTableIndex={this.props.selectedTableIndex} />
                                {/* {matchedSchemaCount()} */}
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