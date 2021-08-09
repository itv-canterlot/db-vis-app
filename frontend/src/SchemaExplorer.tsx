import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { SchemaExplorerProps, SchemaExplorerStates } from './ts/components';
import { CONFIRMATION_STATUS, PatternMatchAttribute, PatternMatchResult, PATTERN_MISMATCH_REASON_TYPE, RelationNode, VisParam, VISSCHEMATYPES, visSchemaTypeToReadableString } from './ts/types';
import { getDatasetEntryCountStatus } from './DatasetUtils';
import { groupBySecondLevelAttr } from './AppMainCont';

export class SchemaExplorer extends React.Component<SchemaExplorerProps, SchemaExplorerStates> {
    constructor(props) {
        super(props);
    }

    onPatternSelectionDropdownClick = (e: React.BaseSyntheticEvent) => {
        const context: DBSchemaContextInterface = this.context;
        const selectedIndex = parseInt(e.target.getAttribute("data-index"));
        if (selectedIndex === context.selectedPatternIndex)
            return;
        if (context.visSchemaMatchStatus[selectedIndex].length === 0)
            return;

        this.props.onVisPatternIndexChange(selectedIndex);
    };

    onResultIndexInPatternClick = (e: React.BaseSyntheticEvent) => {
        const context: DBSchemaContextInterface = this.context;
        const selectedIndex = parseInt(e.target.getAttribute("data-pattern-index"));
        if (selectedIndex === context.selectedMatchResultIndexInPattern)
            return;

        this.props.onMatchResultIndexChange(selectedIndex);
    };

    getMatchCount = (visStatus) => visStatus.reduce(
        (acc, curr) => {
            if (curr)
                return acc + 1; else
                return acc;
        }, 0);

    allSchemasDropdownItem = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const patternMatchResult = dbSchemaContext.visSchemaMatchStatus;
        if (dbSchemaContext.visSchema) {
            let matchedItems = [], unmatchedItems = [];
            matchedItems.push((
                <li key={-1}>
                    <h6 className="dropdown-header">Successfully matched patterns</h6>
                </li>
            ));

            // if (this.props.expanded) {
            unmatchedItems.push((
                <li key={-3}><hr className="dropdown-divider" /></li>
            ));
            unmatchedItems.push((
                <li key={-2} onClick={(e) => e.preventDefault()}>
                    <h6 className="dropdown-header">Unmatched patterns</h6>
                </li>
            ));
            // }
            // Separate matched and unmatched items?
            dbSchemaContext.visSchema.map((visSchema, idx) => {
                const schemaMatchResult = patternMatchResult ? patternMatchResult[idx] : undefined;
                // if (!schemaMatchResult || !schemaMatchResult.some(result => result.matched)) {
                //     return;
                // }
                let classList = "dropdown-item";
                if (dbSchemaContext.selectedPatternIndex === idx)
                    classList += " active";
                const listElem = (
                    <li key={idx}>
                        <a className={classList} href="#" data-index={idx} onClick={this.onPatternSelectionDropdownClick}>
                            {visSchema.name}
                        </a>
                    </li>
                );

                if (schemaMatchResult && schemaMatchResult.some(result => result.matched)) {
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
    };

    getAttributeListWithMultipleTables = (
        groupedAttMatchStatuses: { [name: string]: PatternMatchAttribute[]; },
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
            );
        });
    };

