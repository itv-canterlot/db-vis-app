import * as React from 'react';
import bootstrap = require('bootstrap');
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { Table, FilterCondition, Attribute, PatternMatchAttribute, FilterType, Filter, TableAttributeComb } from './ts/types';
import { DatasetFilteringElementProps, FilterSelectModalProps, FilterSelectModalStates, RelationBasedFilterModalContentProps, RelationBasedFilterModalContentStates, TableBasedFilterModalContentProps } from './ts/components';
import { renderTips } from './ModalPublicElements';
import * as d3 from 'd3';
import { FilterSelector } from './FilterSelector';
import * as FilterConditions from './ts/FilterConditions';
import * as DatasetUtils from './DatasetUtils';
import { SearchDropdownList } from './UIElements';
import * as Connections from './Connections';

export class FilterSelectModal extends React.Component<FilterSelectModalProps, FilterSelectModalStates> {
    cachedFilterValueRef: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);
        const context: DBSchemaContextInterface = this.context;

        this.state = {
            cachedFilterSelection: undefined,
            cachedFilterType: FilterType.getAllFilterTypes()[0],
            cachedFiltersList: [...this.props.filters],
            cachedForeignTableSelected: -1,
            filterRange: 0,
            tableAttributeList: []
        };

        this.cachedFilterValueRef = React.createRef();
    }

    modalComponent: bootstrap.Modal = undefined;

    onFilterSelectionConfirm = (e: React.BaseSyntheticEvent) => {
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
            const fk = dbSchemaContext.allEntitiesList[dbSchemaContext.selectedEntitiesIndices[0]].fk[fkIndex];
            fkTableSelected = dbSchemaContext.allEntitiesList.find(table => table.tableName === fk.pkTableName);
        }

        const currentlyCachedFilter = this.state.cachedFilterSelection;

        this.setState({
            cachedFilterSelection: fkTableSelected ?
                undefined : {
                    tableIndex: tableIdx,
                    attNum: attNum,
                    condition: currentlyCachedFilter ? currentlyCachedFilter.condition : undefined,
                    value: undefined,
                    relatedPatternMatchResult: dbSchemaContext.visSchemaMatchStatus[dbSchemaContext.selectedPatternIndex][dbSchemaContext.selectedMatchResultIndexInPattern]
                },
            cachedForeignTableFKIndex: fkTableSelected ? fkIndex : -1,
            cachedForeignTableSelected: fkTableSelected ? fkTableSelected.idx : -1
        });
    }

    setNewCachedFilterOnForeignTable = (tableIdx: number, attNum: number) => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const tableWithFk = dbSchemaContext.allEntitiesList[dbSchemaContext.selectedEntitiesIndices[0]];
        const fk = tableWithFk.fk[this.state.cachedForeignTableFKIndex];
        this.setState({
            cachedFilterSelection: {
                tableIndex: tableIdx,
                attNum: attNum,
                fk: fk,
                condition: undefined,
                value: undefined,
                relatedPatternMatchResult: dbSchemaContext.visSchemaMatchStatus[dbSchemaContext.selectedPatternIndex][dbSchemaContext.selectedMatchResultIndexInPattern]
            },
        });
    }

    onTableAttributeClick = (e: React.BaseSyntheticEvent) => {
        const currentTarget = e.currentTarget;
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const
            tableIdx = parseInt(currentTarget.getAttribute("data-table-idx")),
            attNum = parseInt(currentTarget.getAttribute("data-attnum"));

        if (tableIdx === dbSchemaContext.selectedEntitiesIndices[0]) {
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

    onClickDeleteFilter = (filterIdx: number) => {
        this.setState({
            cachedFiltersList: this.state.cachedFiltersList.filter((v, i) => i !== filterIdx)
        });
    }

    onConfirmCachedFilter = (e: React.BaseSyntheticEvent, filter?: Filter, filterType?: FilterType) => {
        const filterInputValue = this.cachedFilterValueRef.current as HTMLInputElement;
        let cachedFilter;
        if (filter) {
            cachedFilter = filter;
        } else {
            cachedFilter = this.state.cachedFilterSelection;
        }
        if (filterType) {
            if (filterType === FilterType.STD) {
                cachedFilter.condition = FilterConditions.stdRangeCondition;
            }
        } else {
            if (this.state.cachedFilterType === FilterType.STD) {
                cachedFilter.condition = FilterConditions.stdRangeCondition;
            }
        }

        cachedFilter.value = filterInputValue.value;
        if (Object.keys(cachedFilter).every(key => {
            const val = cachedFilter[key];
            return val !== "";
        })) {
            this.setState({
                cachedFiltersList: [...this.state.cachedFiltersList, cachedFilter]
            }, () => {
                if (filter) {
                    // ?
                } else {
                    if (this.state.cachedForeignTableFKIndex) {
                        this.setNewCachedFilterOnBaseTable(
                            cachedFilter.tableIndex, cachedFilter.attNum, this.state.cachedForeignTableFKIndex);
                    } else {
                        this.setNewCachedFilterOnBaseTable(cachedFilter.tableIndex, cachedFilter.attNum);
                    }
                }
                // Retrieve data (TODO: simplify this)
                // const dbSchemaContext: DBSchemaContextInterface = this.context;
                // const thisTable = dbSchemaContext.allEntitiesList[dbSchemaContext.selectedEntitiesIndices[0]];
                // getFilteredData(thisTable, dbSchemaContext.allEntitiesList, [...this.props.filters, ...this.state.cachedFiltersList]);
            });
        }
    };    

    onFilterRangeChange = (newFilterRange: number) => {
        this.setState({
            filterRange: newFilterRange,
            cachedFilterSelection: undefined,
            cachedForeignTableFKIndex: -1,
            cachedFiltersList: [...this.props.filters],
            cachedForeignTableSelected: -1
        });
    }

    onChangeFilterType = (e: React.BaseSyntheticEvent) => {
        const newFilterTypeIndex = parseInt(e.currentTarget.getAttribute("data-filter-range-id"));
        this.setState({
            cachedFilterType: FilterType.getAllFilterTypes()[newFilterTypeIndex]
        });
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

        // const combinedFilterList = [...this.props.filters, ...this.state.cachedFiltersList]

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
            .call(d3.axisBottom(x)
                .ticks(n_bins)
                .tickSizeOuter(0)
                .tickFormat((d, i) => {
                    if (Math.abs(d.valueOf()) >= 10000) {
                        return d3.format(".1e")(d);
                    } else if (Math.abs(d.valueOf()) < 0.001) {
                        return d3.format(".1e")(d);
                    }
                    return d3.format("")(d);
                }))
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
            const currentCachedSelectedIndex = dbSchemaContext.selectedEntitiesIndices[0];
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

        // const combinedFilterList = [...this.props.filters, ...this.state.cachedFiltersList]
        if (dbSchemaContext.selectedEntitiesIndices.length !== 0) {
            return (
                <div className="modal fade d-block" role="dialog" id="starting-table-select-modal">
                    <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: "80%" }}>
                        <TableBasedFilterModalContent 
                            filterList={this.state.cachedFiltersList}
                            handleOnClose={this.handleOnClose}
                            onFilterRangeChange={this.onFilterRangeChange}
                            onFilterSelectionConfirm={this.onFilterSelectionConfirm}
                            onTableAttributeClick={this.onTableAttributeClick}
                            cachedFilterValueRef={this.cachedFilterValueRef}
                            onChangeFilterType={this.onChangeFilterType}
                            onConfirmCachedFilter={this.onConfirmCachedFilter}
                            onFilterConditionChanged={this.onFilterConditionChanged}
                            onClickDeleteFilter={this.onClickDeleteFilter}
                            parentStates={this.state} />
                    </div>
                </div>
            );
        } else if (dbSchemaContext.selectedRelationsIndices.length !== 0) {
            return (
                <div className="modal fade d-block" role="dialog" id="starting-table-select-modal">
                    <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: "80%" }}>
                        <RelationBasedFilterModalContent
                            filterList={this.state.cachedFiltersList}
                            handleOnClose={this.handleOnClose}
                            onFilterSelectionConfirm={this.onFilterSelectionConfirm}
                            onConfirmCachedFilter={this.onConfirmCachedFilter}
                            cachedFilterValueRef={this.cachedFilterValueRef}
                            onClickDeleteFilter={this.onClickDeleteFilter}
                            parentState={this.state} />
                    </div>
                </div>
            );
        } else {
            return (
                <div className="modal fade d-block" role="dialog" id="starting-table-select-modal">
                    <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: "80%" }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Select filters...</h5>
                                <button type="button" className="close" aria-label="Close" onClick={this.handleOnClose}>
                                    <span aria-hidden="true"><i className="fas fa-times" /></span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-danger" role="alert">
                                    No table/relation has been chosen yet!
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className={"btn btn-primary"} onClick={this.onFilterSelectionConfirm}>Confirm</button>
                                <button type="button" className="btn btn-secondary" onClick={this.handleOnClose}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }
}
FilterSelectModal.contextType = DBSchemaContext;

