import * as React from 'react';
import bootstrap = require('bootstrap');
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { EntitySelector } from './EntitySelector';
import { filterTablesByExistingRelations, getRelationsInListByName } from './SchemaParser';
import { Table, RelationNode } from './ts/types';
import { StartingTableSelectModalProps, StartingTableSelectModalStates } from './ts/components';
import { foreignRelationsElement, renderTips } from './ModalPublicElements';

export class StartingTableSelectModal extends React.Component<StartingTableSelectModalProps, StartingTableSelectModalStates> {
    constructor(props) {
        super(props);
        this.state = {
            cachedDropdownSelectedIndex: -1,
            cachedForeignRelationCardSelectedIndex: -1,
            cachedSelectEntitiesIndices: [],
            cachedSelectedRelationsIndices: [],
            dataSelectByTable: true
        };
    }

    modalComponent: bootstrap.Modal = undefined;

    onBrowserTableSelectChange = (e) => {
        let tableIndex = parseInt(e.target.getAttribute("data-index"));

        if (tableIndex < 0)
            return;

        this.setState({
            cachedDropdownSelectedIndex: tableIndex,
            cachedForeignRelationCardSelectedIndex: -1
            
        });
    };

    onNewTableAddedToSelectedList = () => {
        if (this.state.cachedDropdownSelectedIndex < 0) return;
        if (this.state.cachedSelectEntitiesIndices.includes(this.state.cachedDropdownSelectedIndex)) return;
        let newEntityIndices = this.state.cachedSelectEntitiesIndices;
        newEntityIndices.push(this.state.cachedDropdownSelectedIndex);
        this.setState({
            cachedSelectEntitiesIndices: newEntityIndices
        });
    }

    onNewRelationAddedToSelectedList = () => {
        if (this.state.cachedForeignRelationCardSelectedIndex < 0) return;
        if (this.state.cachedSelectedRelationsIndices.includes(this.state.cachedForeignRelationCardSelectedIndex)) return;
        let newRelationIndices = this.state.cachedSelectedRelationsIndices;
        newRelationIndices.push(this.state.cachedForeignRelationCardSelectedIndex);
        this.setState({
            cachedSelectedRelationsIndices: newRelationIndices
        });
    }

    onClickEntityBrowseButton = (e: React.BaseSyntheticEvent) => {
        const dbContext: DBSchemaContextInterface = this.context;
        const targetId: string = e.target.id;
        const currentCachedSelectedIndex = this.state.cachedDropdownSelectedIndex;
        if (targetId.endsWith("-down")) {
            // cachedIndex++ to the next available from the list
            const availableTables = filterTablesByExistingRelations(
                dbContext.allEntitiesList, dbContext.relationsList, this.state.cachedSelectEntitiesIndices,
                this.state.cachedSelectedRelationsIndices);

            // If availableTables is empty, set to -1?
            if (availableTables === undefined || availableTables.length === 0) {
                this.setState({
                    cachedDropdownSelectedIndex: -1
                });
            }
            // Find the table nearest to the currently selected entity
            let newIndexInAvailableList;
            for (let i = 0; i < availableTables.length; i++) {
                if (availableTables[i].idx === currentCachedSelectedIndex) {
                    newIndexInAvailableList = i + 1;
                    break;
                } else if (availableTables[i].idx > currentCachedSelectedIndex) {
                    newIndexInAvailableList = i;
                    break;
                }
            }

            if (newIndexInAvailableList === undefined || newIndexInAvailableList >= availableTables.length) {
                newIndexInAvailableList = availableTables.length - 1;
            }

            this.setState({
                cachedDropdownSelectedIndex: availableTables[newIndexInAvailableList].idx
            });
        } else if (targetId.endsWith("-up")) {
            // cachedIndex-- to the next available from the list
            const availableTables = filterTablesByExistingRelations(
                dbContext.allEntitiesList, dbContext.relationsList, this.state.cachedSelectEntitiesIndices,
                this.state.cachedSelectedRelationsIndices);

            // If availableTables is empty, set to -1?
            if (availableTables === undefined || availableTables.length === 0) {
                this.setState({
                    cachedDropdownSelectedIndex: -1
                });
            }

            // Find the table nearest to the currently selected entity
            let newIndexInAvailableList;
            for (let i = availableTables.length - 1; i >= 0; i--) {
                if (availableTables[i].idx === currentCachedSelectedIndex) {
                    newIndexInAvailableList = i - 1;
                    break;
                } else if (availableTables[i].idx < currentCachedSelectedIndex) {
                    newIndexInAvailableList = i;
                    break;
                }
            }

            if (newIndexInAvailableList === undefined || newIndexInAvailableList < 0) {
                newIndexInAvailableList = 0;
            }

            this.setState({
                cachedDropdownSelectedIndex: availableTables[newIndexInAvailableList].idx
            });
        } else {
            return;
        }
    };

