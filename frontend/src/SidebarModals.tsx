import * as React from 'react';
import bootstrap = require('bootstrap');

import { DBSchemaContextInterface, DBSchemaContext } from './DBSchemaContext';
import { EntitySelector } from './EntitySelector';
import { getRelationsInListByName } from './SchemaParser';
import { Table, RelationNode, VisSchema, Attribute, VISSCHEMATYPES } from './ts/types';
import * as SchemaParser from './SchemaParser';
import * as TypeConstants from './TypeConstants';


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
        let thisRels: RelationNode[] = undefined
        if (this.state.cachedSelectedIndex >= 0) {
            thisTable = dbSchemaContext.allEntitiesList[this.state.cachedSelectedIndex];
            thisRels = getRelationsInListByName(dbSchemaContext.relationsList, thisTable.tableName); // TODO: only using the first matched relation
        }

        const foreignRelationsElement = () => {
            if (thisRels) {
                return thisRels.map((rel, idx) => {
                    const thisRelType = rel.type;
                    const isTableAtRoot = SchemaParser.isTableAtRootOfRel(thisTable, rel);

                    let relationTypeTip, relationParentTip, foreignTableList;

                    // Tooltip for root status
                    if (isTableAtRoot) {
                        if (thisRelType === VISSCHEMATYPES.MANYMANY) {
                            relationParentTip = (
                                <div>Junction table</div>
                            );
                        } else if (thisRelType === VISSCHEMATYPES.WEAKENTITY) {
                            relationParentTip = (
                                <div>Parent</div>
                            );
                        }
                    } else {
                        console.log(rel)
                        relationParentTip = (
                            <div>Child (parent: {rel.parentEntity.tableName})</div>
                        )
                    }

                    // Tooltip for relation type
                    switch (thisRelType) {
                        case VISSCHEMATYPES.WEAKENTITY:
                            relationTypeTip = (
                                <div>
                                    Weak entity
                                </div>
                            );
                            break;
                        case VISSCHEMATYPES.MANYMANY:
                            relationTypeTip = (
                                <div>
                                    Many-to-many
                                </div>
                            );
                            break;
                        default:
                            break;
                    }

                    // Listing related tables
                    foreignTableList = rel.childRelations.map((childRel, childIdx) => {
                        const childEntity = childRel.table;
                        if (childEntity === thisTable) return null;
                        return (
                            <div key={childIdx}>
                                <i className="fas fa-arrow-right" /> {childEntity.tableName} ({rel.parentEntity.fk[childRel.fkIndex].keyName})
                            </div>);
                    });
                    
                    const relationElement = (
                        <li className="list-group-item" key={idx}>
                            {relationTypeTip}
                            {relationParentTip}
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

        // const manyToManyTip = () => {
        //     if (!thisRels) return null;
        //     if (thisRels.type === VISSCHEMATYPES.MANYMANY) {
        //         return (
        //         <div className="me-1 text-muted dropdown-tip bg-tip-junc d-flex tip-fontsize" style={{"flexDirection": "column"}}>
        //             <div>
        //                 <i className="fas fa-compress-alt me-1 pe-none" />Junction table between: 
        //             </div>
        //             <div className="d-flex">
        //                 {thisRels.childRelations.map((ce, i) => {
        //                     const ceName = ce.table.tableName;
        //                     if (thisRels.childRelations.length === 1) {
        //                         return <strong key={i}>{ceName}</strong>;
        //                     } else {
        //                         const ceLength = thisRels.childRelations.length;
        //                         if (i === ceLength - 1) {
        //                             return <strong key={i}>{ceName}</strong>;
        //                         } else {
        //                             return <div key={i}><strong>{ceName}</strong>{", "}</div>
        //                         }
        //                     }
        //                     })}
        //             </div>
        //         </div>
        //         )
        //     }
        // }

        // const weakEntityTip = () => {
        //     if (!thisRels) return null;
        //     if (thisRels.type === VISSCHEMATYPES.WEAKENTITY) {
        //         return (
        //         <div className="me-1 text-muted dropdown-tip bg-tip-weak-link d-flex tip-fontsize" style={{"flexDirection": "column"}}>
        //             <div>
        //                 <i className="fas fa-asterisk me-1 pe-none" />Weak entity of: 
        //             </div>
        //             <div className="d-flex">
        //                 {thisRels.childRelations.map((ce, i) => {
        //                     const ceName = ce.table.tableName;
        //                     if (thisRels.childRelations.length === 1) {
        //                         return <strong key={i}>{ceName}</strong>;
        //                     } else {
        //                         const ceLength = thisRels.childRelations.length;
        //                         if (i === ceLength - 1) {
        //                             return <strong key={i}>{ceName}</strong>;
        //                         } else {
        //                             return <div key={i}><strong>{ceName}</strong>{", "}</div>
        //                         }
        //                     }
        //                 })}
        //             </div>
        //         </div>
        //         )
        //     } else {
        //         return null;
        //     }
        // }

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