class TableBasedFilterModalContent extends React.Component<TableBasedFilterModalContentProps, {}> {
    // React elements
    filterRangeRadioButtons = () => {
        return (
            <div className="btn-group" role="group" aria-label="Filter type selection button group">
                <input type="radio" className="btn-check" name="btnradio" id="filter-type-selection" autoComplete="off"
                    data-filter-range={0} defaultChecked={this.props.parentStates.filterRange === 0} onChange={this.onFilterRangeChange} />
                <label className="btn btn-outline-primary" htmlFor="filter-type-selection">Filter query</label>

                <input type="radio" className="btn-check" name="btnradio" id="filter-type-dataset" autoComplete="off"
                    data-filter-range={1} defaultChecked={this.props.parentStates.filterRange === 1} onChange={this.onFilterRangeChange} />
                <label className="btn btn-outline-primary" htmlFor="filter-type-dataset">Filter dataset</label>
            </div>
        );
    }

    attributeListFromPatternMatchResults = (attrs: PatternMatchAttribute[][]) => {
        const allAttrs = attrs.flat(1);
        return allAttrs.map((attr, key) => {
            if (!attr) return;
            const tableObject = attr.table;
            const attrObject = tableObject.attr[attr.attributeIndex];
            return (
                <li className={
                        "list-group-item pb-1 d-flex justify-content-between" + 
                        (this.props.parentStates.cachedFilterSelection && this.props.parentStates.cachedFilterSelection.attNum === attrObject.attnum ? " active" : "")}
                    data-table-idx={tableObject.idx} data-attnum={attrObject.attnum} key={key} onClick={this.props.onTableAttributeClick}>
                    <div>
                        {tableObject.tableName}/{attrObject.attname}
                    </div>
                    {renderTips(tableObject, attrObject, true)}
                </li>)
        })
    }

