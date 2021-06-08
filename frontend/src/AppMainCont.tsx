import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { AppMainContProps, SchemaExplorerProps } from './ts/components';
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
        // this.props.onVisPatternIndexChange
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
            return (
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
            );
        }
    }
}
SchemaExplorer.contextType = DBSchemaContext;

export class AppMainCont extends React.Component<AppMainContProps, {}> {
    render() {
        if (this.props.load) {
            return (<div>Loading...</div>);
        }
        const dbSchemaContext: DBSchemaContextInterface = this.context;
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
                                    onVisPatternIndexChange={this.props.onVisPatternIndexChange} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <Visualiser selectedTableIndex={this.props.selectedTableIndex} visSchemaMatchStatus={this.props.visSchemaMatchStatus} selectedPattern={null} rerender={this.props.rerender} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
AppMainCont.contextType = DBSchemaContext;