import * as React from 'react';
import bootstrap = require('bootstrap');
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { Table, Filter, FilterCondition, Attribute, PatternMatchAttribute } from './ts/types';
import { FilterSelectModalProps, FilterSelectModalStates } from './ts/components';
import { getFilteredData } from './Connections';
import { renderTips } from './ModalPublicElements';
import { isAttributeScalar } from './TypeConstants';


export class FilterSelectModal extends React.Component<FilterSelectModalProps, FilterSelectModalStates> {
    cachedFilterValueRef: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);
        this.state = {
            cachedFilterSelection: undefined,
            filters: [],
            cachedForeignTableSelected: -1,
            filterType: 0
        };

        this.cachedFilterValueRef = React.createRef();
    }

    modalComponent: bootstrap.Modal = undefined;

    onFilterSelectionConfirm = (e) => {
        // this.props.onTableSelectChange(this.state.cachedSelectedIndex);
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
                    fkTableSelected = dbSchemaContext.allEntitiesList.find(table => table.tableName === fk.pkTableName);
                    console.log(dbSchemaContext.allEntitiesList[dbSchemaContext.selectedFirstTableIndex].fk);
                }
            }
            this.setState({
                cachedFilterSelection: fkTableSelected ?
                    undefined : {
                        tableIndex: tableIdx,
                        attNum: attNum,
                        condition: undefined,
                        value: undefined
                    },
                cachedForeignTableFKIndex: fkTableSelected ? fkIndex : -1,
                cachedForeignTableSelected: fkTableSelected ? fkTableSelected.idx : -1
            });
        } else {
            // Selected attribute is in the "foreign" table
            const tableWithFk = dbSchemaContext.allEntitiesList[dbSchemaContext.selectedFirstTableIndex]; // TODO: other cases
            const fk = tableWithFk.fk[this.state.cachedForeignTableFKIndex];
            this.setState({
                cachedFilterSelection: {
                    tableIndex: tableIdx,
                    attNum: attNum,
                    fk: fk,
                    condition: undefined,
                    value: undefined
                },
            });
        }

    };

    changedCondition = (cond: FilterCondition) => {
        const cachedFilter = this.state.cachedFilterSelection;
        cachedFilter.condition = cond;
        this.setState({
            cachedFilterSelection: cachedFilter
        });
    };

    onConfirmCachedFilter = (e: React.BaseSyntheticEvent) => {
        const filterInputValue = this.cachedFilterValueRef.current as HTMLInputElement;
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
                getFilteredData(thisTable, dbSchemaContext.allEntitiesList, this.state.filters);
            });
        }
    };
    
    getAttributeListFromTable = (table: Table) => {
        return this.getAttributeListInSingleTable(table.attr, table);
    };

    getAttributeListInSingleTable = (attrs: Attribute[], table?: Table) => {
        return attrs.map(att => {
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

    getAttributeListFromPatternMatchResults = (attrs: PatternMatchAttribute[][]) => {
        const allAttrs = attrs.flat(1);
        return allAttrs.map((attr, key) => {
            if (!attr) return;
            const tableObject = attr.table;
            const attrObject = tableObject.attr[attr.attributeIndex];
            return (
                <li className="list-group-item pb-1 d-flex justify-content-between"
                    data-table-idx={tableObject.idx} data-attnum={attrObject.attnum} key={key} onClick={this.onTableAttributeClick}>
                    <div>
                        {tableObject.tableName}/{attrObject.attname}
                    </div>
                    {renderTips(tableObject, attrObject, true)}
                </li>)
        })
    }

    getTableRelationVis = (dbSchemaContext: DBSchemaContextInterface, selectedIndex: number) => {
        let thisTable: Table = undefined;
        if (selectedIndex >= 0) {
            thisTable = dbSchemaContext.allEntitiesList[selectedIndex];
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
                            <div className="small d-inline-block me-1 text-muted dropdown-tip bg-tip-fk">fk: <em>{selectedFk.keyName}</em></div>
                        </div>
                        <ul className="list-group filter-table-attr-group-item filter-table-rel-list ml-auto mr-auto">
                            {this.getAttributeListFromTable(selectedFkTable)}
                        </ul>
                    </div>
                );
            }
        }

        const filterRelatedAttButton = (filter: Filter) => {
            const dbSchemaContext: DBSchemaContextInterface = this.context;
            const filterRelatedTable = dbSchemaContext.allEntitiesList[filter.tableIndex];
            const filterRelatedAttName = filterRelatedTable.attr[filter.attNum - 1].attname;
            return (
                <a href="#" className="btn btn-secondary btn me-2" role="button" aria-disabled="true">
                    {filterRelatedTable.tableName}/{filterRelatedAttName}
                </a>
            );
        };



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
        ];

        let conditionDropdown;

        const thisConditionHandler = (e: React.BaseSyntheticEvent) => {
            const conditionIndexSelected = parseInt(e.target.getAttribute("data-cond-idx"));
            if (conditionIndexSelected > -1) {
                this.changedCondition(scalarConditions[conditionIndexSelected]);
            }
        };
        if (this.state.cachedFilterSelection) {
            const conditionCached = this.state.cachedFilterSelection.condition;
            conditionDropdown = (
                <div className="btn-group me-2">
                    <button type="button" className="btn btn-secondary">{conditionCached !== undefined ? conditionCached.friendlyName : "Select..."}</button>
                    <button type="button" className="btn btn-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                        <span className="visually-hidden">Toggle Dropdown</span>
                    </button>
                    <ul className="dropdown-menu">
                        {scalarConditions.map((cond, idx) => {
                            return (<li key={idx} data-cond-idx={idx}><a className="dropdown-item" href="#" data-cond-idx={idx} onClick={thisConditionHandler}>{cond.friendlyName}</a></li>);
                        })}
                    </ul>
                </div>
            );
        }

        const equality = (
            <div className="me-2">
                is
            </div>
        );

        const valueInput = (
            <div className="input-group" style={{ maxWidth: "20%" }}>
                <input ref={this.cachedFilterValueRef} type="number" className="form-control input-number-no-scroll" placeholder="Value" aria-label="Value" />
            </div>
        );

        const cachedFilterSubmitButton = (
            <button type="button" className="btn btn-success" onClick={this.onConfirmCachedFilter}>Confirm</button>
        );

        const cachedFilterText = () => {
            const filter = this.state.cachedFilterSelection;
            if (!filter)
                return null;
            return (
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        {filterRelatedAttButton(filter)} {equality} {conditionDropdown} {valueInput}
                    </div>
                    <div>
                        {cachedFilterSubmitButton}
                    </div>
                </div>
            );
        };

        const savedFilters = () => {
            const filters = this.state.filters;
            if (!filters || filters.length === 0) {
                return null;
            }

            return JSON.stringify(filters);
        };

        return (
            <div className="row justify-content-center mt-4 mb-3">
                <div className="col-5 mt-auto mb-auto">
                    <div className="card mb-2">
                        <div className="card-body">
                            <h5 className="card-title">{thisTable.tableName}</h5>
                            <h6 className="card-subtitle mb-3 text-muted">n_keys: {thisTable.pk ? thisTable.pk.keyCount : (<em>not available</em>)}</h6>
                        </div>
                        <ul className="list-group filter-table-attr-group-item list-group-flush start-table-rel-list ml-auto mr-auto">
                            {this.getAttributeListFromTable(thisTable)}
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
    };

    onFilterTypeChange = (e: React.BaseSyntheticEvent) => {
        const newFilterType = parseInt(e.currentTarget.getAttribute("data-filter-type"));
        this.setState({
            filterType: newFilterType,
            cachedFilterSelection: undefined,
            cachedForeignTableFKIndex: -1,
            filters: [],
            cachedForeignTableSelected: -1
        });
    }

    filterTypeRadioButtons = () => {
        return (
            <div className="btn-group" role="group" aria-label="Filter type selection button group">
                <input type="radio" className="btn-check" name="btnradio" id="filter-type-selection" autoComplete="off"
                    data-filter-type={0} defaultChecked={this.state.filterType === 0} onChange={this.onFilterTypeChange} />
                <label className="btn btn-outline-primary" htmlFor="filter-type-selection">Filter query</label>

                <input type="radio" className="btn-check" name="btnradio" id="filter-type-dataset" autoComplete="off"
                    data-filter-type={1} defaultChecked={this.state.filterType === 1} onChange={this.onFilterTypeChange} />
                <label className="btn btn-outline-primary" htmlFor="filter-type-dataset">Filter dataset</label>
            </div>
        );
    }

    datasetFilteringElement = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const contextData = dbSchemaContext.data;

        let datasetStatisticsElem = null, filterElem = null;

        if (contextData) {
            datasetStatisticsElem = (
                <div>
                    {contextData.length}
                </div>
            )
        }

        if (this.state.cachedFilterSelection) {
            const thisTable = dbSchemaContext.allEntitiesList[this.state.cachedFilterSelection.tableIndex]
            const thisAttr = thisTable.attr[this.state.cachedFilterSelection.attNum - 1];
            filterElem = (
                <div>
                    {contextData.filter(d => d[thisAttr.attname] !== undefined || d[thisAttr.attname] !== null).length}
                </div>
            )
        }

        return (
            <div>
                {datasetStatisticsElem}
                {filterElem}
            </div>
        );

    }

    tableAttributeListHandler = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        if (dbSchemaContext.selectedFirstTableIndex >= 0) {
            if (this.state.filterType === 0) {
                // Render the relation vis for the entire table
                return this.getTableRelationVis(dbSchemaContext, dbSchemaContext.selectedFirstTableIndex);
            } else if (this.state.filterType === 1) {
                // Render the relation vis for the (potentially-retrieved) dataset
                const contextData = dbSchemaContext.data;
                console.log(contextData)
                if (contextData && contextData.length > 0) {
                    return (
                        <div className="row justify-content-center mt-4 mb-3">
                            <div className="col-5 mt-auto mb-auto">
                                <div className="card mb-2">
                                    <div className="card-body">
                                        <h5 className="card-title">Attributes involved in dataset</h5>
                                    </div>
                                    <ul className="list-group filter-table-attr-group-item list-group-flush start-table-rel-list ml-auto mr-auto">
                                        {this.getAttributeListFromPatternMatchResults(dbSchemaContext.selectedAttributesIndices)}
                                    </ul>
                                </div>
                            </div>
                            <div className="col-5 mt-auto mb-auto">
                                {this.datasetFilteringElement()}
                            </div>
                        </div>
                    )
                }
            }
        }

        return null;
    }

    componentDidMount() {
        const context: DBSchemaContextInterface = this.context;
        const modalElement = document.getElementById("starting-table-select-modal");
        this.modalComponent = new bootstrap.Modal(modalElement, {
            keyboard: false
        });
        this.modalComponent.show();

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
            const currentCachedSelectedIndex = dbSchemaContext.selectedFirstTableIndex;
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
                            <h5 className="modal-title">Select filtering...</h5>
                            <button type="button" className="close" aria-label="Close" onClick={this.handleOnClose}>
                                <span aria-hidden="true"><i className="fas fa-times" /></span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {this.filterTypeRadioButtons()}
                            {this.tableAttributeListHandler()}
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