    getAttributeListWithSingleTable = (attMatchStatus: PatternMatchAttribute[], patternAttributeIndex: number, currentlySelectedAttribute: PatternMatchAttribute) => {
        return attMatchStatus.map((matchAttr, listIndex) => {
            const thisAttribute = matchAttr.table.attr[matchAttr.attributeIndex];
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
            );
        });
    };

    relationNodeDropdownGroup = (thisPatternMatchResultGroup: PatternMatchResult[]) => {
        const context: DBSchemaContextInterface = this.context;
        if (!thisPatternMatchResultGroup)
            return null;
        const currentlySelectedPatternMatchResult = thisPatternMatchResultGroup[context.selectedMatchResultIndexInPattern];

        const getRelReadableText = (selectedRelation: RelationNode) => {
            if (!selectedRelation) {
                return "";
            }
            return selectedRelation.parentEntity.tableName + "↔" + selectedRelation.childRelations.map(cr => cr.table.tableName).join("/");
        };

        let patternMatchSelections = thisPatternMatchResultGroup.map((patternMatchResult, patternMatchSelIndex) => {
            const selectedRelation = patternMatchResult.responsibleRelation;
            if (!selectedRelation || !patternMatchResult.matched)
                return;
            let relTypeTip;
            switch (selectedRelation.type) {
                case VISSCHEMATYPES.WEAKENTITY:
                    relTypeTip = (
                        <div className="type-tip bg-tip-we">
                            Weak entity
                        </div>
                    );
                    break;
                case VISSCHEMATYPES.MANYMANY:
                    relTypeTip = (
                        <div className="type-tip bg-tip-junc">
                            Many-to-many
                        </div>
                    );
                    break;
                case VISSCHEMATYPES.SUBSET:
                    relTypeTip = (
                        <div className="type-tip bg-tip-subset">
                            Subset
                        </div>
                    );
                    break;
                case VISSCHEMATYPES.ONEMANY:
                    relTypeTip = (
                        <div className="type-tip bg-tip-onemany">
                            One-to-many
                        </div>
                    );
                    break;
                default:
                    break;
            }

            // If there are more than one table involved, render the attribute list grouped by table names
            return (
                <li key={patternMatchSelIndex}>
                    <a className="dropdown-item" href="#" data-pattern-index={patternMatchSelIndex} onClick={this.onResultIndexInPatternClick}>
                        {getRelReadableText(selectedRelation)}
                    </a>
                </li>
            );
        });

        if (patternMatchSelections.length === 0 || (patternMatchSelections.length === 1 && !patternMatchSelections[0])) {
            return (
                <div className="btn-group ms-2 attribute-list-dropdown">
                    <button className="btn btn-secondary btn-sm dropdown-toggle disabled" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <em>Not applicable</em>
                    </button>
                </div>
            );
        }

        return (
            <div className="btn-group ms-2 attribute-list-dropdown">
                <button className="btn btn-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {getRelReadableText(currentlySelectedPatternMatchResult.responsibleRelation)}
                </button>
                <ul className="dropdown-menu">
                    {patternMatchSelections}
                </ul>
            </div>
        );
    };

    mandatoryAttributeDropdownGroup = (thisPatternMatchResult: PatternMatchResult) => {
        const context: DBSchemaContextInterface = this.context;
        if (!thisPatternMatchResult || !thisPatternMatchResult.mandatoryAttributes)
            return null;
        const mandatorySelectedAttributes = context.selectedAttributesIndices[0];

        // Group attributes by table name
        let attributeGroupElement = thisPatternMatchResult.mandatoryAttributes.map((attributeMatchStatus, patternAttributeIndex) => {
            // For each match result of each mandatory attribute, group them by their origin table
            const patternMatchGroupedByTable: { [name: string]: PatternMatchAttribute[]; } = groupBySecondLevelAttr(attributeMatchStatus, "table", "tableName");
            const selectedTable = context.selectedAttributesIndices[0][patternAttributeIndex].table;
            const selectedAttribute = selectedTable.attr[context.selectedAttributesIndices[0][patternAttributeIndex].attributeIndex];
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

        return attributeGroupElement;
    };

    getInnerTextForAttributes = (params: VisParam[]) => {
        if (params.length === 0) {
            return <div>
                No parameter found
            </div>;
        }
        return (
            <div>
                {params.map((param, i) => {
                    return (
                        <div className="ms-2" key={i}>
                            Parameter {i}
                            {param.scalar ? <div className="ms-2">Is scalar</div> : null}
                            {param.type ? <div className="ms-2">Is type {param.type}</div> : null}
                        </div>
                    );
                })}
            </div>
        );
    };

    findSpecifiedReadon = (patternMatchResult: PatternMatchResult, mismatchReason: PATTERN_MISMATCH_REASON_TYPE) => {
        if (patternMatchResult.mismatchReason) {
            if (patternMatchResult.mismatchReason.reason === mismatchReason) {
                return true;
            }
        }
        return false;
    };

    parsedVisPattern = () => {
        if (!this.props.expanded)
            return null;
        const context: DBSchemaContextInterface = this.context;
        const thisPatternSchema = context.visSchema[context.selectedPatternIndex];
        const thisPatternMatchResult = context.visSchemaMatchStatus[context.selectedPatternIndex][context.selectedMatchResultIndexInPattern];
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
                        confirmationStatus = CONFIRMATION_STATUS.NO;
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
                        keyName = "Reflexivity";
                        innerText = thisPatternSchema.reflexive.toString();
                    }
                    break;
                case "complete":
                    if (thisPatternSchema.type === VISSCHEMATYPES.WEAKENTITY) {
                        keyName = "Completeness";
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
        });
        return (
            <div>
                {patternSchemaTextSeparated}
                <button type="button" className="btn btn-primary" onClick={this.onClickFilterDatasetButton}>Filter dataset</button>
            </div>
        );
    };

    onClickFilterDatasetButton = (e: React.MouseEvent) => {
        this.props.onClickShowFilterSelectModal(e);
    };

    onClickRelPillForHierachy = (e: React.BaseSyntheticEvent) => {
        const context: DBSchemaContextInterface = this.context;
        const selectedRelationsIndices = context.selectedRelationsIndices;
        const clickedBubblePatternIndex = selectedRelationsIndices[parseInt(e.currentTarget.getAttribute("data-rel-index"))];
        console.log(clickedBubblePatternIndex);

        // Process the new relation hierachy array
        let newHiearchyArray = context.relHierachyIndices;
        let [mainPatternIndex, subordinatePatternIndex, auxillaryPatternIndex] = newHiearchyArray;
        if (mainPatternIndex.length === 0) {
            mainPatternIndex.push(clickedBubblePatternIndex);
            // TODO
            this.props.onRelHierachyChange(newHiearchyArray);
            return;
        }

        const
            clickedIndexInMain = mainPatternIndex.findIndex(val => val === clickedBubblePatternIndex),
            clickedInSubordinate = subordinatePatternIndex.findIndex(val => val === clickedBubblePatternIndex),
            clickedInAuxillary = auxillaryPatternIndex.findIndex(val => val === clickedBubblePatternIndex);

        if (clickedIndexInMain >= 0) {
            // Clicked index in main, remove
            mainPatternIndex.splice(clickedIndexInMain, 1);
            this.props.onRelHierachyChange(newHiearchyArray);
            return;
        }
        if (clickedInSubordinate >= 0) {
            // Clicked index in main, remove
            subordinatePatternIndex.splice(clickedInSubordinate, 1);
            this.props.onRelHierachyChange(newHiearchyArray);
            return;
        } else {
            subordinatePatternIndex.push(clickedBubblePatternIndex);
            this.props.onRelHierachyChange(newHiearchyArray);
            return;
        }
        // if (clickedInAuxillary >= 0) {
        //     // Clicked index in main, remove
        //     auxillaryPatternIndex.splice(clickedInAuxillary, 1);
        //     return;
        // }
    };

    render() {
        const context: DBSchemaContextInterface = this.context;
        const patternIndex = context.selectedPatternIndex;
        const matchIndex = context.selectedMatchResultIndexInPattern;
        const thisPattern = context.visSchema ? context.visSchema[patternIndex] : undefined;

        const schemaDropdown = (
            <div className="dropdown">
                <a className="btn btn-primary dropdown-toggle" href="#" role="button" id="matched-schema-list-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    {thisPattern ? thisPattern.name : "Select Pattern..."}
                </a>

                <ul className="dropdown-menu" id="matched-schema-list-dropdown-list" aria-labelledby="matched-schema-list-dropdown">
                    {this.allSchemasDropdownItem()}
                </ul>
            </div>
        );

        const selectedRelationsPills = () => {
            const context: DBSchemaContextInterface = this.context;
            return (
                <div>
                    {context.selectedRelationsIndices.map((ind, key) => {
                        const thisRel = context.relationsList.find(rel => rel.index === ind);
                        if (!thisRel)
                            return;
                        return (
                            <div key={key} className="badge bg-info d-inline-flex me-2 no-select cursor-pointer"
                                data-rel-index={key} 
                                onClick={this.onClickRelPillForHierachy}
                                >
                                <div>
                                    {thisRel.parentEntity.tableName} ➔ {thisRel.childRelations.map(cr => cr.table.tableName).join("/")}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        };


        if (context.selectedEntitiesIndices.length === 0 && context.selectedRelationsIndices.length === 0) {
            return (
                <div className="d-flex justify-content-center">
                    <div>
                        <em>Select something to continue...</em>
                    </div>
                </div>
            );
        } else if (context.selectedEntitiesIndices.length !== 0) {
            const thisPatternMatchResultGroup: PatternMatchResult[] = (patternIndex < 0) ? undefined : context.visSchemaMatchStatus[patternIndex];

            if (!thisPatternMatchResultGroup)
                return null;
            return (
                <div>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            {context.allEntitiesList[context.selectedEntitiesIndices[0]].tableName}
                        </div>
                        {schemaDropdown}
                    </div>
                    <div className="mt-2">
                        <div className="row">
                            <div className="col">
                                Relation:
                                    {this.relationNodeDropdownGroup(thisPatternMatchResultGroup)}
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                Mandatory attributes:
                                {this.mandatoryAttributeDropdownGroup(thisPatternMatchResultGroup[context.selectedMatchResultIndexInPattern])}
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
        } else {
            const thisPatternMatchResultGroup: PatternMatchResult[] = (patternIndex < 0) ? undefined : context.visSchemaMatchStatus[patternIndex];
            const dataLength = context.data === undefined ? 0 : context.data.length;
            return (
                <div>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            Existing entry length: <span className="badge bg-secondary ms-1">{dataLength}</span>
                        </div>
                        {schemaDropdown}
                    </div>
                    <div className="mt-2 row g-0 ps-2 pe-2">
                        <div className="col">
                            <div className="row g-0">
                                <div className="col d-flex">
                                    <div>
                                        Relations:
                                    </div>
                                    {selectedRelationsPills()}
                                </div>
                            </div>

                            <div className="row g-0">
                                <div className="col">
                                    {JSON.stringify(context.relHierachyIndices)}
                                </div>
                            </div>


                            <div className="row g-0">
                                <div className="col">
                                    <div>
                                        {JSON.stringify(context.relHierachyIndices)}
                                    </div>
                                </div>
                            </div>
                            <div className="row g-0">
                                <div className="col">
                                    Mandatory attributes:
                                    {thisPatternMatchResultGroup === undefined ? null : this.mandatoryAttributeDropdownGroup(thisPatternMatchResultGroup[context.selectedMatchResultIndexInPattern])}
                                </div>
                            </div>
                            <div className="row g-0">
                                <div className="col">
                                    Optional attributes:
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row g-0 ps-2 pe-2">
                        <div className="col">
                            <div>
                                Statuses:
                            </div>
                            <div>
                                dataLoaded: {JSON.stringify(context.dataLoaded)}
                            </div>
                            <div>
                                Entry count: {thisPatternMatchResultGroup ? JSON.stringify(thisPatternMatchResultGroup[0].keyCountMatched) : "N/A"}
                            </div>
                            <div>
                                New unique key count check: {thisPatternMatchResultGroup ?
                                    JSON.stringify(getDatasetEntryCountStatus(
                                        context.data, context.visSchema[context.selectedPatternIndex],
                                        context.relationsList[context.relHierachyIndices[0][0]])) :
                                    "N/A"}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }
}
SchemaExplorer.contextType = DBSchemaContext;