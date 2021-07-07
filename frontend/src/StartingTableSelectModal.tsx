import * as React from 'react';
import bootstrap = require('bootstrap');
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { EntitySelector } from './EntitySelector';
import { getRelationsInListByName } from './SchemaParser';
import { Table, RelationNode } from './ts/types';
import { StartingTableSelectModalProps, StartingTableSelectModalStates } from './ts/components';
import { foreignRelationsElement, renderTips } from './ModalPublicElements';




export class StartingTableSelectModal extends React.Component<StartingTableSelectModalProps, StartingTableSelectModalStates> {
    constructor(props) {
        super(props);
        this.state = {
            cachedSelectedIndex: -1,
            selectedForeignKeyIdx: 0
        };
    }

    modalComponent: bootstrap.Modal = undefined;

    onTableSelectChange = (e) => {
        let tableIndex = parseInt(e.target.getAttribute("data-index"));

        if (tableIndex < 0)
            return;

        this.setState({
            cachedSelectedIndex: tableIndex,
            selectedForeignKeyIdx: 0
        });
    };

    onClickEntityBrowseButton = (e: React.BaseSyntheticEvent) => {
        const dbContext: DBSchemaContextInterface = this.context;
        const targetId: string = e.target.id;
        const currentCachedSelectedIndex = this.state.cachedSelectedIndex;
        if (targetId.endsWith("-down")) {
            // cachedIndex++
            this.setState({
                cachedSelectedIndex: currentCachedSelectedIndex + 1
            }, () => {
                const newEntityName = dbContext.allEntitiesList[this.state.cachedSelectedIndex].tableName;
            });
        } else if (targetId.endsWith("-up")) {
            // cachedIndex--
            this.setState({
                cachedSelectedIndex: currentCachedSelectedIndex - 1
            }, () => {
                const newEntityName = dbContext.allEntitiesList[this.state.cachedSelectedIndex].tableName;
                console.log(newEntityName);
            });
        } else {
            return;
        }
    };

    onTableChangeConfirm = (e) => {
        this.props.onTableSelectChange(this.state.cachedSelectedIndex);
        if (this.modalComponent) {
            this.modalComponent.hide();
        }
        this.props.onClose(e);
    };

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

        if (thisRels) {
            foreignKeyParing = (
                <div className="card">
                    <div className="card-body d-flex justify-content-between align-items-center">
                        <h5 className="card-title">Foreign relations</h5>
                        <span className="badge bg-primary rounded-pill">{thisRels.length}</span>
                    </div>
                    <ul className="list-group start-table-rel-list ml-auto mr-auto">
                        {foreignRelationsElement(thisRels, thisTable)}
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

        return (
            <div className="row justify-content-center mt-4 mb-3">
                <div className="col-4 mt-auto mb-auto">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{thisTable.tableName}</h5>
                            <h6 className="card-subtitle mb-2 text-muted">n_keys: {thisTable.pk ? thisTable.pk.keyCount : (<em>not available</em>)}</h6>
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



    focusCheck = () => {
        if (this.state.cachedSelectedIndex < 0) {
            document.getElementById("starting-table-select-input").focus();
        }
    };

    componentDidMount() {
        const context: DBSchemaContextInterface = this.context;
        if (context.selectedFirstTableIndex >= 0 && this.state.cachedSelectedIndex !== context.selectedFirstTableIndex) {
            this.setState({
                cachedSelectedIndex: context.selectedFirstTableIndex
            });
        }
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
            const currentCachedSelectedIndex = this.state.cachedSelectedIndex;
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
        return (
            <div className="modal fade d-block" role="dialog" id="starting-table-select-modal">
                <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: "80%" }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Select starting table...</h5>
                            <button type="button" className="close" aria-label="Close" onClick={this.handleOnClose}>
                                <span aria-hidden="true"><i className="fas fa-times" /></span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="d-flex ">
                                <EntitySelector onTableSelectChange={this.onTableSelectChange} selectedEntityIndex={this.state.cachedSelectedIndex} id="starting-table-select-input" />
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
                            {this.state.cachedSelectedIndex >= 0 ?
                                this.getTableRelationVis(dbSchemaContext, this.state.cachedSelectedIndex) :
                                null}
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