import * as React from 'react';
import bootstrap = require('bootstrap');
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { Table, FilterCondition, Attribute, PatternMatchAttribute, FilterType } from './ts/types';
import { FilterSelectModalProps, FilterSelectModalStates } from './ts/components';
import { getFilteredData } from './Connections';
import { renderTips } from './ModalPublicElements';
import * as d3 from 'd3';
import { FilterSelector } from './FilterSelector';
import * as FilterConditions from './ts/FilterConditions';
import * as DatasetUtils from './DatasetUtils';

export class FilterSelectModal extends React.Component<FilterSelectModalProps, FilterSelectModalStates> {
    cachedFilterValueRef: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);
        this.state = {
            cachedFilterSelection: undefined,
            cachedFilterType: FilterType.getAllFilterTypes()[0],
            cachedFiltersList: [],
            cachedForeignTableSelected: -1,
            filterRange: 0
        };

        this.cachedFilterValueRef = React.createRef();
    }

    modalComponent: bootstrap.Modal = undefined;

    onFilterSelectionConfirm = (e) => {
        this.props.onFilterChange(this.state.cachedFiltersList);
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

    setNewCachedFilterOnBaseTable = (tableIdx: number, attNum: number, fkIndex?: number) => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        let fkTableSelected: Table;
        if (fkIndex !== undefined && fkIndex >= 0) {
            const fk = dbSchemaContext.allEntitiesList[dbSchemaContext.selectedFirstTableIndex].fk[fkIndex];
            fkTableSelected = dbSchemaContext.allEntitiesList.find(table => table.tableName === fk.pkTableName);
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
    }

    setNewCachedFilterOnForeignTable = (tableIdx: number, attNum: number) => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
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

    onTableAttributeClick = (e: React.BaseSyntheticEvent) => {
        const currentTarget = e.currentTarget;
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const
            tableIdx = parseInt(currentTarget.getAttribute("data-table-idx")),
            attNum = parseInt(currentTarget.getAttribute("data-attnum"));

        if (tableIdx === dbSchemaContext.selectedFirstTableIndex) {
            // Selected attribute is in the "base" table
            const foreignKeyAttElement = currentTarget.getElementsByClassName("att-to-fk");
            let fkIndex: number;
            
            if (foreignKeyAttElement && foreignKeyAttElement.length > 0) {
                fkIndex = parseInt(foreignKeyAttElement[0].getAttribute("data-fk-id")); // TODO: not the first index?
            }
            this.setNewCachedFilterOnBaseTable(tableIdx, attNum, fkIndex);
            
        } else {
            // Selected attribute is in the "foreign" table
            this.setNewCachedFilterOnForeignTable(tableIdx, attNum);
        }
    };

    onFilterConditionChanged = (cond: FilterCondition) => {
        const cachedFilter = this.state.cachedFilterSelection;
        cachedFilter.condition = cond;
        this.setState({
            cachedFilterSelection: cachedFilter
        });
    };

    onConfirmCachedFilter = (e: React.BaseSyntheticEvent) => {
        const filterInputValue = this.cachedFilterValueRef.current as HTMLInputElement;
        const cachedFilter = this.state.cachedFilterSelection;
        if (this.state.cachedFilterType === FilterType.STD) {
            cachedFilter.condition = FilterConditions.stdRangeCondition;
        }

        cachedFilter.value = filterInputValue.value;
        if (Object.keys(cachedFilter).every(key => {
            const val = cachedFilter[key];
            return val !== "";
        })) {
            this.setState({
                cachedFiltersList: [...this.state.cachedFiltersList, cachedFilter]
            }, () => {
                if (this.state.cachedForeignTableFKIndex) {
                    this.setNewCachedFilterOnBaseTable(
                        cachedFilter.tableIndex, cachedFilter.attNum, this.state.cachedForeignTableFKIndex);
                } else {
                    this.setNewCachedFilterOnBaseTable(cachedFilter.tableIndex, cachedFilter.attNum);
                }
                // Retrieve data (TODO: simplify this)
                const dbSchemaContext: DBSchemaContextInterface = this.context;
                const thisTable = dbSchemaContext.allEntitiesList[dbSchemaContext.selectedFirstTableIndex];
                getFilteredData(thisTable, dbSchemaContext.allEntitiesList, this.state.cachedFiltersList);
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
                <li className={
                        "list-group-item pb-1 d-flex justify-content-between" + 
                        (this.state.cachedFilterSelection && this.state.cachedFilterSelection.attNum === attrObject.attnum ? " active" : "")}
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
                    <div className="card mt-2">
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
        


        const cachedFilterElem = () => {
            const cachedFilter = this.state.cachedFilterSelection;
            if (!cachedFilter)
                return null;
            return (                
                <FilterSelector 
                    filter={this.state.cachedFilterSelection} 
                    cachedFilterValueRef={this.cachedFilterValueRef}
                    cachedFilterType={this.state.cachedFilterType}
                    changedCondition={this.onFilterConditionChanged}
                    onConfirmCachedFilter={this.onConfirmCachedFilter}
                    onChangeFilterType={this.onChangeFilterType} />
            );
        };

        const savedFilters = () => {
            const filters = this.state.cachedFiltersList;
            if (!filters || filters.length === 0) {
                return null;
            }

            return JSON.stringify(filters);
        };

        return (
            <div className="row justify-content-center mt-4 mb-3">
                <div className="col-4 mt-auto mb-auto">
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
                <div className="col-8 mt-auto mb-auto">
                    {cachedFilterElem()}
                    {savedFilters()}
                </div>
            </div>
        );
    };

    onFilterRangeChange = (e: React.BaseSyntheticEvent) => {
        const newFilterRange = parseInt(e.currentTarget.getAttribute("data-filter-range"));
        this.setState({
            filterRange: newFilterRange,
            cachedFilterSelection: undefined,
            cachedForeignTableFKIndex: -1,
            cachedFiltersList: [],
            cachedForeignTableSelected: -1
        });
    }

    onChangeFilterType = (e: React.BaseSyntheticEvent) => {
        const newFilterTypeIndex = parseInt(e.currentTarget.getAttribute("data-filter-range-id"));
        this.setState({
            cachedFilterType: FilterType.getAllFilterTypes()[newFilterTypeIndex]
        });
    }

    filterRangeRadioButtons = () => {
        return (
            <div className="btn-group" role="group" aria-label="Filter type selection button group">
                <input type="radio" className="btn-check" name="btnradio" id="filter-type-selection" autoComplete="off"
                    data-filter-range={0} defaultChecked={this.state.filterRange === 0} onChange={this.onFilterRangeChange} />
                <label className="btn btn-outline-primary" htmlFor="filter-type-selection">Filter query</label>

                <input type="radio" className="btn-check" name="btnradio" id="filter-type-dataset" autoComplete="off"
                    data-filter-range={1} defaultChecked={this.state.filterRange === 1} onChange={this.onFilterRangeChange} />
                <label className="btn btn-outline-primary" htmlFor="filter-type-dataset">Filter dataset</label>
            </div>
        );
    }

    filterFormElem = () => {
        return (
            <div>
                <h5>Filters</h5>
                <FilterSelector 
                    filter={this.state.cachedFilterSelection} 
                    cachedFilterValueRef={this.cachedFilterValueRef} 
                    cachedFilterType={this.state.cachedFilterType}
                    changedCondition={this.onFilterConditionChanged}
                    onConfirmCachedFilter={this.onConfirmCachedFilter}
                    onChangeFilterType={this.onChangeFilterType} />
            </div>
        )
    }

    datasetFilteringElement = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const contextData = dbSchemaContext.data;

        let datasetStatisticsElem = null, filterDataVisElem = null;

        let thisTable: Table, thisAttr: Attribute, dataFiltered: number[];

        if (this.state.cachedFilterSelection) {
            thisTable = dbSchemaContext.allEntitiesList[this.state.cachedFilterSelection.tableIndex]
            thisAttr = thisTable.attr[this.state.cachedFilterSelection.attNum - 1];
            dataFiltered = DatasetUtils.filterDataByAttribute(contextData, dbSchemaContext, thisAttr, this.state.cachedFiltersList, true);
        }

        if (contextData) {
            let dataMin = null, dataMax = null, filteredDataLength = null, meanStd = null;
            if (this.state.cachedFilterSelection) {
                dataMin = (
                    <div>
                        <div className="small">
                            min
                        </div>
                        <div>
                            <strong>
                                {Math.min(...dataFiltered)}
                            </strong>
                        </div>
                    </div>
                );
                dataMax = (
                    <div className="text-end">
                        <div className="small">
                            max
                        </div>
                        <div>
                            <strong>
                                {Math.max(...dataFiltered)}
                            </strong>
                        </div>
                    </div>
                );

                filteredDataLength = (
                    <div>
                        {dataFiltered.length}
                    </div>
                )

                meanStd = (
                    <div className="text-center">
                        <div>
                            μ = <strong>{DatasetUtils.getAverage(dataFiltered).toFixed(2)}</strong>
                        </div>
                        <div>
                            σ = <strong>{DatasetUtils.getStandardDeviation(dataFiltered).toFixed(2)}</strong>
                        </div>
                    </div>
                )
                
                datasetStatisticsElem = (
                    <div className="card mt-2">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            {dataMin} {meanStd} {dataMax}
                        </div>
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item">
                                <div>
                                    # total dataset entries: {dbSchemaContext.data.length}
                                </div>
                                <div>
                                    # valid data entries for attribute: {dataFiltered.length}
                                </div>
                            </li>
                        </ul>
                    </div>
                )
            }

        }

        if (this.state.cachedFilterSelection) {                
            filterDataVisElem = (
                <div className="row">
                    <div className="col d-flex justify-content-center">
                        <div id="filter-data-dist-vis-cont"></div>
                    </div>
                </div>
            )
        }

        return (
            <div className="row">
                <div className="col-6">
                    <div className="row">
                        <div className="col">
                            {filterDataVisElem}
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            {datasetStatisticsElem}
                        </div>
                    </div>

                </div>
                <div className="col-6">
                    {this.state.cachedFilterSelection ? this.filterFormElem() : null}
                    {this.state.cachedFiltersList.length > 0 ? JSON.stringify(this.state.cachedFiltersList) : null}
                </div>
            </div>
        );

    }

    getDatasetFilteringComponenent = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        return (
            <div className="row justify-content-center mt-4 mb-3">
                <div className="col-4 mt-auto mb-auto">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Attributes involved in dataset</h5>
                        </div>
                        <ul className="list-group filter-table-attr-group-item list-group-flush start-table-rel-list ml-auto mr-auto">
                            {this.getAttributeListFromPatternMatchResults(dbSchemaContext.selectedAttributesIndices)}
                        </ul>
                    </div>
                </div>
                <div className="col-8 mt-auto mb-auto">
                    {this.datasetFilteringElement()}
                </div>
            </div>
        );
    }

    tableAttributeListHandler = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        if (dbSchemaContext.selectedFirstTableIndex >= 0) {
            if (this.state.filterRange === 0) {
                // Render the relation vis for the entire table
                return this.getTableRelationVis(dbSchemaContext, dbSchemaContext.selectedFirstTableIndex);
            } else if (this.state.filterRange === 1) {
                // Render the relation vis for the (potentially-retrieved) dataset
                const contextData = dbSchemaContext.data;
                if (contextData && contextData.length > 0) {
                    return this.getDatasetFilteringComponenent();
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

    renderDataDistributionChart = (data: object[], attr: Attribute) => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        var margin = ({top: 20, right: 20, bottom: 30, left: 40}),
        width = 500 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom, 
        color = "steelblue";

        const filteredData = DatasetUtils.filterDataByAttribute(data, dbSchemaContext, attr, this.state.cachedFiltersList).map(d => parseFloat(d), true)
        const n_bins = d3.thresholdSturges(filteredData);

        let bins = d3.bin().thresholds(n_bins)(filteredData);

        let x = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([margin.left, width - margin.right])

        let y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)]).nice()
            .range([height - margin.bottom, margin.top])

        const xLabel = attr.attname, yLabel = "Count";

        let xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(n_bins).tickSizeOuter(0))
            .call(g => g.append("text")
                .attr("x", width - margin.right)
                .attr("y", -4)
                .attr("fill", "currentColor")
                .attr("font-weight", "bold")
                .attr("text-anchor", "end")
                .text(xLabel))

        let yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(height / 40))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("x", 4)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(yLabel))

        let svg = d3.select("#filter-data-dist-vis-cont")
            .selectAll("svg");
        if (!svg.empty()) {
            svg.remove();
        }
        
        svg = d3.select("#filter-data-dist-vis-cont")
        .append("svg")
        .attr("viewBox", [0, 0, width, height].join(" "))
        .attr("width", width)
        .attr("height", height);
        
        svg.append("g")
            .attr("fill", color)
            .selectAll("rect")
            .data(bins)
            .join("rect")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", d => y(d.length))
            .attr("height", d => y(0) - y(d.length));

        svg.append("g")
            .call(xAxis);
        
        svg.append("g")
            .call(yAxis);

        let xmean = d3.mean(filteredData, (d: number) => d);

        svg.append("line")
            .attr("class", "line")
            .attr("x1", x(xmean))
            .attr("y1", 0)
            .attr("x2", x(xmean))
            .attr("y2", height)
            .style("stroke-width", 2)
            .style("stroke", "maroon")
            .style("stroke-dasharray", ("3, 3"))
            .style("fill", "none"); 
    }

    componentDidUpdate() {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        if (this.state.filterRange === 1) {
            const contextData = dbSchemaContext.data;
            if (this.state.cachedFilterSelection !== undefined && this.state.cachedFilterSelection.tableIndex !== undefined) {
                const thisTable = dbSchemaContext.allEntitiesList[this.state.cachedFilterSelection.tableIndex]
                const thisAttr = thisTable.attr[this.state.cachedFilterSelection.attNum - 1];
                this.renderDataDistributionChart(contextData, thisAttr);
            }
        }
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
                            {this.filterRangeRadioButtons()}
                            {this.tableAttributeListHandler()}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className={"btn btn-primary" + (this.state.cachedFiltersList.length === 0 ? " disabled" : "")} onClick={this.onFilterSelectionConfirm}>Confirm</button>
                            <button type="button" className="btn btn-secondary" onClick={this.handleOnClose}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
FilterSelectModal.contextType = DBSchemaContext;