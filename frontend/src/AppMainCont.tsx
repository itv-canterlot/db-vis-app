import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { AppMainContProps, AppMainContStates, SchemaExplorerProps } from './ts/components';
import { PatternMatchAttribute, PatternMatchResult } from './ts/types';
import { Visualiser } from './Visualiser';

class SchemaExplorer extends React.Component<SchemaExplorerProps, {}> {
    constructor(props) {
        super(props);
    }

    onPatternSelectionDropdownClick = (e: React.BaseSyntheticEvent) => {
        const context: DBSchemaContextInterface = this.context;
        const selectedIndex = parseInt(e.target.getAttribute("data-index"));
        if (!selectedIndex) return;
        if (selectedIndex === context.selectedFirstTableIndex) return;

        this.props.onVisPatternIndexChange(selectedIndex);
    }

    getMatchCount = (visStatus) => visStatus.reduce(
        (acc, curr) => {
            if (curr) return acc + 1; else return acc;
        }, 0);

    matchedSchemaDropdownItems = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        if (dbSchemaContext.visSchemaMatchStatus) {
            return dbSchemaContext.visSchemaMatchStatus.map((status, idx) => {
                if (status) {
                    const matchedSchema = status.vs;
                    let classList = "dropdown-item";
                    if (dbSchemaContext.selectedPatternIndex === idx) classList += " active"
                    return (
                        <li key={idx}>
                            <a className={classList} href="#" data-index={idx} onClick={this.onPatternSelectionDropdownClick}>
                                {matchedSchema.name}
                            </a>
                        </li>
                    );
                }
            })
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
            const thisPatternMatchResult: PatternMatchResult = context.visSchemaMatchStatus[patternIndex];
            const mandatoryAttributeDropdownGroup = () => {
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

            return (
                <div>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            {context.allEntitiesList[context.selectedFirstTableIndex].tableName}
                        </div>
                        <div className="dropdown">
                            <a className="btn btn-primary dropdown-toggle" href="#" role="button" id="matched-schema-list-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                {thisPattern ? thisPattern.name : "Select Pattern..."}
                            </a>

                            <ul className="dropdown-menu" id="matched-schema-list-dropdown-list" aria-labelledby="matched-schema-list-dropdown">
                                {this.matchedSchemaDropdownItems()}
                            </ul>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="row">
                            <div className="col">
                                Mandatory attributes:
                                {mandatoryAttributeDropdownGroup()}
                            </div>
                        </div>
                        <div className="row">
                        <div className="col">
                                Optional attributes:
                            </div>
                        </div>
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
    }

    render() {
        if (this.props.load) {
            return (<div>Loading...</div>);
        }
        const context: DBSchemaContextInterface = this.context;
        return (
            <div className="col-8 col-lg-9">
                <div className="row">
                    <div className="col">
                        <div className="row py-2" style={{borderBottom: "2px solid black"}}>
                            <div className="col">
                                <SchemaExplorer 
                                    expanded={true} 
                                    onVisPatternIndexChange={this.props.onVisPatternIndexChange}
                                    onSelectedAttributeIndicesChange={this.props.onSelectedAttributeIndicesChange} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                {
                                    context.selectedFirstTableIndex >= 0 ? 
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