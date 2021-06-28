import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { FilterSelectModal } from './SidebarModals';
import { AppMainContProps, AppMainContStates, SchemaExplorerProps, SchemaExplorerStates } from './ts/components';
import { CONFIRMATION_STATUS, PatternMatchAttribute, PatternMatchResult, PATTERN_MISMATCH_REASON_TYPE, VisParam, VISSCHEMATYPES, visSchemaTypeToReadableString } from './ts/types';
import { Visualiser } from './Visualiser';

class SchemaExplorer extends React.Component<SchemaExplorerProps, SchemaExplorerStates> {
    constructor(props) {
        super(props);
        this.state = {
            showFilterSelectModal: false
        }
    }

    onPatternSelectionDropdownClick = (e: React.BaseSyntheticEvent) => {
        const context: DBSchemaContextInterface = this.context;
        const selectedIndex = parseInt(e.target.getAttribute("data-index"));
        if (selectedIndex === context.selectedPatternIndex) return;

        this.props.onVisPatternIndexChange(selectedIndex);
    }

    getMatchCount = (visStatus) => visStatus.reduce(
        (acc, curr) => {
            if (curr) return acc + 1; else return acc;
        }, 0);

    allSchemasDropdownItem = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const patternMatchResult = dbSchemaContext.visSchemaMatchStatus;
        if (dbSchemaContext.visSchemaMatchStatus && dbSchemaContext.visSchema) {
            let matchedItems = [], unmatchedItems = [];
            matchedItems.push((
                <li key={-1}>
                    <h6 className="dropdown-header">Successfully matched patterns</h6>
                </li>
            ));

            if (this.props.expanded) {
                unmatchedItems.push((
                    <li key={-3}><hr className="dropdown-divider" /></li>
                ))
                unmatchedItems.push((
                    <li key={-2} onClick={(e) => e.preventDefault()}>
                        <h6 className="dropdown-header">Unmatched patterns</h6>
                    </li>
                ));
            }

            dbSchemaContext.visSchema.map((visSchema, idx) => {
                const schemaMatchResult = patternMatchResult[idx];
                if (!this.props.expanded && (!schemaMatchResult || !schemaMatchResult.matched)) {
                    return;
                }

                let classList = "dropdown-item";
                if (dbSchemaContext.selectedPatternIndex === idx) classList += " active"
                const listElem = (
                    <li key={idx}>
                        <a className={classList} href="#" data-index={idx} onClick={this.onPatternSelectionDropdownClick}>
                            {visSchema.name}
                        </a>
                    </li>
                );

                if (schemaMatchResult && schemaMatchResult.matched) {
                    // If this item had been matched:
                    matchedItems.push(listElem);
                } else {
                    unmatchedItems.push(listElem);
                }
            });
            return matchedItems.concat(unmatchedItems);
        } else {
            return null;
        }
    }

    getAttributeListWithMultipleTables = (
        groupedAttMatchStatuses: {[name: string]: PatternMatchAttribute[]}, 
        patternAttributeIndex: number, 
        currentlySelectedAttribute: PatternMatchAttribute) => {
        return Object.keys(groupedAttMatchStatuses).map((tableName, index) => {
            const isTableActive = tableName === currentlySelectedAttribute.table.tableName;
            return (
                <li key={index} className="dropdown dropend">
                    <a className={"dropdown-item dropdown-toggle dropdown-nested-level" + (isTableActive ? " active" : "")}
                        id={`ma-${patternAttributeIndex}-list-${index}`}
                        href="#"
                        data-mandatory="true" 
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false">
                            <div>
                                <i className="fas fa-table me-2" />{tableName}
                            </div>
                    </a>
                    <ul className="dropdown-menu dropdown-nested-level-ul"
                        aria-labelledby={`ma-${patternAttributeIndex}-list-${index}`}
                        data-patternatt-index={patternAttributeIndex}
                        data-table-index={index}
                        >
                        {this.getAttributeListWithSingleTable(groupedAttMatchStatuses[tableName], patternAttributeIndex, currentlySelectedAttribute)}
                    </ul>
                </li>
            )
        })
    }

    getAttributeListWithSingleTable = (attMatchStatus: PatternMatchAttribute[], patternAttributeIndex: number, currentlySelectedAttribute: PatternMatchAttribute) => {
        return attMatchStatus.map((matchAttr, listIndex) => {
            const thisAttribute = matchAttr.table.attr[matchAttr.attributeIndex]
            const isActive = currentlySelectedAttribute.table.idx === matchAttr.table.idx 
                && thisAttribute.attnum === currentlySelectedAttribute.attributeIndex + 1;
            return (
                <li key={listIndex}>
                    <a className={"dropdown-item small" + (isActive ? " active" : "")}
                        href="#"
                        data-mandatory="true"
                        data-pattern-att-idx={patternAttributeIndex}
                        data-list-idx={listIndex}
                        data-match-idx={matchAttr.matchIndex}
                        onClick={this.props.onSelectedAttributeIndicesChange}>
                        {thisAttribute.attname}
                    </a>
                </li>
            )
        });
    }

    mandatoryAttributeDropdownGroup = (thisPatternMatchResult: PatternMatchResult) => {
        const context: DBSchemaContextInterface = this.context;
        if (!thisPatternMatchResult || !thisPatternMatchResult.mandatoryAttributes) return null;
        const mandatorySelectedAttributes = context.selectedAttributesIndices[0];
        
        // Group attributes by table name
        let attributeGroupElement = thisPatternMatchResult.mandatoryAttributes.map((attributeMatchStatus, patternAttributeIndex) => {
            // For each match result of each mandatory attribute, group them by their origin table
            const patternMatchGroupedByTable: {[name: string]: PatternMatchAttribute[]} = groupBySecondLevelAttr(attributeMatchStatus, "table", "tableName");
            const selectedTable = context.selectedAttributesIndices[0][patternAttributeIndex].table;
            const selectedAttribute = selectedTable.attr[context.selectedAttributesIndices[0][patternAttributeIndex].attributeIndex]
            // If there are more than one table involved, render the attribute list grouped by table names
            if (Object.entries(patternMatchGroupedByTable).length > 1) {
                const thisAttributeDropdownItemList = this.getAttributeListWithMultipleTables(
                    patternMatchGroupedByTable, patternAttributeIndex, mandatorySelectedAttributes[patternAttributeIndex]);
                return (
                <div className="btn-group ms-2 attribute-list-dropdown" key={patternAttributeIndex}>
                    <button className="btn btn-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        ma{patternAttributeIndex}: {selectedAttribute.attname}
                    </button>
                    <ul className="dropdown-menu">
                        {thisAttributeDropdownItemList}
                    </ul>
                </div>
                );
            } else {
                // Otherwise, render the attribute list directly
                const thisAttributeDropdownItemList = this.getAttributeListWithSingleTable(
                    attributeMatchStatus, patternAttributeIndex, mandatorySelectedAttributes[patternAttributeIndex]);
                return (
                    <div className="btn-group ms-2" key={patternAttributeIndex}>
                        <button className="btn btn-secondary btn-sm dropdown-toggle attribute-list-dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            ma{patternAttributeIndex}: {selectedAttribute.attname}
                        </button>
                        <ul className="dropdown-menu">
                            {thisAttributeDropdownItemList}
                        </ul>
                    </div>
                );
            }
        });

        return attributeGroupElement
    }

    getInnerTextForAttributes = (params: VisParam[]) => {
        if (params.length === 0) {
            return <div>
                No parameter found
            </div>
        }
        return (
            <div>
            { 
                params.map((param, i) => {
                    return (
                        <div className="ms-2" key={i}>
                            Parameter {i}
                            {param.scalar ? <div className="ms-2">Is scalar</div> : null}
                            {param.type ? <div className="ms-2">Is type {param.type}</div> : null}
                        </div>
                    );
                })
            }
            </div>
        )
    }

    findSpecifiedReadon = (patternMatchResult: PatternMatchResult, mismatchReason: PATTERN_MISMATCH_REASON_TYPE) => {
        if (patternMatchResult.mismatchReason) {
            if (patternMatchResult.mismatchReason.reason === mismatchReason) {
                console.log(patternMatchResult)
                return true;
            }
        }
        return false;
    }

    parsedVisPattern = () => {
        if (!this.props.expanded) return null;
        const context: DBSchemaContextInterface = this.context;
        const thisPatternSchema = context.visSchema[context.selectedPatternIndex];
        const thisPatternMatchResult = context.visSchemaMatchStatus[context.selectedPatternIndex];
        let minCount, maxCount;
        const patternSchemaTextSeparated = Object.keys(thisPatternSchema).map((key, ki) => {
            
            let keyName: string, innerText: string | JSX.Element, confirmationStatus: CONFIRMATION_STATUS = CONFIRMATION_STATUS.UNKNOWN;
            const schemaContent = thisPatternSchema[key];
            switch (key) {
                case "name":
                    keyName = undefined;
                    innerText = undefined;
                    break;
                case "type":
                    keyName = "Schema type";
                    innerText = visSchemaTypeToReadableString(schemaContent);
                    if (thisPatternMatchResult.mismatchReason) {
                        if (thisPatternMatchResult.mismatchReason.reason === PATTERN_MISMATCH_REASON_TYPE.NO_SUITABLE_RELATION) {
                            confirmationStatus = CONFIRMATION_STATUS.NO;
                        }
                    }
                    break;
                case "localKey":
                    keyName = "Number of keys in Relation 1";
                    minCount = thisPatternSchema.localKey.minCount;
                    maxCount = thisPatternSchema.localKey.maxCount;
                    innerText = minCount + " ≤ " + "N" + (maxCount ? ("≤ " + maxCount) : "");
                    if (this.findSpecifiedReadon(thisPatternMatchResult, PATTERN_MISMATCH_REASON_TYPE.KEY_COUNT_MISMATCH)) {
                        confirmationStatus = CONFIRMATION_STATUS.NO
                    }
                    break;
                case "foreignKey":
                    if (thisPatternSchema.type !== VISSCHEMATYPES.BASIC) {
                        minCount = thisPatternSchema.foreignKey.minCount;
                        maxCount = thisPatternSchema.foreignKey.maxCount;
                    }
                    keyName = "Number of keys in Relation 2";
                    innerText = minCount + " ≤ " + "N " + (maxCount ? ("≤ " + maxCount) : "");
                    break;
                case "mandatoryParameters":
                    keyName = "Mandatory parameters";
                    innerText = this.getInnerTextForAttributes(thisPatternSchema.mandatoryParameters);
                    break;
                case "optionalParameters":
                    keyName = "Optional parameters";
                    innerText = this.getInnerTextForAttributes(thisPatternSchema.optionalParameters);
                    break;
                case "template":
                    keyName = undefined;
                    innerText = undefined;
                    break;
                case "reflexive":
                    if (thisPatternSchema.type === VISSCHEMATYPES.MANYMANY) {
                        keyName = "Reflexivity"
                        innerText = thisPatternSchema.reflexive.toString();
                    }
                    break;
                case "complete":
                    if (thisPatternSchema.type === VISSCHEMATYPES.WEAKENTITY) {
                        keyName = "Completeness"
                        innerText = thisPatternSchema.complete.toString();
                    }
                    break;
                default:
                    keyName = key;
                    innerText = JSON.stringify(schemaContent);
            }
            const schemaText = thisPatternSchema[key];
            if (!keyName) {
                return null;
            }
            else {
                // let confirmationIcon = <i />;
                // if (confirmationStatus === CONFIRMATION_STATUS.NO) {
                //     confirmationIcon = (<i className="fas fa-times text-danger ms-1" />)
                // } else {
                //     confirmationIcon = <i />;   
                // }
                return (
                    <div key={ki}>
                        <div>
                            {keyName}: {innerText} 
                            {/* <span>
                            {confirmationIcon} 
                            </span> */}
                        </div>

                    </div>
                );
            }
        })
        return (
            <div>
                {patternSchemaTextSeparated}
                <button type="button" className="btn btn-primary" onClick={this.onClickFilterDatasetButton}>Filter dataset</button>
            </div>
        )
    }

    onClickFilterDatasetButton = () => {
        this.setState({
            showFilterSelectModal: true
        })
    }

    onCloseShowFilterSelectModal = () => {
        this.setState({
            showFilterSelectModal: false
        })
    }

    render() {
        const context: DBSchemaContextInterface = this.context;
        const thisTable = context.allEntitiesList[context.selectedFirstTableIndex];
        const patternIndex = context.selectedPatternIndex;
        const thisPattern = context.visSchema[patternIndex];
        if (context.selectedFirstTableIndex < 0) {
            return (
                <div className="d-flex justify-content-center">
                    <div>
                        <em>Select a table to continue...</em>
                    </div>       
                </div>
            )
        } else {
            const thisPatternMatchResult: PatternMatchResult = patternIndex < 0 ? undefined : context.visSchemaMatchStatus[patternIndex];

            return (
                <div>
                    {this.state.showFilterSelectModal ? 
                        <FilterSelectModal 
                            onClose={this.onCloseShowFilterSelectModal} /> 
                        : null}
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            {context.allEntitiesList[context.selectedFirstTableIndex].tableName}
                        </div>
                        <div className="dropdown">
                            <a className="btn btn-primary dropdown-toggle" href="#" role="button" id="matched-schema-list-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                {thisPattern ? thisPattern.name : "Select Pattern..."}
                            </a>

                            <ul className="dropdown-menu" id="matched-schema-list-dropdown-list" aria-labelledby="matched-schema-list-dropdown">
                                {this.allSchemasDropdownItem()}
                            </ul>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="row">
                            <div className="col">
                                Mandatory attributes:
                                {this.mandatoryAttributeDropdownGroup(thisPatternMatchResult)}
                            </div>
                        </div>
                        <div className="row">
                        <div className="col">
                                Optional attributes:
                            </div>
                        </div>
                    </div>
                    <div>
                        {this.parsedVisPattern()}
                    </div>
                </div>
            );
        }
    }
}
SchemaExplorer.contextType = DBSchemaContext;