    datasetFilteringComponenent = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        return (
            <div className="row justify-content-center mt-4 mb-3">
                <div className="col-4 mt-auto mb-auto">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Attributes involved in dataset</h5>
                        </div>
                        <ul className="list-group filter-table-attr-group-item list-group-flush start-table-rel-list ml-auto mr-auto">
                            {this.attributeListFromPatternMatchResults(dbSchemaContext.selectedAttributesIndices)}
                        </ul>
                    </div>
                </div>
                <div className="col-8 mt-auto mb-auto">
                    <DatasetFilteringElement
                        filterList={this.props.filterList}
                        cachedFilterSelection={this.props.parentStates.cachedFilterSelection}
                        cachedFilterType={this.props.parentStates.cachedFilterType}
                        cachedFilterValueRef={this.props.cachedFilterValueRef}
                        onChangeFilterType={this.props.onChangeFilterType}
                        onConfirmCachedFilter={this.props.onConfirmCachedFilter}
                        onFilterConditionChanged={this.props.onFilterConditionChanged}
                        onClickDeleteFilter={this.props.onClickDeleteFilter}

                         />
                </div>
            </div>
        );
    }

    tableBasedFilterElement = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        if (dbSchemaContext.selectedEntitiesIndices[0] >= 0) {
            if (this.props.parentStates.filterRange === 0) {
                // Render the relation vis for the entire table
                return this.getTableRelationVis(dbSchemaContext.selectedEntitiesIndices[0]);
            } else if (this.props.parentStates.filterRange === 1) {
                // Render the relation vis for the (potentially-retrieved) dataset
                const contextData = dbSchemaContext.data;
                if (contextData && contextData.length > 0) {
                    if (dbSchemaContext.selectedEntitiesIndices.length !== 0) {
                    return this.datasetFilteringComponenent();
                    } else {
                        // return this.getRelBasedAttributeList();
                    }
                }
            }
        }

        return null;
    }

    getAttributeListInSingleTable = (attrs: Attribute[], table?: Table) => {
        return attrs.map(att => {
            return (
                <li className="list-group-item pb-1 d-flex justify-content-between" onClick={this.props.onTableAttributeClick}
                    data-table-idx={table.idx} data-attnum={att.attnum} key={att.attnum}>
                    <div>
                        {att.attname}
                    </div>
                    {renderTips(table, att, true)}
                </li>
            );
        });
    }

    getAttributeListFromTable = (table: Table) => {
        return this.getAttributeListInSingleTable(table.attr, table);
    };

    getTableRelationVis = (selectedIndex: number) => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        let thisTable: Table = undefined;
        if (selectedIndex >= 0) {
            thisTable = dbSchemaContext.allEntitiesList[selectedIndex];
        }

        let foreignKeyAttList = null;
        if (this.props.parentStates.cachedForeignTableSelected) {
            const selectedFk = thisTable.fk[this.props.parentStates.cachedForeignTableFKIndex];
            const selectedFkTable = dbSchemaContext.allEntitiesList[this.props.parentStates.cachedForeignTableSelected];

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
            const cachedFilter = this.props.parentStates.cachedFilterSelection;
            if (!cachedFilter)
                return null;
            return (                
                <FilterSelector 
                    filter={this.props.parentStates.cachedFilterSelection} 
                    cachedFilterValueRef={this.props.cachedFilterValueRef}
                    cachedFilterType={this.props.parentStates.cachedFilterType}
                    changedCondition={this.props.onFilterConditionChanged}
                    onConfirmCachedFilter={this.props.onConfirmCachedFilter}
                    onChangeFilterType={this.props.onChangeFilterType} />
            );
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
                    <ul className="list-group">
                        <FilterList 
                            onClickDeleteFilter={this.props.onClickDeleteFilter}
                            filterList={this.props.filterList}
                            entitiesList={dbSchemaContext.allEntitiesList} />
                    </ul>
                </div>
            </div>
        );
    };

    // Event handlers
    onFilterRangeChange = (e: React.BaseSyntheticEvent) => {
        const newFilterRange = parseInt(e.currentTarget.getAttribute("data-filter-range"));    
        this.props.onFilterRangeChange(newFilterRange);
    }

    render() {
        return (
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">Select filtering...</h5>
                    <button type="button" className="close" aria-label="Close" onClick={this.props.handleOnClose}>
                        <span aria-hidden="true"><i className="fas fa-times" /></span>
                    </button>
                </div>
                <div className="modal-body">
                    {this.filterRangeRadioButtons()}
                    {this.tableBasedFilterElement()}
                </div>
                <div className="modal-footer">
                    <button type="button" 
                        className={"btn btn-primary"} 
                        onClick={this.props.onFilterSelectionConfirm}>Confirm</button>
                    <button type="button" className="btn btn-secondary" onClick={this.props.handleOnClose}>Cancel</button>
                </div>
            </div>
        )
    }
}
TableBasedFilterModalContent.contextType = DBSchemaContext;

