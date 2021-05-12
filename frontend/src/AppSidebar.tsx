import * as React from 'react';
import { SidebarBubbleBlock } from './UIElements';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { EntitySelector } from './EntitySelector';

import * as ComponentTypes from './ts/components';
import { Table } from './ts/types';

export class StartingTableSelectModal extends React.Component<{onClose: React.MouseEventHandler, onTableSelectChange: Function, selectedTableIndex: number}, {cachedSelectedIndex?: number}> {
    constructor(props) {
        super(props);
        this.state = {
            cachedSelectedIndex: -1
        }
    }

    onTableSelectChange = (e) => {
        let tableIndex = parseInt(e.target.getAttribute("data-index"));

        if (tableIndex < 0) return;

        this.setState({
            cachedSelectedIndex: tableIndex
        });

    }
    
    onTableChangeConfirm = (e) => {
        this.props.onTableSelectChange(this.state.cachedSelectedIndex);
        this.props.onClose(e);
    }
    
    render() {
        return (
            <div className="modal d-block" role="dialog" id="starting-table-select-modal">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Select starting table...</h5>
                        <button type="button" className="close" aria-label="Close" onClick={this.props.onClose}>
                        <span aria-hidden="true"><i className="fas fa-times" /></span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <EntitySelector onTableSelectChange={this.onTableSelectChange} selectedTableIndex={this.props.selectedTableIndex} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" onClick={this.onTableChangeConfirm}>Confirm</button>
                        <button type="button" className="btn btn-secondary" onClick={this.props.onClose}>Cancel</button>
                    </div>
                    </div>
                </div>
            </div>
        );
    }
}
export class TableCard extends React.Component<{selectedTableIndex: number}, {showFk?: boolean}> {
    constructor(props) {
        super(props);
        this.state = {
            showFk: false
        };
    }

    render() {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const selectedTable = dbSchemaContext.allEntitiesList[this.props.selectedTableIndex];
        let pkConstraintName = "";
        
        if (selectedTable === undefined) return null;
        
        if (selectedTable.pk) {
            pkConstraintName = selectedTable.pk.keyName
        }

        return (
        <div className="card" style={{width: "100%"}}>
            {/* <div className="card-header" style={{fontSize: "0.9rem"}}>
                Selected Table
            </div>

            <div className="card-body">
                <h5 className="card-text"><strong>{selectedTable.tableName}</strong></h5>
            </div> */}
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

        const dbSchemaContext: DBSchemaContextInterface = this.context;
        let selectedTable: Table = undefined;
        
        if (this.props.selectedTableIndex >= 0) {
            selectedTable = dbSchemaContext.allEntitiesList[this.props.selectedTableIndex];
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
                            {this.props.selectedTableIndex >= 0 ? dbSchemaContext.allEntitiesList[this.props.selectedTableIndex].tableName : (<em>None selected</em>)}
                        </strong>
                    </div>
                </div>
                <div className="row">
                    <div className="col overflow-ellipses overflow-hidden">
                    {
                        // Print primary key prompt
                        this.props.selectedTableIndex >= 0 ?
                        <div className="me-1 text-muted dropdown-tip bg-tip-pk d-inline-block">pk: <em>{ dbSchemaContext.allEntitiesList[this.props.selectedTableIndex].pk.keyName}</em></div> :
                        null
                    }
                    </div>
                </div>
            </div>
        );
        
        return (
        <div className="col-4 col-lg-3 p-3" id="app-sidebar-cont">
            <SidebarBubbleBlock 
                headerElement={databaseAddressHeader} 
                bodyElement={databaseAddressBody} 
                isLoaded={this.state.isLoaded} />
            <SidebarBubbleBlock 
                headerElement={selectedTableBubbleHeader} 
                bodyElement={selectedTableBubbleBody} 
                isLoaded={this.state.isLoaded}
                onClick={this.props.onClickShowStartingTableSelectModal} />
            {this.props.selectedTableIndex >= 0 ? <TableCard selectedTableIndex={this.props.selectedTableIndex} /> : null}
        </div>
        );
    }
}
AppSidebar.contextType = DBSchemaContext;