export class AppMainCont extends React.Component<AppMainContProps, AppMainContStates> {
    constructor(props) {
        super(props);
        this.state = {
            explorerExpanded: false
        }
    }

    onExpansionClick = () => {
        this.setState({
            explorerExpanded: !this.state.explorerExpanded
        })
    }

    render() {
        if (this.props.load) {
            return (<div>Loading...</div>);
        }
        const shrinkTag = () => {
            if (context.selectedFirstTableIndex < 0) return null;
            else return (
                <div className="pt-1 pb-2" onClick={this.onExpansionClick} style={{cursor: "pointer"}}>
                    <div className=" d-flex justify-content-center align-items-center">
                        <div className="small me-2">
                            {this.state.explorerExpanded ? "Shrink" : "More options..."}
                        </div>
                        <i className={"fas fa-angle-up mr-2"} />
                        <i className={"fas fa-angle-down"} />
                        {/* {this.state.explorerExpanded ? (<i className={"fas fa-angle-up"} />) : (<i className={"fas fa-angle-down"} />)} */}
                    </div>
                </div>
            ) 
        }
        const context: DBSchemaContextInterface = this.context;
        return (
            <div className="col-8 col-lg-9">
                <div className="row">
                    <div className="col">
                        <div className="row pt-2 pb-1" style={{borderBottom: "2px solid black", minHeight: this.state.explorerExpanded ? "50vh" : ""}}>
                            <div className="col d-flex flex-column justify-content-between">
                                <SchemaExplorer 
                                    expanded={this.state.explorerExpanded}
                                    onExpansionClick={this.onExpansionClick}
                                    onVisPatternIndexChange={this.props.onVisPatternIndexChange}
                                    onSelectedAttributeIndicesChange={this.props.onSelectedAttributeIndicesChange} />
                                {shrinkTag()}
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                {
                                    context.selectedFirstTableIndex >= 0 && context.selectedPatternIndex >= 0 ? 
                                    <Visualiser 
                                        rerender={this.props.rerender} />
                                        : null
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
AppMainCont.contextType = DBSchemaContext;

const groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};

const groupBySecondLevelAttr = function(xs, key1, key2) {
    return xs.reduce(function(rv, x) {
      (rv[x[key1][key2]] = rv[x[key1][key2]] || []).push(x);
      return rv;
    }, {});
};