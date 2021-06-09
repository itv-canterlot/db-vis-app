import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { AppMainContProps, AppMainContStates, SchemaExplorerProps } from './ts/components';
import { Visualiser } from './Visualiser';

class SchemaExplorer extends React.Component<SchemaExplorerProps, {}> {
    constructor(props) {
        super(props);
    }

    onPatternSelectionDropdownClick = (e: React.BaseSyntheticEvent) => {
        const selectedIndex = parseInt(e.target.getAttribute("data-index"));
        if (!selectedIndex) return;
        if (selectedIndex === this.props.selectedTableIndex) return;

        this.props.onVisPatternIndexChange(selectedIndex);
    }

    getMatchCount = (visStatus) => visStatus.reduce(
        (acc, curr) => {
            if (curr) return acc + 1; else return acc;
        }, 0);

    matchedSchemaDropdownItems = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        if (this.props.visSchemaMatchStatus) {
            return this.props.visSchemaMatchStatus.map((status, idx) => {
                if (status) {
                    const matchedSchema = dbSchemaContext.visSchema[idx];
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

    render() {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const thisTable = dbSchemaContext.allEntitiesList[this.props.selectedTableIndex];
        const patternIndex = dbSchemaContext.selectedPatternIndex;
        const thisPattern = dbSchemaContext.visSchema[patternIndex];
        if (this.props.selectedTableIndex < 0) {
            return (
                <div className="d-flex justify-content-center">
                    <div>
                        <em>Select a table to continue...</em>
                    </div>       
                </div>
            )
        } else {
            const thisPatternMatchStatus = this.props.visSchemaMatchStatus[patternIndex];
            const mandatoryAttributeDropdownGroup = () => {
                if (!thisPatternMatchStatus || !thisPatternMatchStatus.mandatoryAttributes) return null;
                const mandatorySelectedAttributesIndices = dbSchemaContext.selectedAttributesIndices[0];
                return thisPatternMatchStatus.mandatoryAttributes.map((attMatchStatus, idx) => {
                    // Outer map: for each mandatory parameter in the pattern
                    const thisAttributeDropdownItemList = attMatchStatus.map((attIndex, listIndex) => {
                        // Inner map: for each matched attribute for each mandatory parameter
                        const thisAttribute = thisTable.attr[attIndex]
                        return (
                            <li key={listIndex}>
                                <a className={"dropdown-item small" + (listIndex === mandatorySelectedAttributesIndices[idx] ? " active" : "")} 
                                    href="#"
                                    data-mandatory="true"
                                    data-pattern-att-idx={idx}
                                    data-list-idx={listIndex}
                                    onClick={this.props.onSelectedAttributeIndicesChange}>
                                    {thisAttribute.attname}
                                </a>
                            </li>
                        )
                    });
                    // This bit was brutally confusing
                    const thisAttrPatternStatus = thisPatternMatchStatus.mandatoryAttributes[idx];

                    return (
                        <div className="btn-group ms-2" key={idx}>
                            <button className="btn btn-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                ma{idx}: {thisTable.attr[thisAttrPatternStatus[mandatorySelectedAttributesIndices[idx]]].attname}
                            </button>
                            <ul className="dropdown-menu">
                                {thisAttributeDropdownItemList}
                            </ul>
                        </div>
                    );
                });
            }

            return (
                <div>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            {dbSchemaContext.allEntitiesList[this.props.selectedTableIndex].tableName}
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
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        console.log(this.props.visSchemaMatchStatus)
        console.log(this.props.selectedAttributesIndices)
        return (
            <div className="col-8 col-lg-9">
                <div className="row">
                    <div className="col">
                        <div className="row py-2" style={{borderBottom: "2px solid black"}}>
                            <div className="col">
                                <SchemaExplorer 
                                    expanded={true} 
                                    selectedTableIndex={this.props.selectedTableIndex} 
                                    visSchemaMatchStatus={this.props.visSchemaMatchStatus}
                                    onVisPatternIndexChange={this.props.onVisPatternIndexChange}
                                    onSelectedAttributeIndicesChange={this.props.onSelectedAttributeIndicesChange} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                {
                                    this.props.selectedTableIndex >= 0 ? 
                                    <Visualiser 
                                    selectedTableIndex={this.props.selectedTableIndex}
                                    selectedAttributesIndices={this.props.selectedAttributesIndices}
                                    visSchemaMatchStatus={this.props.visSchemaMatchStatus}
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