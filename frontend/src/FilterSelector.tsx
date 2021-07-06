import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { FilterSelectorProps } from './ts/components';
import { Filter, FilterCondition } from './ts/types';



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
            this.props.changedCondition(this.scalarConditions[conditionIndexSelected]);
        }
    };

    scalarConditions: FilterCondition[] = [
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

    conditionDropdown = () => {
        const conditionCached = this.props.filter.condition;
        return (
            <div className="btn-group me-2">
                <button type="button" className="btn btn-secondary">{conditionCached !== undefined ? conditionCached.friendlyName : "Select..."}</button>
                <button type="button" className="btn btn-secondary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                    <span className="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul className="dropdown-menu">
                    {this.scalarConditions.map((cond, idx) => {
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

    render() {
        return (
            <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    {this.filterRelatedAttListElem(this.props.filter)} {this.equality} {this.conditionDropdown()} {this.valueInput}
                </div>
                {this.cachedFilterSubmitButton}
            </div>
        )
    }
}
FilterSelector.contextType = DBSchemaContext
