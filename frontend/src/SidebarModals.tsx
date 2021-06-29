import * as React from 'react';
import bootstrap = require('bootstrap');

import { DBSchemaContextInterface, DBSchemaContext } from './DBSchemaContext';
import { EntitySelector } from './EntitySelector';
import { getRelationsInListByName } from './SchemaParser';
import { Table, RelationNode, VisSchema, Attribute, VISSCHEMATYPES, Filter, FilterCondition } from './ts/types';
import * as SchemaParser from './SchemaParser';
import * as TypeConstants from './TypeConstants';
import { FilterSelectModalProps, FilterSelectModalStates, StartingTableSelectModalProps, StartingTableSelectModalStates } from './ts/components';
import { getFilteredData } from './Connections';
// import { getFilteredTable } from './Connections';

const foreignRelationsElement = (thisRels: RelationNode[], thisTable: Table) => {
    if (thisRels) {
        // Display parent relations first
        let thisRelsSorted: RelationNode[] = [], 
            thisRelsParent: RelationNode[] = [], 
            thisRelsChildren: RelationNode[] = [];
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
                <li className="list-group-item foreign-relations-group-item" key={idx} data-foreign-rel-idx={rel.index}>
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

    onClickEntityBrowseButton = (e:React.BaseSyntheticEvent) => {
        const dbContext: DBSchemaContextInterface = this.context;
        const targetId: string = e.target.id;
        const currentCachedSelectedIndex = this.state.cachedSelectedIndex;
        if (targetId.endsWith("-down")) {
            // cachedIndex++
            this.setState({
                cachedSelectedIndex: currentCachedSelectedIndex + 1
            }, () => {
                const newEntityName = dbContext.allEntitiesList[this.state.cachedSelectedIndex].tableName;
            })
        } else if (targetId.endsWith("-up")) {
            // cachedIndex--
            this.setState({
                cachedSelectedIndex: currentCachedSelectedIndex - 1
            }, () => {
                const newEntityName = dbContext.allEntitiesList[this.state.cachedSelectedIndex].tableName;
                console.log(newEntityName);
            })
        } else {
            return;
        }
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

    getTableRelationVis = (dbSchemaContext: DBSchemaContextInterface, selectedIndex: number) => {
        let thisTable: Table = undefined;
        let thisRels: RelationNode[] = undefined
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
        }
        
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
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const getEntityBrowserButtonActiveState = (isUp: boolean) => {
            const currentCachedSelectedIndex = this.state.cachedSelectedIndex;
            let baseClassList = "btn btn-outline-secondary btn-entity-browse";
            if (isUp) {
                if (currentCachedSelectedIndex <= 0) baseClassList += " disabled";
            } else {
                // Is down
                // Get the number of entities in the list
                const dbContext:DBSchemaContextInterface = this.context;
                const totalEntitiesCount = dbContext.allEntitiesList.length;
                if (currentCachedSelectedIndex >= totalEntitiesCount) baseClassList += " disabled";
            }

            return baseClassList;
        }
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
                        <div className="d-flex ">
                        <EntitySelector onTableSelectChange={this.onTableSelectChange} selectedEntityIndex={this.state.cachedSelectedIndex} id="starting-table-select-input" />
                        <div className="btn-group ms-3 me-2" role="group" aria-label="First group">
                            <button type="button" className={getEntityBrowserButtonActiveState(true)} id="entity-browse-up"
                                onClick={this.onClickEntityBrowseButton}>
                                <i className="fas fa-chevron-up" style={{pointerEvents: "none"}} />
                            </button>
                            <button type="button" className={getEntityBrowserButtonActiveState(false)} id="entity-browse-down"
                                onClick={this.onClickEntityBrowseButton}>
                                <i className="fas fa-chevron-down" style={{pointerEvents: "none"}} />
                            </button>
                        </div>
                        </div>
                        {
                            this.state.cachedSelectedIndex >= 0 ?
                            this.getTableRelationVis(dbSchemaContext, this.state.cachedSelectedIndex) :
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

export class FilterSelectModal extends React.Component<FilterSelectModalProps, FilterSelectModalStates> {
    cachedFilterValueRef: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);
        this.state = {
            cachedFilterSelection: undefined,
            filters: [],
            cachedForeignTableSelected: -1
        }

        this.cachedFilterValueRef = React.createRef();
    }

    modalComponent: bootstrap.Modal = undefined;
    
    onFilterSelectionConfirm = (e) => {
        // this.props.onTableSelectChange(this.state.cachedSelectedIndex);
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

    onTableAttributeClick = (e: React.BaseSyntheticEvent) => {
        const currentTarget = e.currentTarget;
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const 
            tableIdx = parseInt(currentTarget.getAttribute("data-table-idx")),
            attNum = parseInt(currentTarget.getAttribute("data-attnum"));
            
        let fkIndex: number, fkTableSelected: Table;
        if (tableIdx === dbSchemaContext.selectedFirstTableIndex) {
            // Selected attribute is in the "base" table
            const foreignKeyAttElement = currentTarget.getElementsByClassName("att-to-fk");
            if (foreignKeyAttElement && foreignKeyAttElement.length > 0) {
                fkIndex = parseInt(foreignKeyAttElement[0].getAttribute("data-fk-id"));
                if (fkIndex !== undefined) {
                    const fk = dbSchemaContext.allEntitiesList[dbSchemaContext.selectedFirstTableIndex].fk[fkIndex];
                    fkTableSelected = dbSchemaContext.allEntitiesList.find(table => table.tableName === fk.pkTableName)
                    console.log(dbSchemaContext.allEntitiesList[dbSchemaContext.selectedFirstTableIndex].fk);
                }
            }
            this.setState({
                cachedFilterSelection: 
                    fkTableSelected ? 
                    undefined : {
                        tableIndex: tableIdx,
                        attNum: attNum,
                        fkIndex: fkIndex,
                        condition: undefined,
                        value: undefined
                    },
                cachedForeignTableFKIndex: fkTableSelected ? fkIndex : -1,
                cachedForeignTableSelected: fkTableSelected ? fkTableSelected.idx : -1
            })
        } else {
            // Selected attribute is in the "foreign" table
            this.setState({
                cachedFilterSelection: {
                    tableIndex: tableIdx,
                    attNum: attNum,
                    condition: undefined,
                    value: undefined
                },
            })
        }
       
    }

    changedCondition = (cond: FilterCondition) => {
        const cachedFilter = this.state.cachedFilterSelection
        cachedFilter.condition = cond;
        this.setState({
            cachedFilterSelection: cachedFilter
        })
    }

    onConfirmCachedFilter = (e: React.BaseSyntheticEvent) => {
        const filterInputValue = this.cachedFilterValueRef.current as HTMLInputElement
        const cachedFilter = this.state.cachedFilterSelection;
        cachedFilter.value = filterInputValue.value;
        if (Object.keys(cachedFilter).every(key => {
            const val = cachedFilter[key];
            return val !== "";
        })) {
            this.setState({
                cachedFilterSelection: cachedFilter,
                filters: [...this.state.filters, cachedFilter]
            }, () => {
                // Retrieve data (TODO: simplify this)
                const dbSchemaContext: DBSchemaContextInterface = this.context;
                const thisTable = dbSchemaContext.allEntitiesList[dbSchemaContext.selectedFirstTableIndex];
                getFilteredData(thisTable, dbSchemaContext.allEntitiesList, this.state.filters)
            });
        }
    }

    getTableRelationVis = (dbSchemaContext: DBSchemaContextInterface, selectedIndex: number) => {
        let thisTable: Table = undefined;
        if (selectedIndex >= 0) {
            thisTable = dbSchemaContext.allEntitiesList[selectedIndex];
        }
    
        const tableAttributeList = (table: Table) => {
            return table.attr.map(att => {
                return (
                <li className="list-group-item pb-1 d-flex justify-content-between" onClick={this.onTableAttributeClick} 
                    data-table-idx={table.idx} data-attnum={att.attnum} key={att.attnum}>
                    <div>
                        {att.attname}
                    </div>
                    {renderTips(table, att, true)}
                </li>
                );
            });
        }


        let foreignKeyAttList = null;
        if (this.state.cachedForeignTableSelected) {
            const selectedFk = thisTable.fk[this.state.cachedForeignTableFKIndex];
            const selectedFkTable = dbSchemaContext.allEntitiesList[this.state.cachedForeignTableSelected];
            
            if (selectedFkTable) {
                foreignKeyAttList = (
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">➔ {selectedFkTable.tableName}</h5>
                            <div className="small d-inline-block me-1 text-muted dropdown-tip bg-tip-fk" >fk: <em>{selectedFk.keyName}</em></div>
                        </div>
                        <ul className="list-group filter-table-attr-group-item filter-table-rel-list ml-auto mr-auto">
                            {tableAttributeList(selectedFkTable)}
                        </ul>
                    </div>
                );
            }
        }

        const filterRelatedAttButton = (filter: Filter) => {   
            const dbSchemaContext: DBSchemaContextInterface = this.context;
            const filterRelatedTable = dbSchemaContext.allEntitiesList[filter.tableIndex];
            const filterRelatedAttName = filterRelatedTable.attr[filter.attNum - 1].attname
            return (
                <a href="#" className="btn btn-secondary btn me-2" role="button" aria-disabled="true">
                    {filterRelatedTable.tableName}/{filterRelatedAttName}
                </a>
                )
            }

        

        const scalarConditions: FilterCondition[] = [
            {
                friendlyName: "is equal to",
                sqlCommand: "="
            }, {
                friendlyName: "is not equal to",
                sqlCommand: "!="
            }, {
                friendlyName: "is greater than",
                sqlCommand: ">"
            }, {
                friendlyName: "is less than",
                sqlCommand: "<"
            }, {
                friendlyName: "is greater than or equal to",
                sqlCommand: ">="
            }
            
        ]

        let conditionDropdown;

        const thisConditionHandler = (e: React.BaseSyntheticEvent) => {
            const conditionIndexSelected = parseInt(e.target.getAttribute("data-cond-idx"));
            if (conditionIndexSelected > -1) {
                this.changedCondition(scalarConditions[conditionIndexSelected])
            }
        }
        if (this.state.cachedFilterSelection) {
            const conditionCached = this.state.cachedFilterSelection.condition
            conditionDropdown = (
                <div className="btn-group me-2">
                    <button type="button" className="btn btn-secondary">{conditionCached !== undefined ? conditionCached.friendlyName : "Select..."}</button>
                    <button type="button" className="btn btn-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                        <span className="visually-hidden">Toggle Dropdown</span>
                    </button>
                    <ul className="dropdown-menu">
                        {scalarConditions.map((cond, idx) => {
                            return (<li key={idx} data-cond-idx={idx}><a className="dropdown-item" href="#" data-cond-idx={idx} onClick={thisConditionHandler}>{cond.friendlyName}</a></li>)
                        })}
                    </ul>
                </div>
            )
        }

        const equality = (
            <div className="me-2">
                is
            </div>
        )

        const valueInput = (
            <div className="input-group" style={{maxWidth: "20%"}}>
                <input ref={this.cachedFilterValueRef} type="number" className="form-control input-number-no-scroll" placeholder="Value" aria-label="Value"/>
            </div>
        )

        const cachedFilterSubmitButton = (
            <button type="button" className="btn btn-success" onClick={this.onConfirmCachedFilter}>Confirm</button>
        )

        const cachedFilterText = () => {
            const filter = this.state.cachedFilterSelection;
            if (!filter) return null;
            return (
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        {filterRelatedAttButton(filter)} {equality} {conditionDropdown} {valueInput}
                    </div>
                    <div>
                        {cachedFilterSubmitButton}
                    </div>
                </div>
            )
        }

        const savedFilters = () => {
            const filters = this.state.filters;
            if (!filters || filters.length === 0) {
                return null;
            }
            
            return JSON.stringify(filters);
        }
        
        return (
            <div className="row justify-content-center mt-4 mb-3">
                <div className="col-5 mt-auto mb-auto">
                    <div className="card mb-2">
                        <div className="card-body">
                            <h5 className="card-title">{thisTable.tableName}</h5>
                            <h6 className="card-subtitle mb-3 text-muted">n_keys: {thisTable.pk ? thisTable.pk.keyCount : (<em>not available</em>)}</h6>
                        </div>
                        <ul className="list-group filter-table-attr-group-item list-group-flush start-table-rel-list ml-auto mr-auto">
                            {tableAttributeList(thisTable)}
                        </ul>
                    </div>
                    {foreignKeyAttList}
                </div>
                <div className="col-5 mt-auto mb-auto">
                    {cachedFilterText()}
                    {savedFilters()}
                </div>
                {/* <div className="col-auto">
                </div> */}
            </div>
        );
    }

    componentDidMount() {
        const context: DBSchemaContextInterface = this.context;
        // if (context.selectedFirstTableIndex >= 0 && this.state.cachedSelectedIndex !== context.selectedFirstTableIndex) {
        //     this.setState({
        //         cachedSelectedIndex: context.selectedFirstTableIndex
        //     });
        // }
        const modalElement = document.getElementById("starting-table-select-modal")
        this.modalComponent = new bootstrap.Modal(modalElement, {
            keyboard: false
        });
        this.modalComponent.show();

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
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const getEntityBrowserButtonActiveState = (isUp: boolean) => {
            const currentCachedSelectedIndex = dbSchemaContext.selectedFirstTableIndex;
            let baseClassList = "btn btn-outline-secondary btn-entity-browse";
            if (isUp) {
                if (currentCachedSelectedIndex <= 0) baseClassList += " disabled";
            } else {
                // Is down
                // Get the number of entities in the list
                const dbContext:DBSchemaContextInterface = this.context;
                const totalEntitiesCount = dbContext.allEntitiesList.length;
                if (currentCachedSelectedIndex >= totalEntitiesCount) baseClassList += " disabled";
            }

            return baseClassList;
        }
        return (
            <div className="modal fade d-block" role="dialog" id="starting-table-select-modal">
                <div className="modal-dialog modal-dialog-centered" role="document" style={{maxWidth: "80%"}}>
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Select filtering...</h5>
                        <button type="button" className="close" aria-label="Close" onClick={this.handleOnClose}>
                        <span aria-hidden="true"><i className="fas fa-times" /></span>
                        </button>
                    </div>
                    <div className="modal-body">
                        {
                            dbSchemaContext.selectedFirstTableIndex >= 0 ?
                            this.getTableRelationVis(dbSchemaContext, dbSchemaContext.selectedFirstTableIndex) :
                            null
                        }
                    </div>
                    <div className="modal-footer">
                        <button type="button" className={"btn btn-primary" + (this.state.filters.length === 0 ? " disabled" : "")} onClick={this.onFilterSelectionConfirm}>Confirm</button>
                        <button type="button" className="btn btn-secondary" onClick={this.handleOnClose}>Cancel</button>
                    </div>
                    </div>
                </div>
            </div>
        );
    }
}
FilterSelectModal.contextType = DBSchemaContext;


const renderTips = (table: Table, att: Attribute, showForeignKey?: boolean) => {
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

    let fkTip = null;
    if (showForeignKey) {
        const thisAttFKIndex = table.fk.findIndex(fk => fk.columns.some(col => col.fkColPos === att.attnum))
        if (thisAttFKIndex > -1) {
            // This column is of a foreign key
            const pkTableName = table.fk[thisAttFKIndex].pkTableName
            fkTip = <div className="dropdown-tip bg-tip-fk att-to-fk" data-fk-id={thisAttFKIndex}> ➔ {pkTableName}</div>
        }
    }

    if (TypeConstants.isAttributeScalar(att)) {
        return (
            <div className="d-flex">
                {tablePrimaryKeyTip}
                {fkTip}
                <div data-bs-toggle="tooltip" data-bs-placement="top" title={att.typname}>
                    <i className="fas fa-sort-numeric-down" />
                </div>
            </div>
            )
    } else if (TypeConstants.isAttributeTemporal(att)) {
        return (
            <div className="d-flex">
                {tablePrimaryKeyTip}
                {fkTip}
                <div data-bs-toggle="tooltip" data-bs-placement="top" title={att.typname}>
                    <i className="fas fa-calendar" />
                </div>
            </div>
            )
    } else {
        return (
            <div className="d-flex">
                {tablePrimaryKeyTip}
                {fkTip}
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