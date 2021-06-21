import * as React from 'react';
import bootstrap = require('bootstrap');

import { DBSchemaContextInterface, DBSchemaContext } from './DBSchemaContext';
import { EntitySelector } from './EntitySelector';
import { getRelationsInListByName } from './SchemaParser';
import { Table, RelationNode, VisSchema, Attribute, VISSCHEMATYPES } from './ts/types';
import * as SchemaParser from './SchemaParser';
import * as TypeConstants from './TypeConstants';
import { StartingTableSelectModalProps, StartingTableSelectModalStates } from './ts/components';


export class StartingTableSelectModal extends React.Component<StartingTableSelectModalProps, StartingTableSelectModalStates> {
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
        let thisRels: RelationNode[] = undefined
        if (this.state.cachedSelectedIndex >= 0) {
            thisTable = dbSchemaContext.allEntitiesList[this.state.cachedSelectedIndex];
            thisRels = getRelationsInListByName(dbSchemaContext.relationsList, thisTable.tableName); // TODO: only using the first matched relation
        }

        const foreignRelationsElement = () => {
            if (thisRels) {
                // Display parent relations first
                let thisRelsSorted = [], thisRelsParent = [], thisRelsChildren = [];
                thisRels.forEach(rel => {
                    if (SchemaParser.isTableAtRootOfRel(thisTable, rel)) {
                        thisRelsParent.push(rel);
                    } else {
                        thisRelsChildren.push(rel);
                    }
                });

                thisRelsSorted = [...thisRelsParent, ...thisRelsChildren];
                return thisRelsSorted.map((rel, idx) => {
                    const thisRelType = rel.type;
                    const isTableAtRoot = SchemaParser.isTableAtRootOfRel(thisTable, rel);

                    let relationTypeTip, relationParentTip, foreignTableList;

                    // Listing related tables
                    const getForeignTableList = (useParentFk: boolean) => {
                        console.log(rel.childRelations)
                        return rel.childRelations.map((childRel, childIdx) => {
                            const childEntity = childRel.table;
                            if (childEntity === thisTable) return null; // TODO: write something else here
                            if (useParentFk) {
                                return (
                                    <div key={childIdx}>
                                        <i className="fas fa-arrow-right me-1" /> 
                                        {childEntity.tableName}
                                        {/* (<i className="fas fa-key ms-1 me-1"/>{rel.parentEntity.fk[childRel.fkIndex].keyName}) */}
                                    </div>);
                            } else {
                                return (
                                    <div key={childIdx}>
                                        <i className="fas fa-arrow-right me-1" /> {childEntity.tableName}
                                        {/* (<i className="fas fa-key ms-1 me-1"/>{childEntity.fk[childRel.fkIndex].keyName}) */}
                                    </div>);
                            }
                        }
                    )};

                    // Tooltip for root status
                    if (isTableAtRoot) {
                        if (thisRelType === VISSCHEMATYPES.MANYMANY) {
                            relationParentTip = (
                                <div className="type-tip tip-parent">Junction table</div>
                            );
                            foreignTableList = getForeignTableList(true);
                        } else if (thisRelType === VISSCHEMATYPES.WEAKENTITY) {
                            relationParentTip = (
                                <div className="type-tip tip-parent">Parent</div>
                            );
                            foreignTableList = getForeignTableList(false);
                        } else if (thisRelType === VISSCHEMATYPES.SUBSET) {
                            relationParentTip = (
                                <div className="type-tip tip-parent">Superset</div>
                            );
                            foreignTableList = getForeignTableList(false);
                        } else if (thisRelType === VISSCHEMATYPES.ONEMANY) {
                            relationParentTip = (
                                <div className="type-tip tip-parent">Parent</div>
                            );
                            foreignTableList = getForeignTableList(false);
                        }
                    } else {
                        if (thisRelType === VISSCHEMATYPES.SUBSET) {
                            relationParentTip = (
                                <div className="type-tip tip-child">Subset (parent: {rel.parentEntity.tableName})</div>
                            );
                            foreignTableList = getForeignTableList(false);
                        } else if (thisRelType === VISSCHEMATYPES.MANYMANY) {
                            relationParentTip = (
                                <div className="type-tip tip-child">Child (parent: {rel.parentEntity.tableName})</div>
                            );
                            foreignTableList = getForeignTableList(true);
                        } else if (thisRelType === VISSCHEMATYPES.WEAKENTITY) {
                            relationParentTip = (
                                <div className="type-tip tip-child">Child (parent: {rel.parentEntity.tableName})</div>
                            );
                            foreignTableList = getForeignTableList(false);
                        }else if (thisRelType === VISSCHEMATYPES.ONEMANY) {
                            relationParentTip = (
                                <div className="type-tip tip-child">Child (parent: {rel.parentEntity.tableName})</div>
                            );
                        }
                    }

                    // Tooltip for relation type
                    switch (thisRelType) {
                        case VISSCHEMATYPES.WEAKENTITY:
                            relationTypeTip = (
                                <div className="type-tip bg-tip-we">
                                    Weak entity
                                </div>
                            );
                            break;
                        case VISSCHEMATYPES.MANYMANY:
                            relationTypeTip = (
                                <div className="type-tip bg-tip-junc">
                                    Many-to-many
                                </div>
                            );
                            break;
                        case VISSCHEMATYPES.SUBSET:
                            relationTypeTip = (
                                <div className="type-tip bg-tip-subset">
                                    Subset
                                </div>
                            );
                            break;
                        case VISSCHEMATYPES.ONEMANY:
                            relationTypeTip = (
                                <div className="type-tip bg-tip-onemany">
                                    One-to-many
                                </div>
                            );
                            break;
                        default:
                            break;
                    }
                    
                    const relationElement = (
                        <li className="list-group-item foreign-relations-group-item" key={idx}>
                            <div className="d-flex justify-content-between">
                                {relationTypeTip}
                                {relationParentTip}
                            </div>
                            {foreignTableList}
                        </li>
                    );

                    return relationElement;

                });
            } else {
                return (
                    <li className="list-group-item">
                        <div>
                            <em>No foreign relations</em>
                        </div>
                    </li>
                )
            }
        }

