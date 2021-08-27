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
            <a href="#" className="btn btn-secondary btn-sm btn me-2" role="button" aria-disabled="true">
                {filterRelatedTable.tableName}/{filterRelatedAttName}
            </a>
        );
    };

    thisConditionHandler = (e: React.BaseSyntheticEvent) => {
        const conditionIndexSelected = parseInt(e.target.getAttribute("data-cond-idx"));
        if (conditionIndexSelected > -1) {
            const currentFilterConditions = FilterConditions.getFilterConditionsByType(this.props.cachedFilterType);
            this.props.changedCondition(currentFilterConditions[conditionIndexSelected]);
        }
    };

    conditionDropdown = () => {
        const conditionCached = this.props.filter.condition;
        const currentFilterConditions = FilterConditions.getFilterConditionsByType(this.props.cachedFilterType);
        return (
            <div className="btn-group me-2">
                <button type="button" className="btn btn-sm btn-secondary">{conditionCached !== undefined ? conditionCached.friendlyName : "Select..."}</button>
                <button type="button" className="btn btn-sm btn-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                    <span className="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul className="dropdown-menu">
                    {currentFilterConditions.map((cond, idx) => {
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

    valueInputNumber = (
        <div className="input-group">
            <input ref={this.props.cachedFilterValueRef} type="number" className="form-control input-number-no-scroll" placeholder="Value" aria-label="Value" />
        </div>
    );

    valueInputAny = (
        <div className="input-group" style={{ maxWidth: "20%" }}>
            <input ref={this.props.cachedFilterValueRef} className="form-control input-number-no-scroll" placeholder="Value" aria-label="Value" />
        </div>
    )

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
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="me-2">
                            {this.filterRelatedAttListElem(this.props.filter)} {this.equality} {this.conditionDropdown()}
                        </div>
                        <div style={{ maxWidth: "40%" }}>
                            {this.valueInputNumber}
                        </div>
                    </div>
                )
            case (FilterType.STRING_COMPARISON):
                return (
                    <div className="d-flex align-items-center">
                        {this.filterRelatedAttListElem(this.props.filter)} {this.equality} {this.conditionDropdown()} {this.valueInputAny}
                    </div>
                )
            case (FilterType.STD):
                return (
                    <div>
                        <div className="d-flex align-items-center">
                            <div>Keep data points of</div>{this.filterRelatedAttListElem(this.props.filter)}
                        </div>
                        <div className="d-flex align-items-center">
                            <div>within</div>{this.valueInputNumber} <div>standard deviations</div>
                        </div>
                    </div>
                )
            default:
                return null;
        }
    }

    render() {
        return (
            <div className="d-flex align-items-center justify-content-between">
                <div className="p-4" style={{border: "2px solid #aaa", borderRadius: "10px"}}>
                    <div className="mb-2">
                        {this.filterTypeSelection()}                    
                    </div>
                    {this.getFilterSelectorByType()}
                </div>
                <div className="ms-3">
                    {this.cachedFilterSubmitButton}
                </div>
            </div>
        )
    }
}
FilterSelector.contextType = DBSchemaContext