    onTableChangeConfirm = (e) => {
        this.props.onDatasetSchemaSelectChange(this.state.cachedSelectEntitiesIndices, this.state.cachedSelectedRelationsIndices);
        if (this.modalComponent) {
            this.modalComponent.hide();
        }
        this.props.onClose(e);
    };

    onClickForeignRelationElement = (e: React.BaseSyntheticEvent) => {
        const selectedForeignRelationId = parseInt(e.currentTarget.getAttribute("data-foreign-rel-idx"));
        this.setState({
            cachedForeignRelationCardSelectedIndex: selectedForeignRelationId
        });
    }

    handleOnClose = () => {
        if (this.modalComponent) {
            this.modalComponent.hide();
        }
        this.props.onClose();
    };

    getTableRelationVis = (dbSchemaContext: DBSchemaContextInterface, selectedIndex: number) => {
        let thisTable: Table = undefined;
        let thisRels: RelationNode[] = undefined;
        if (selectedIndex >= 0) {
            thisTable = dbSchemaContext.allEntitiesList[selectedIndex];
            thisRels = getRelationsInListByName(dbSchemaContext.relationsList, thisTable.tableName);
        }

        let foreignKeyParing = null;

        const selectButtonActive = !this.state.cachedSelectedRelationsIndices.includes(this.state.cachedForeignRelationCardSelectedIndex)
            && this.state.cachedForeignRelationCardSelectedIndex >= 0;

        if (thisRels) {
            foreignKeyParing = (
                <div className="card">
                    <div className="card-body d-flex justify-content-between align-items-center">
                        <div className="align-items-end d-inline-flex">
                            <h5 className="card-title m-0">Foreign relations</h5>
                            <span className="badge bg-primary rounded-pill ms-2">{thisRels.length}</span>
                        </div>
                        <button type="button" 
                            className={"btn btn-info" + 
                                (!selectButtonActive ? " disabled" : "")} 
                            onClick={this.onNewRelationAddedToSelectedList}>Select</button>
                    </div>
                    <ul className="list-group start-table-rel-list ml-auto mr-auto">
                        {foreignRelationsElement(thisRels, thisTable, 
                            this.onClickForeignRelationElement, this.state.cachedForeignRelationCardSelectedIndex)}
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
        };

        const thisTableCardHeader = (
            <div className="d-flex align-items-center justify-content-between">
                <div>
                    <h5 className="card-title">{thisTable.tableName}</h5>
                    <h6 className="card-subtitle mb-2 text-muted">n_keys: {thisTable.pk ? thisTable.pk.keyCount : (<em>not available</em>)}</h6>
                </div>
                <div>
                    <button type="button" 
                        className={"btn btn-success" + 
                            (this.state.cachedSelectEntitiesIndices.includes(this.state.cachedDropdownSelectedIndex) ? " disabled" : "")} 
                        onClick={this.onNewTableAddedToSelectedList}>Select</button>
                </div>
            </div>
        )

        return (
            <div className="row justify-content-center">
                <div className="col-4 mt-auto mb-auto">
                    <div className="card">
                        <div className="card-body">
                            {thisTableCardHeader}
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
    };

    onClickIndexPillDelete = (e: React.BaseSyntheticEvent) => {
        const thisCurrentTarget = e.currentTarget;
        const dataIsEntity = thisCurrentTarget.getAttribute("data-is-entity");
        const elemKey = thisCurrentTarget.getAttribute("data-key");

        if (dataIsEntity === "true") {
            let selectEntityIndices = this.state.cachedSelectEntitiesIndices;
            selectEntityIndices.splice(elemKey, 1);
            this.setState({
                cachedSelectEntitiesIndices: selectEntityIndices
            });
        } else {
            let selectRelationsIndices = this.state.cachedSelectedRelationsIndices;
            selectRelationsIndices.splice(elemKey, 1);
            this.setState({
                cachedSelectedRelationsIndices: selectRelationsIndices
            });
        }
    }

    selectedEntitiesPills = () => {
        const context: DBSchemaContextInterface = this.context;
        return (
            <div>
                {this.state.cachedSelectEntitiesIndices.map((ind, key) => {
                    return (
                        <div key={key} className="badge bg-secondary d-inline-flex me-2 no-select">
                            <div>
                                {context.allEntitiesList[ind].tableName}
                            </div>
                            <span aria-hidden="true" className="ms-2 cursor-pointer" data-is-entity={true} 
                                data-elem-ind={ind} data-key={key} onClick={this.onClickIndexPillDelete}><i className="fas fa-times"/></span>
                        </div>
                    );
                })}
            </div>
        )
    }

    selectedRelationsPills = () => {
        const context: DBSchemaContextInterface = this.context;
        return (
            <div>
                {this.state.cachedSelectedRelationsIndices.map((ind, key) => {
                    const thisRel = context.relationsList.find(rel => rel.index === ind);
                    if (!thisRel) return;
                    return (
                        <div key={key} className="badge bg-info d-inline-flex me-2 no-select">
                            <div>
                                {thisRel.parentEntity.tableName} ➔ {thisRel.childRelations.map(cr => cr.table.tableName).join("/")}
                            </div>
                            <span aria-hidden="false" className="ms-2 cursor-pointer" data-is-entity={false} 
                                data-elem-ind={ind} data-key={key} onClick={this.onClickIndexPillDelete}><i className="fas fa-times"/></span>
                        </div>
                    );
                })}
            </div>
        )
    }

    onSelectCriteriaChange = () => {
        const lastSelectCriteria = this.state.dataSelectByTable;
        this.setState({
            dataSelectByTable: !lastSelectCriteria
        });
    }

    focusCheck = () => {
        if (this.state.cachedDropdownSelectedIndex < 0) {
            document.getElementById("starting-table-select-input").focus();
        }
    };

    dataSelectCriteriaRadioButtons = () => {
        return (
            <div className="btn-group" role="group" aria-label="Data selection criteria button group">
                <input type="radio" className="btn-check" name="btnradio" id="data-selection-by-table" autoComplete="off"
                    defaultChecked={this.state.dataSelectByTable} onChange={this.onSelectCriteriaChange} />
                <label className="btn btn-outline-primary" htmlFor="data-selection-by-table">Select by tables</label>

                <input type="radio" className="btn-check" name="btnradio" id="data-selection-by-rels" autoComplete="off"
                    defaultChecked={!this.state.dataSelectByTable} onChange={this.onSelectCriteriaChange} />
                <label className="btn btn-outline-primary" htmlFor="data-selection-by-rels">Select by relations</label>
            </div>
        );
    }

    componentDidMount() {
        const context: DBSchemaContextInterface = this.context;
        const currentlySelectedEntitiesIndices = context.selectedEntitiesIndices,
            currentlySelectedRelationIndices = context.selectedRelationsIndices;

        this.setState({
            cachedSelectEntitiesIndices: JSON.parse(JSON.stringify(currentlySelectedEntitiesIndices)),
            cachedSelectedRelationsIndices: JSON.parse(JSON.stringify(currentlySelectedRelationIndices))
        })

        const modalElement = document.getElementById("starting-table-select-modal");
        this.modalComponent = new bootstrap.Modal(modalElement, {
            keyboard: false
        });
        this.modalComponent.show();

        modalElement.addEventListener('shown.bs.modal', this.focusCheck);
        modalElement.addEventListener('hidden.bs.modal', () => {
            this.props.onClose();
        });
    }

    componentDidUpdate() {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    render() {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const getEntityBrowserButtonActiveState = (isUp: boolean) => {
            const currentCachedSelectedIndex = this.state.cachedDropdownSelectedIndex;
            let baseClassList = "btn btn-outline-secondary btn-entity-browse";
            if (isUp) {
                if (currentCachedSelectedIndex <= 0)
                    baseClassList += " disabled";
            } else {
                // Is down
                // Get the number of entities in the list
                const dbContext: DBSchemaContextInterface = this.context;
                const totalEntitiesCount = dbContext.allEntitiesList.length;
                if (currentCachedSelectedIndex >= totalEntitiesCount)
                    baseClassList += " disabled";
            }

            return baseClassList;
        };

        const isConfirmButtonActive = () => {
            if (this.state.dataSelectByTable) {
                if (this.state.cachedSelectEntitiesIndices.length > 0) {
                    return true;
                }
            } else {
                if (this.state.cachedSelectedRelationsIndices.length > 0) {
                    return true;
                }
            }
            return false;
        }

        return (
            <div className="modal fade d-block" role="dialog" id="starting-table-select-modal" style={{overflowY: "hidden"}}>
                <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: "80%" }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{`Select starting ${this.state.dataSelectByTable ? "table" : "relations"}...`}</h5>
                            <button type="button" className="close" aria-label="Close" onClick={this.handleOnClose}>
                                <span aria-hidden="true"><i className="fas fa-times" /></span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-2">
                                {this.dataSelectCriteriaRadioButtons()}
                            </div>
                            <div className="d-flex ">
                                <EntitySelector 
                                    onTableSelectChange={this.onBrowserTableSelectChange} 
                                    selectedEntityIndex={this.state.cachedDropdownSelectedIndex} 
                                    cachedSelectedEntitiesList={this.state.cachedSelectEntitiesIndices}
                                    cachedSelectedRelationsList={this.state.cachedSelectedRelationsIndices}
                                    id="starting-table-select-input" />
                                <div className="btn-group ms-3 me-2" role="group" aria-label="First group">
                                    <button type="button" className={getEntityBrowserButtonActiveState(true)} id="entity-browse-up"
                                        onClick={this.onClickEntityBrowseButton}>
                                        <i className="fas fa-chevron-up" style={{ pointerEvents: "none" }} />
                                    </button>
                                    <button type="button" className={getEntityBrowserButtonActiveState(false)} id="entity-browse-down"
                                        onClick={this.onClickEntityBrowseButton}>
                                        <i className="fas fa-chevron-down" style={{ pointerEvents: "none" }} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 mb-3">
                                <div className="row justify-content-center">
                                    <div className="col-8 mb-2">
                                        {this.selectedEntitiesPills()}
                                        {this.selectedRelationsPills()}
                                    </div>
                                </div>
                                {this.state.cachedDropdownSelectedIndex >= 0 ?
                                    this.getTableRelationVis(dbSchemaContext, this.state.cachedDropdownSelectedIndex) :
                                    null}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className={"btn btn-primary" + (isConfirmButtonActive() ? "" : " disabled")} onClick={this.onTableChangeConfirm}>Confirm</button>
                            <button type="button" className="btn btn-secondary" onClick={this.handleOnClose}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
StartingTableSelectModal.contextType = DBSchemaContext;