class RelationBasedFilterModalContent extends React.Component<RelationBasedFilterModalContentProps, RelationBasedFilterModalContentStates> {
    constructor(props) {
        super(props);
        this.state = {
            tableAttrList: [],
            selectedTableAttrListIndex: -1,
        };
    }

    setNewFilter = (index?: number): Filter => {
        let thisTableAttElem: TableAttributeComb;
        if (index !== undefined) {
            thisTableAttElem = this.state.tableAttrList[index];
        } else if (this.state.selectedTableAttrListIndex >= 0) {
            thisTableAttElem = this.state.tableAttrList[this.state.selectedTableAttrListIndex];
        }
        if (thisTableAttElem !== undefined) {
            return {
                tableIndex: thisTableAttElem.table.idx,
                attNum: thisTableAttElem.attr.attnum,
                condition: undefined,
                relatedPatternMatchResult: undefined,
                value: undefined
            }
        } else {
            return undefined;
        }
    }

    getListOfAttributesInRels = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        // Ignoring the auxilliary relations
        return [...dbSchemaContext.relHierarchyIndices[0], ...dbSchemaContext.relHierarchyIndices[1]]
                .flatMap(relIdx => {
                    const thisRelation = dbSchemaContext.relationsList[relIdx];
                    const parentTableAtts = thisRelation.parentEntity.attr.map(attr => {
                        return {
                            table: thisRelation.parentEntity,
                            attr: attr
                        };
                    });
                    const childTableAtts = thisRelation.childRelations.flatMap(rel => rel.table.attr.map(attr => {
                        return {
                            table: rel.table,
                            attr: attr
                        };
                    }));
                    return [...parentTableAtts, ...childTableAtts];
                })
    }

    datasetPreviewElement = () => {
        if (this.state.sampleData == undefined) {
            return null;
        } else {
            return (
                <div>
                    {DatasetUtils.filterDataByFilters(this.state.sampleData, this.context, this.props.filterList).length}
                </div>
            )
        }
    }

    datasetFilteringElement = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;        
        return (
            <div className="row">
                <div className="col-6">
                    {this.datasetPreviewElement()}
                </div>
                <div className="col-6">
                    {
                        this.state.selectedTableAttrListIndex < 0 ? null :
                        <FilterSelector 
                            cachedFilterType={this.state.newFilterType}
                            cachedFilterValueRef={this.props.cachedFilterValueRef}
                            changedCondition={this.onFilterConditionChanged}
                            filter={this.state.newFilter}
                            onChangeFilterType={this.onChangeFilterType}
                            onConfirmCachedFilter={this.onConfirmCachedFilter}
                        />
                    }
                    <ul className="list-group">
                        <FilterList 
                            onClickDeleteFilter={this.props.onClickDeleteFilter}
                            filterList={this.props.filterList} 
                            entitiesList={dbSchemaContext.allEntitiesList} />
                    </ul>
                </div>
            </div>
        )
    }

    relBasedFilteringAttRenderer = (tableAttr: TableAttributeComb, index: number, onClickCallback: React.MouseEventHandler<HTMLAnchorElement>) => {
        let {table, attr} = tableAttr;
        let attElement = () => {
            return (
                <div className="d-flex align-items-center">
                    {table.tableName}/{attr.attname}
                </div>
            )
        }

        return <a className={"dropdown-item pe-auto"} 
            data-table-idx={table.idx} data-attnum={attr.attnum} data-list-index={index} key={index} href="#" onMouseDown={onClickCallback}>
                <div className="pe-none">
                    {attElement()}
                </div>
            </a>
    }

    onTableAttrCombSelect = (e: React.BaseSyntheticEvent) => {
        const listIndex = parseInt(e.currentTarget.getAttribute("data-list-index"));
        const newFilter = this.setNewFilter(listIndex);
        this.setState({
            selectedTableAttrListIndex: listIndex,
            newFilter: newFilter,
            newFilterType: FilterType.getAllFilterTypes()[0]
        });

        const getDataCallback = (data => {
            this.setState({
                sampleData: data
            })
        })

        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const newtableAttr = this.state.tableAttrList[listIndex];
        Connections.getRelationBasedData(
            dbSchemaContext.relHierarchyIndices.flat()
                .map(relIdx => dbSchemaContext.relationsList[relIdx]), dbSchemaContext, 
                    [
                    [...dbSchemaContext.selectedAttributesIndices[0], 
                        {table: newtableAttr.table, attributeIndex: newtableAttr.attr.attnum - 1}, ...this.props.filterList.map(filter => {
                            return {
                                table: dbSchemaContext.allEntitiesList[filter.tableIndex],
                                attributeIndex: filter.attNum - 1
                            }
                        })], 
                    dbSchemaContext.selectedAttributesIndices[1]], 
                this.props.filterList) // TODO: filters not working in Connection yet
        .then(getDataCallback.bind(this));
    }

    onChangeFilterType = (e: React.BaseSyntheticEvent) => {
        const newFilterTypeIndex = parseInt(e.currentTarget.getAttribute("data-filter-range-id"));
        this.setState({
            newFilterType: FilterType.getAllFilterTypes()[newFilterTypeIndex]
        });
    }

    onFilterConditionChanged = (cond: FilterCondition) => {
        const cachedFilter = this.state.newFilter;
        cachedFilter.condition = cond;
        this.setState({
            newFilter: cachedFilter
        });
    };

    onConfirmCachedFilter = (e: React.BaseSyntheticEvent) => {
        this.props.onConfirmCachedFilter(e, this.state.newFilter, this.state.newFilterType);
        this.setState({
            newFilter: undefined,
            newFilterType: FilterType.getAllFilterTypes()[0],
            selectedTableAttrListIndex: -1
        })
    }

    attributeInformationCardText = (chosenTableAttr: TableAttributeComb) => {
        if (this.state.selectedTableAttrListIndex < 0 || !chosenTableAttr) return null;
        else return (
            <div>
                <p>
                    Attribute count: {chosenTableAttr.attr.attCount}
                </p>
                <p>
                    Attribute distinct count: {chosenTableAttr.attr.attDistinctCount}
                </p>
            </div>
        )
    }

    getRelBasedAttributeList = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        let chosenTableAttr: TableAttributeComb;
        if (this.state.selectedTableAttrListIndex >= 0) {
            chosenTableAttr = this.state.tableAttrList[this.state.selectedTableAttrListIndex];
        }
        return (
            <div className="row justify-content-center mt-4 mb-3">
                <div className="col-4 mt-auto mb-auto">
                    <SearchDropdownList 
                        placeholder="Search for attributes..."
                        arrayRenderer={this.relBasedFilteringAttRenderer}
                        dropdownList={this.state.tableAttrList}
                        onListSelectionChange={this.onTableAttrCombSelect}
                        prependText={undefined}
                        selectedIndex={undefined}
                    />
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">
                                {chosenTableAttr ? (<span className="badge bg-secondary">{chosenTableAttr.table.tableName}/{chosenTableAttr.attr.attname}</span>) : null}
                            </h5>
                            <div className="card-text">
                                {this.attributeInformationCardText(chosenTableAttr)}
                            </div>
                        </div>
                        <ul className="list-group filter-table-attr-group-item list-group-flush start-table-rel-list ml-auto mr-auto">
                            {/* {this.getAttributeListFromPatternMatchResults(dbSchemaContext.selectedAttributesIndices)} */}
                        </ul>
                    </div>
                </div>
                <div className="col-8 mt-auto mb-auto">
                    {this.datasetFilteringElement()}
                </div>
            </div>
        );
    }

    componentDidMount() {
        this.setState({
            tableAttrList: this.getListOfAttributesInRels()
        });
    }

    render() {
        return (
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">Select filters...</h5>
                    <button type="button" className="close" aria-label="Close" onClick={this.props.handleOnClose}>
                        <span aria-hidden="true"><i className="fas fa-times" /></span>
                    </button>
                </div>
                <div className="modal-body">
                    {this.getRelBasedAttributeList()}
                </div>
                <div className="modal-footer">
                    <button type="button" className={"btn btn-primary"} onClick={this.props.onFilterSelectionConfirm}>Confirm</button>
                    <button type="button" className="btn btn-secondary" onClick={this.props.handleOnClose}>Cancel</button>
                </div>
            </div>
        )
    }
}
RelationBasedFilterModalContent.contextType = DBSchemaContext;

