import * as React from 'react';
import bootstrap = require('bootstrap');

import { DBSchemaContextInterface, DBSchemaContext } from './DBSchemaContext';
import { EntitySelector } from './EntitySelector';
import { getRelationInListByName } from './SchemaParser';
import { Table, RelationNode, VisSchema } from './ts/types';
import * as SchemaParser from './SchemaParser';
import { matchTableWithRel } from './VisSchemaMatcher';

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
                        {thisRels.childEntities.map((rel, i) => {
                            return (
                                <li className="list-group-item" key={i}>
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
                                <li className="list-group-item pb-1" key={att.attnum}>{att.attname}</li>    
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

export class MatchedSchemasModal extends React.Component<{onClose: Function, selectedTableIndex: number, visSchema: VisSchema[]}, {}> {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    modalComponent: bootstrap.Modal = undefined;

    onTableChangeConfirm = (e) => {
        this.props.onClose(e);
    }

    handleOnClose = () => {
        if (this.modalComponent) {
            this.modalComponent.hide();
        }
        this.props.onClose();
    }

    getAllMatchableVisSchema = () => {
        let dbSchemaContext: DBSchemaContextInterface = this.context;
        let selectedEntity = dbSchemaContext.allEntitiesList[this.props.selectedTableIndex];
        let entityRel = SchemaParser.getRelationInListByName(dbSchemaContext.relationsList, selectedEntity.tableName);
        
        this.props.visSchema.forEach(vs => {
            const matchResult = matchTableWithRel(selectedEntity, entityRel, vs);
            if (matchResult) console.log(matchResult);
        })
    }

    componentDidMount() {
        const modalElement = document.getElementById("starting-table-select-modal")
        this.modalComponent = new bootstrap.Modal(modalElement, {
            keyboard: false
        });
        // this.getAllMatchableVisSchema();
        this.modalComponent.show();

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
                        TODO TODO TODO
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

MatchedSchemasModal.contextType = DBSchemaContext;