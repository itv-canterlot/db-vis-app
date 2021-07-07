import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { FilterSelectorProps } from './ts/components';
import { Filter, FilterType } from './ts/types';
import * as FilterConditions from "./ts/FilterConditions";


export class FilterSelector extends React.Component<FilterSelectorProps, {}> {
    constructor(props) {
        super(props);
    }

    filterRelatedAttListElem = (filter: Filter) => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const filterRelatedTable = dbSchemaContext.allEntitiesList[filter.tableIndex];
        const filterRelatedAttName = filterRelatedTable.attr[filter.attNum - 1].attname;
        return (
            <a href="#" className="btn btn-secondary btn me-2" role="button" aria-disabled="true">
                {filterRelatedTable.tableName}/{filterRelatedAttName}
            </a>
        );
    };

    thisConditionHandler = (e: React.BaseSyntheticEvent) => {
        const conditionIndexSelected = parseInt(e.target.getAttribute("data-cond-idx"));
        if (conditionIndexSelected > -1) {
            this.props.changedCondition(FilterConditions.scalarConditions[conditionIndexSelected]);
        }
    };

    conditionDropdown = () => {
        const conditionCached = this.props.filter.condition;
        return (
            <div className="btn-group me-2">
                <button type="button" className="btn btn-secondary">{conditionCached !== undefined ? conditionCached.friendlyName : "Select..."}</button>
                <button type="button" className="btn btn-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                    <span className="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul className="dropdown-menu">
                    {FilterConditions.scalarConditions.map((cond, idx) => {
                        return (<li key={idx} data-cond-idx={idx}><a className="dropdown-item" href="#" data-cond-idx={idx} onClick={this.thisConditionHandler}>{cond.friendlyName}</a></li>);
                    })}
                </ul>
            </div>
        );
    }

    equality = (
        <div className="me-2">
            is
        </div>
    );

    valueInput = (
        <div className="input-group" style={{ maxWidth: "20%" }}>
            <input ref={this.props.cachedFilterValueRef} type="number" className="form-control input-number-no-scroll" placeholder="Value" aria-label="Value" />
        </div>
    );

    cachedFilterSubmitButton = (
        <button type="button" className="btn btn-success" onClick={this.props.onConfirmCachedFilter}>Confirm</button>
    );

    filterTypeSelection = () => {
        const filterType = this.props.cachedFilterType;
        if (!filterType) return null;
        else return (
            <div className="btn-group">
                <button className="btn btn-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {this.props.cachedFilterType.toString()}
                </button>
                <ul className="dropdown-menu">
                    {FilterType.getAllFilterTypes().map((ft, i) => {
                        return (
                            <li key={i} data-filter-range-id={i} onClick={this.props.onChangeFilterType}>
                                <a className={"dropdown-item" + (ft === this.props.cachedFilterType ? " active" : "")} href="#">{ft.toString()}</a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        )
    }

    getFilterSelectorByType = () => {
        switch (this.props.cachedFilterType) {
            case (FilterType.SCALAR_COMPARISON):
                return (
                    <div className="d-flex align-items-center">
                        {this.filterRelatedAttListElem(this.props.filter)} {this.equality} {this.conditionDropdown()} {this.valueInput}
                    </div>
                )
            case (FilterType.STD):
                return (
                    <div className="d-flex align-items-center">
                        <div>Keep data points of</div>{this.filterRelatedAttListElem(this.props.filter)}<div>within</div>{this.valueInput} <div>standard deviations</div>
                    </div>
                )
            default:
                return null;
        }
    }

    render() {
        return (
            <div className="d-flex align-items-center justify-content-between">
                <div>
                    <div className="mb-2">
                        {this.filterTypeSelection()}                    
                    </div>
                    {this.getFilterSelectorByType()}
                </div>
                <div>
                    {this.cachedFilterSubmitButton}
                </div>
            </div>
        )
    }
}
FilterSelector.contextType = DBSchemaContext
