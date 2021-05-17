import * as React from 'react';
import * as bootstrap from 'bootstrap';
import { SidebarBubbleBlock } from './UIElements';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { EntitySelector } from './EntitySelector';
import { Table, RelationNode } from './ts/types';

import * as ComponentTypes from './ts/components';
import { getRelationInListByName } from './SchemaParser';

export class StartingTableSelectModal extends React.Component<{onClose: Function, onTableSelectChange: Function, selectedTableIndex: number}, {cachedSelectedIndex?: number, selectedForeignKeyIdx?: number}> {
    constructor(props) {
        super(props);
        this.state = {
            cachedSelectedIndex: -1,
            selectedForeignKeyIdx: 0
        }
    }

    modalComponent: bootstrap.Modal = undefined;

    onTableSelectChange = (e) => {
        let tableIndex = parseInt(e.target.getAttribute("data-index"));

        if (tableIndex < 0) return;

        this.setState({
            cachedSelectedIndex: tableIndex,
            selectedForeignKeyIdx: 0
        });

    }
    
    onTableChangeConfirm = (e) => {
        this.props.onTableSelectChange(this.state.cachedSelectedIndex);
        if (this.modalComponent) {
            this.modalComponent.hide();
        }
        this.props.onClose(e);
    }

    handleOnClose = () => {
        if (this.modalComponent) {
            this.modalComponent.hide();
        }
        this.props.onClose();
    }

    getTableRelationVis = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        let thisTable: Table = undefined;
        let thisRels: RelationNode = undefined
        if (this.state.cachedSelectedIndex >= 0) {
            thisTable = dbSchemaContext.allEntitiesList[this.state.cachedSelectedIndex];
            thisRels = getRelationInListByName(dbSchemaContext.relationsList, thisTable.tableName);
        }

        let foreignKeyParing;
        if (thisRels && thisRels.childEntities.length !== 0){
            let chosenIndex = this.state.selectedForeignKeyIdx;
            if (this.state.selectedForeignKeyIdx > thisRels.childEntities.length) {
                chosenIndex = 0;
            }
            const fkRel = thisRels.childEntities[chosenIndex]
            foreignKeyParing = (
            <div className="card">
                    <div className="card-body d-flex justify-content-between align-items-center">
                        <h5 className="card-title">Related tables</h5>
                        <span className="badge bg-primary rounded-pill">{thisRels.childEntities.length}</span>
                    </div>
                    <ul className="list-group start-table-rel-list ml-auto mr-auto">
                        {thisRels.childEntities.map(rel => {
                            console.log(rel);
                            return (
                                <li className="list-group-item">
                                    <div>
                                        {rel.parentEntity.tableName}
                                    </div>
                                    <div>
                                        {rel.type}
                                    </div>
                            </li>   
                            )
                        })}
                    </ul>
                </div>
           );
        } else {
            foreignKeyParing = null
        }
        
        return (
            <div className="row justify-content-md-center mt-4 mb-3">
                <div className="col-4 mt-auto mb-auto">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{thisTable.tableName}</h5>
                            <h6 className="card-subtitle mb-2 text-muted">n_keys: {thisTable.pk ? thisTable.pk.keyCount : (<em>not available</em>)}</h6>
                        </div>
                        <ul className="list-group list-group-flush start-table-rel-list ml-auto mr-auto">
                            {thisTable.attr.map(att => (
                                <li className="list-group-item pb-1">{att.attname}</li>    
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="col-4 mt-auto mb-auto">
                    {foreignKeyParing}
                </div>
                <div className="col-auto">
                </div>
            </div>
        );
    }

    focusCheck = () => {
        if (this.state.cachedSelectedIndex < 0) {
            document.getElementById("starting-table-select-input").focus()
        }
    }

    componentDidMount() {
        if (this.props.selectedTableIndex >= 0 && this.state.cachedSelectedIndex !== this.props.selectedTableIndex) {
            this.setState({
                cachedSelectedIndex: this.props.selectedTableIndex
            });
        }
        const modalElement = document.getElementById("starting-table-select-modal")
        this.modalComponent = new bootstrap.Modal(modalElement, {
            keyboard: false
        });
        this.modalComponent.show();

        modalElement.addEventListener('shown.bs.modal', this.focusCheck);
        modalElement.addEventListener('hidden.bs.modal', () => {
            this.props.onClose();
        })
    }
    
    render() {
        return (
            <div className="modal fade d-block" role="dialog" id="starting-table-select-modal">
                <div className="modal-dialog modal-dialog-centered" role="document" style={{maxWidth: "80%"}}>
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Select starting table...</h5>
                        <button type="button" className="close" aria-label="Close" onClick={this.handleOnClose}>
                        <span aria-hidden="true"><i className="fas fa-times" /></span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <EntitySelector onTableSelectChange={this.onTableSelectChange} selectedTableIndex={this.props.selectedTableIndex} id="starting-table-select-input" />
                        {
                            this.state.cachedSelectedIndex >= 0 ?
                            this.getTableRelationVis() :
                            null
                        }
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" onClick={this.onTableChangeConfirm}>Confirm</button>
                        <button type="button" className="btn btn-secondary" onClick={this.handleOnClose}>Cancel</button>
                    </div>
                    </div>
                </div>
            </div>
        );
    }
}
StartingTableSelectModal.contextType = DBSchemaContext;

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
        if (this.props.selectedTableIndex >= 0) {
            const dbSchemaContext: DBSchemaContextInterface = this.context;
            const thisTable = dbSchemaContext.allEntitiesList[this.props.selectedTableIndex];
            if (!thisTable.pk) {
                return (
                    <div className="me-1 text-muted dropdown-tip bg-tip-grey d-inline-block">
                        <em style={{textDecoration: "line-through"}}>No pk found</em>
                    </div>
                )
            };
            return (
                <div className="me-1 text-muted dropdown-tip bg-tip-pk d-inline-block">
                    pk: <em>{ dbSchemaContext.allEntitiesList[this.props.selectedTableIndex].pk.keyName}</em>
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
                        this.printPrimaryKeyPrompt()
                    }
                    </div>
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
                    {this.props.selectedTableIndex >= 0 ? <TableCard selectedTableIndex={this.props.selectedTableIndex} /> : null}
                </div>
            </div>
        </div>
        );
    }
}
AppSidebar.contextType = DBSchemaContext;