        let foreignKeyParing = null;

        if (thisRels) {
            foreignKeyParing = (
                <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <h5 className="card-title">Foreign relations</h5>
                            <span className="badge bg-primary rounded-pill">{thisRels.length}</span>
                        </div>
                        <ul className="list-group start-table-rel-list ml-auto mr-auto">
                            {foreignRelationsElement()}
                        </ul>
                    </div>
               );
        }

        const tableAttributeList = () => {
            return thisTable.attr.map(att => {
                return (
                <li className="list-group-item pb-1 d-flex justify-content-between" key={att.attnum}>
                    <div>
                        {att.attname}
                    </div>
                    {renderTips(thisTable, att)}
                </li>
                );
            });
        }
        
        return (
            <div className="row justify-content-md-center mt-4 mb-3">
                <div className="col-4 mt-auto mb-auto">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{thisTable.tableName}</h5>
                            <h6 className="card-subtitle mb-2 text-muted">n_keys: {thisTable.pk ? thisTable.pk.keyCount : (<em>not available</em>)}</h6>
                            <div className="card-text">
                                {/* {manyToManyTip()}
                                {weakEntityTip()} */}
                            </div>
                        </div>
                        <ul className="list-group list-group-flush start-table-rel-list ml-auto mr-auto">
                            {tableAttributeList()}
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
        const context: DBSchemaContextInterface = this.context;
        if (context.selectedFirstTableIndex >= 0 && this.state.cachedSelectedIndex !== context.selectedFirstTableIndex) {
            this.setState({
                cachedSelectedIndex: context.selectedFirstTableIndex
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

    componentDidUpdate() {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
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
                        <EntitySelector onTableSelectChange={this.onTableSelectChange} id="starting-table-select-input" />
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


const renderTips = (table: Table, att: Attribute) => {
    let isAttributeInPrimaryKey, tablePrimaryKeyTip;
    if (table.pk) {
        isAttributeInPrimaryKey = SchemaParser.isAttributeInPrimaryKey(att.attnum, table.pk);
    } else {
        isAttributeInPrimaryKey = false;
    }

    if (isAttributeInPrimaryKey) {
        tablePrimaryKeyTip = (
            <div className="me-1 text-muted dropdown-tip bg-tip-pk d-inline-block">pk</div>
        )
    } else {
        tablePrimaryKeyTip = null;
    }

    if (TypeConstants.isAttributeScalar(att)) {
        return (
            <div className="d-flex">
                {tablePrimaryKeyTip}
                <div data-bs-toggle="tooltip" data-bs-placement="top" title={att.typname}>
                    <i className="fas fa-sort-numeric-down" />
                </div>
            </div>
            )
    } else if (TypeConstants.isAttributeTemporal(att)) {
        return (
            <div className="d-flex">
                {tablePrimaryKeyTip}
                <div data-bs-toggle="tooltip" data-bs-placement="top" title={att.typname}>
                    <i className="fas fa-calendar" />
                </div>
            </div>
            )
    } else {
        return (
            <div className="d-flex">
                {tablePrimaryKeyTip}
                <div data-bs-toggle="tooltip" data-bs-placement="top" title={att.typname}>
                    <i className="fas fa-question" />
                </div>
            </div>)
    }
}

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