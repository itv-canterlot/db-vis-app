import * as React from 'react';

import { SidebarBubbleBlock } from './UIElements';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { Table } from './ts/types';

import * as ComponentTypes from './ts/components';

export class TableCard extends React.Component<{}, {showFk?: boolean}> {
    constructor(props) {
        super(props);
        this.state = {
            showFk: false
        };
    }

    render() {
        const context: DBSchemaContextInterface = this.context;
        const selectedTable = context.allEntitiesList[context.selectedFirstTableIndex];
        let pkConstraintName = "";
        
        if (selectedTable === undefined) return null;
        
        if (selectedTable.pk) {
            pkConstraintName = selectedTable.pk.keyName
        }

        return (
        <div className="card w-100">
            <ul className="list-group list-group-flush">
                {selectedTable.attr.map((el, idx) => {
                    let itemIsPrimaryKey = false, itemIsForeignKey = false;
                    let fkConstraintNames = [];
                    if (selectedTable.pk) {
                        if (selectedTable.pk.columns.map(key => key.colPos).includes(el.attnum)) {
                            itemIsPrimaryKey = true;
                            pkConstraintName = selectedTable.pk.keyName;
                        }
                    }
                    if (selectedTable.fk) {
                        selectedTable.fk.forEach(cons => {
                            if (cons.columns.map(key => key.fkColPos).includes(el.attnum)) {
                                itemIsForeignKey = true;
                                fkConstraintNames.push(cons.keyName);
                            }
                        });
                    }

                    return (
                        <li className="list-group-item d-flex align-items-center" key={idx}>
                            <div className="d-flex pe-none me-auto">
                                {itemIsPrimaryKey ? <strong>{el.attname}<i className="fas fa-key ms-2" /></strong> : el.attname}
                            </div>
                            <div className="d-flex" style={{flexWrap: "wrap", justifyContent: "flex-end"}}>
                                {
                                    // Print foreign key prompt(s)
                                    itemIsForeignKey ?
                                    fkConstraintNames.map((fkConstraintName, index) => {
                                        if (this.state.showFk) {
                                            return (
                                                <div className="ms-1 text-muted dropdown-tip bg-tip-fk mt-1 mb-1" key={index}>
                                                    fk: <em>{fkConstraintName}</em>
                                                </div>);
                                        } else {
                                            return null;
                                        }
                                    }) :
                                    null
                                }
                                <div className="bg-tip-type text-secondary dropdown-tip mt-1 ms-1 mb-1">
                                    <em>
                                    {el.typname}
                                    </em>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
        );
    }
}
TableCard.contextType = DBSchemaContext;

export class AppSidebar extends React.Component<ComponentTypes.AppSidebarProps, {isLoaded?: boolean}> {
    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false
        }
    }

    componentDidMount() {
        if (this.state.isLoaded) return;
        this.setState({
            isLoaded: true
        })
    }

    printPrimaryKeyPrompt = () => {
        const context: DBSchemaContextInterface = this.context;
        if (context.selectedFirstTableIndex >= 0) {
            const dbSchemaContext: DBSchemaContextInterface = this.context;
            const thisTable = dbSchemaContext.allEntitiesList[context.selectedFirstTableIndex];
            if (!thisTable.pk) {
                return (
                    <div className="me-1 text-muted dropdown-tip bg-tip-grey d-inline-block">
                        <em style={{textDecoration: "line-through"}}>No pk found</em>
                    </div>
                )
            };
            return (
                <div className="me-1 text-muted dropdown-tip bg-tip-pk d-inline-block">
                    pk: <em>{ dbSchemaContext.allEntitiesList[context.selectedFirstTableIndex].pk.keyName}</em>
                </div>)
        } else {
            return null;
        }
    }

    render() {
        /* Bubble 1: database address */
        const databaseAddressHeader = (
        <div className="row">
            <div className="col">
                <i className="fas fa-database me-2" />Database address:
            </div>
        </div>);

        const databaseAddressBody = (
            <div className="row">
                <div className="col overflow-ellipses overflow-hidden">
                    <strong>
                        {this.props.databaseLocation}
                    </strong>
                </div>
            </div>
        );

        const context: DBSchemaContextInterface = this.context;
        let selectedTable: Table = undefined;
        
        if (context.selectedFirstTableIndex >= 0) {
            selectedTable = context.allEntitiesList[context.selectedFirstTableIndex];
        }



        /* Bubble 2: Selected table */
        const selectedTableBubbleHeader = (
            <div className="row">
                <div className="col">
                    <i className="fas fa-table me-2" />Starting table:
                </div>
            </div>);

        const selectedTableBubbleBody = (
            <div>
                <div className="row">
                    <div className="col overflow-ellipses overflow-hidden">
                        <strong>
                            {context.selectedFirstTableIndex >= 0 ? context.allEntitiesList[context.selectedFirstTableIndex].tableName : (<em>None selected</em>)}
                        </strong>
                    </div>
                </div>
                <div className="row">
                    <div className="col overflow-ellipses overflow-hidden">
                    {
                        // Print primary key prompt
                        this.printPrimaryKeyPrompt()
                    }
                    </div>
                </div>
            </div>
        );

        /* Bubble 3: database address */
        const matchedSchemaHeader = (
            <div className="row">
                <div className="col">
                    <i className="fas fa-sitemap me-2" />Edit schema?
                </div>
            </div>);
    
        const matchedSchemaBody = (
            <div className="row">
                <div className="col overflow-ellipses overflow-hidden">
                    <strong>
                        {context.selectedFirstTableIndex >= 0 ? "TODO" : <em>Not available</em>}
                    </strong>
                </div>
            </div>
        );

        /* Bubble 4: Filter dataset */
        const filterDatasetHeader = (
            <div className="row">
                <div className="col">
                    <i className="fas fa-filter me-2" />Filter
                </div>
            </div>);

    
        const filterDatasetBody = (
            <div className="row">
                <div className="col overflow-ellipses overflow-hidden">
                    <strong>
                        {context.selectedFirstTableIndex >= 0 ? context.filters.length + (" filter(s) applied") : <em>Not available</em>}
                    </strong>
                </div>
            </div>
        );
        
        return (
        <div className="col-4 col-lg-3" id="app-sidebar-cont">
            <div className="row">
                <div className="col g-0 p-3">
                    <SidebarBubbleBlock 
                        headerElement={databaseAddressHeader} 
                        bodyElement={databaseAddressBody} 
                        isLoaded={this.state.isLoaded} />
                    <SidebarBubbleBlock 
                        headerElement={selectedTableBubbleHeader} 
                        bodyElement={selectedTableBubbleBody} 
                        isLoaded={this.state.isLoaded}
                        onClick={this.props.onClickShowStartingTableSelectModal} />
                    <SidebarBubbleBlock
                        headerElement={matchedSchemaHeader}
                        bodyElement={matchedSchemaBody}
                        isLoaded={this.state.isLoaded}
                        onClick={undefined} />
                    <SidebarBubbleBlock
                        headerElement={filterDatasetHeader}
                        bodyElement={filterDatasetBody}
                        isLoaded={this.state.isLoaded}
                        onClick={this.props.onClickShowFilterSelectModal} />
                </div>
            </div>
        </div>
        );
    }
}
AppSidebar.contextType = DBSchemaContext;