class DatasetFilteringElement extends React.Component<DatasetFilteringElementProps,{}> {
    filterFormElem = () => {
        return (
            <div>
                <h5>Filters</h5>
                <FilterSelector 
                    filter={this.props.cachedFilterSelection} 
                    cachedFilterValueRef={this.props.cachedFilterValueRef} 
                    cachedFilterType={this.props.cachedFilterType}
                    changedCondition={this.props.onFilterConditionChanged}
                    onConfirmCachedFilter={this.props.onConfirmCachedFilter}
                    onChangeFilterType={this.props.onChangeFilterType} />
            </div>
        )
    }

    render() {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const contextData = dbSchemaContext.data;

        let datasetStatisticsElem = null, filterDataVisElem = null;

        let thisTable: Table, thisAttr: Attribute, dataFiltered: number[];

        if (this.props.cachedFilterSelection) {
            thisTable = dbSchemaContext.allEntitiesList[this.props.cachedFilterSelection.tableIndex]
            thisAttr = thisTable.attr[this.props.cachedFilterSelection.attNum - 1];
            dataFiltered = DatasetUtils.filterDataByAttribute(contextData, dbSchemaContext, thisAttr, this.props.filterList, true);
        }

        if (contextData) {
            let dataMin = null, dataMax = null, filteredDataLength = null, meanStd = null;
            if (this.props.cachedFilterSelection) {
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

        if (this.props.cachedFilterSelection) {                
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
                    {this.props.cachedFilterSelection ? this.filterFormElem() : null}
                    <ul className="list-group">
                        <FilterList 
                            onClickDeleteFilter={this.props.onClickDeleteFilter}
                            filterList={this.props.filterList} 
                            entitiesList={dbSchemaContext.allEntitiesList} />
                    </ul>
                </div>
            </div>
        );

    }
}
DatasetFilteringElement.contextType = DBSchemaContext;

class FilterList extends React.Component<{filterList: Filter[], entitiesList: Table[], onClickDeleteFilter: Function}, {}> {
    onClickDeleteFilter = (e: React.BaseSyntheticEvent) => {
        const filterIndex = parseInt(e.currentTarget.getAttribute("data-filter-index"));
        this.props.onClickDeleteFilter(filterIndex);
    }

    render() {
        const combinedList = this.props.filterList;
        if (combinedList.length > 0) {
            return combinedList.map((filter, idx) => {
                const thisFilterTable = this.props.entitiesList[filter.tableIndex];
                const thisFilterAttribute = thisFilterTable.attr[filter.attNum - 1];
                return (
                <li className="align-items-center d-flex justify-content-between list-group-item" key={idx}>
                    <div className="me-3 cursor-pointer" onClick={this.onClickDeleteFilter} data-filter-index={idx}>
                        <i className="fas fa-minus-circle"/>
                    </div>
                    <div className="w-100">
                        <div className="type-tip bg-tip-grey">
                            {filter.condition.filterType.toString()}
                        </div>
                        <div className="d-inline-flex">
                            <div>{thisFilterTable.tableName}/{thisFilterAttribute.attname}</div>
                            <div className="ms-1">is</div>
                            <div className="ms-1">
                                {filter.condition.friendlyName[0]}
                            </div>
                            <div className="ms-1">
                                {filter.value}
                            </div>
                            {
                                filter.condition.friendlyTextInfix ? 
                                <div className="ms-1">
                                    {filter.condition.friendlyName[1]}
                                </div> : null
                            }
                        </div>

                    </div>
                </li>);
            });
        } else {
            return null;
        }
    }
}