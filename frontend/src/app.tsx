import * as React from 'react';
import ReactDOM = require('react-dom');

import {Attribute, VisSchema, VISSCHEMATYPES} from './ts/types'
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { Visualiser } from './Visualiser';
import { EntitySelector } from './EntitySelector';

import * as ComponentTypes from './ts/components';
import * as Connections from './Connections';
import * as SchemaParser from './SchemaParser';

class Application extends React.Component<{}, ComponentTypes.ApplicationStates> {
    constructor(props) {
        super(props);

        this.state = {
            allEntitiesList: [],
            selectedTableIndex: -1,
            selectedAttributeIndex: -1,
            selectedForeignKeyIndex: -1,
            selectedFKAttributeIndex: -1,
            load: false,
            listLoaded: false,
            databaseLocation: "http://localhost:5432", // Placeholder
            showStartingTableSelectModal: false
        };
    }

    onClickShowStartingTableSelectModal = () => {
        this.setState({
            showStartingTableSelectModal: true
        });
    }

    onCloseShowStartingTableSelectModal = () => {
        this.setState({
            showStartingTableSelectModal: false
        });
    }

    isAttributeScalar = (att: Attribute) => {
        // TODO: use information_schema
    }

    TEMPcheckVisualisationPossibility = () => {
        if (this.state.relationsList === undefined) return;
        if (visSchema === undefined) return;

        // Check type of the relation
        let selectedEntity = this.state.allEntitiesList[this.state.selectedTableIndex];
        // TODO: implement other vis types
        
        // For demo: simple entity
        if ((!selectedEntity.hasOwnProperty("weakEntitiesIndices") || selectedEntity.weakEntitiesIndices.length === 0) && 
            (!selectedEntity.hasOwnProperty("isJunction") || !selectedEntity.isJunction)) {
            let pkAtts = selectedEntity.pk.columns.map(key => selectedEntity.attr[key.colPos].attname);
            Connections.getTableDistCounts(selectedEntity.tableName, pkAtts).then(distCountRes => {
                return Math.max(distCountRes.map(count => count.distinct_count));

            }).then(maxDistCount => {
                // TODO: colours not checked - need additional markup
                for (const schema of visSchema) {
                    if (schema.type === VISSCHEMATYPES.BASIC) {
                        // Count check
                        if (!(schema.keys.minCount <= maxDistCount)) continue;
                        if (schema.keys.maxCount !== undefined) {
                            if (!(schema.keys.maxCount >= maxDistCount)) continue;
                        }
                        
                        // Type check
                        // console.log(schema);
                    }
                    // For each schema, compare
                }
            });
        }
    }

    // Called when R1 is changed
    onTableSelectChange = (e) => {
        let tableIndex = parseInt(e.target.getAttribute("data-index"));
        let tableKey = parseInt(e.target.getAttribute("data-key"));

        if (tableIndex < 0) return;

        this.setState({
            selectedTableIndex: tableIndex,
            selectedAttributeIndex: -1,
            selectedForeignKeyIndex: -1,
            selectedFKAttributeIndex: -1,
            load: true
        }, () => {
            this.TEMPcheckVisualisationPossibility(); // TODO: major overhaul
        });
    }

    onAttributeSelectChange = (e) => {
        let attributeIndex = parseInt(e.target.getAttribute("data-index"));

        if (attributeIndex < 0) return;

        this.setState({
            selectedAttributeIndex: attributeIndex
        }, () => {
            this.checkVisualisationPossibility();
        });

    }

    onForeignKeySelectChange = (e) => {
        let fkIndex = parseInt(e.target.getAttribute("data-index"));

        if (fkIndex < 0) return;

        this.setState({
            selectedForeignKeyIndex: fkIndex
        }, () => {
            this.checkVisualisationPossibility();
        });
        
    }

    onFKAttributeSelectChange = (e) => {
        let attributeIndex = parseInt(e.target.getAttribute("data-index"));

        if (attributeIndex < 0) return;

        this.setState({
            selectedFKAttributeIndex: attributeIndex
        }, () => {
            this.checkVisualisationPossibility();
        });
        
    }

    getTableMetadata = () => {
        if (this.state.allEntitiesList.length !== 0) {
            return;
        }

        this.setState({
            load: true
        }, () => {
            let entitiesListPromise = Connections.getAllTableMetadata();


            Promise.resolve(entitiesListPromise).then(res => {
                let preprocessResult = SchemaParser.preprocessEntities(res);
                this.setState({
                    allEntitiesList: preprocessResult.tableList,
                    relationsList: preprocessResult.relationsList,
                    listLoaded: true
                });
            });
            
            this.setState({
                load: false
            });
        });
    }

    checkVisualisationPossibility = () => {
        return;
        // Check, based on state indexes, if it is possible to request data from the database
        // -- 1 -- A first entity and one of its attributes have been selected
        // if (this.state.selectedTableIndex >= 0 && this.state.selectedAttributeIndex >= 0) {
        //     // -- 2 -- A second entity/attribute pair have been selected
        //     if (this.state.selectedForeignKeyIndex >= 0 && this.state.selectedFKAttributeIndex >= 0) {
        //         // TODO
        //         return;
        //     } else {
        //         // Single attribute: bar chart (more to be implemented)
        //         // Check attribute data type
        //         let tableAttributes = this.state.allEntitiesList[this.state.selectedTableIndex].attr;
        //         let attributeEntry = tableAttributes[this.state.selectedAttributeIndex];
        //         let attributeTypeCat = attributeEntry.typcategory;
        //         let tableIndex = this.state.selectedTableIndex;
        //         if (attributeTypeCat === "N") {
        //             // TODO: Fitting the new table list
        //             // If it is a number, retrieve data from database
        //             fetch("http://localhost:3000/temp-data-table-name-fields", {
        //                 headers: {
        //                     'Accept': 'application/json',
        //                     'Content-Type': 'application/json'
        //                 },
        //                 method: "POST",
        //                 body: JSON.stringify({
        //                     "tableName": this.state.allEntitiesList[tableIndex].tableName,
        //                     "fields": [
        //                         attributeEntry.attname
        //                     ]
        //                 }),
        //             }).then(rawResponse => rawResponse.json())
        //             .then(data => {
        //                 console.log(data);
        //             })
        //         }
        //     }
        // } else {
        //     return;
        // }
    }

    async componentDidMount() {
        // Can even do some loading screen stuff here
        readVisSchemaJSON();
        this.getTableMetadata();
    }

    render() {
        return (
            <DBSchemaContext.Provider value={{allEntitiesList: this.state.allEntitiesList, relationsList: this.state.relationsList}}>
                {this.state.showStartingTableSelectModal ? 
                <StartingTableSelectModal 
                    onClose={this.onCloseShowStartingTableSelectModal} onTableSelectChange={this.onTableSelectChange} 
                    selectedTableIndex={this.state.selectedTableIndex}/> 
                : null}
                <div className="row g-0" id="app-wrapper">
                    <AppSidebar 
                        databaseLocation={this.state.databaseLocation}
                        onClickShowStartingTableSelectModal={this.onClickShowStartingTableSelectModal}
                        selectedTableIndex={this.state.selectedTableIndex} />
                    <AppMainCont />
                </div>
            </DBSchemaContext.Provider>

        );
    }
}

class StartingTableSelectModal extends React.Component<{onClose: React.MouseEventHandler, onTableSelectChange: Function, selectedTableIndex: number}, {}> {
    constructor(props) {
        super(props);
    }

    onTableSelectChange = (e) => {
        this.props.onTableSelectChange(e);
        this.props.onClose(e);
    }
    
    render() {
        return (
            <div className="modal d-block" role="dialog" id="starting-table-select-modal">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Select starting table...</h5>
                        <button type="button" className="close" aria-label="Close" onClick={this.props.onClose}>
                        <span aria-hidden="true"><i className="fas fa-times" /></span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <EntitySelector onTableSelectChange={this.onTableSelectChange} selectedTableIndex={this.props.selectedTableIndex} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={this.props.onClose}>Close</button>
                    </div>
                    </div>
                </div>
            </div>
        );
    }
}

class SidebarBubbleBlock extends React.Component<ComponentTypes.SidebarBubbleBlockProps, {}> {
    render() {
        const loadingBody =
            !this.props.isLoaded ? (
                <div className="row">
                    <div className="col overflow-ellipses overflow-hidden">
                        <em>Loading...</em>
                    </div>
                </div>
            ) : null;

        return (
            <div className="row ms-auto me-auto app-sidebar-bubbleblock p-2 mb-3" onClick={this.props.onClick}>
                <div className="col">
                    {this.props.headerElement}
                    {this.props.isLoaded ? this.props.bodyElement : loadingBody}
                </div>
            </div>
        )
    }
}

class AppSidebar extends React.Component<ComponentTypes.AppSidebarProps, {isLoaded?: boolean}> {
    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false
        }
    }

    componentDidMount() {
        if (this.state.isLoaded) return;
        this.setState({
            isLoaded: true
        })
    }
    render() {
        /* Bubble 1: database address */
        const databaseAddressHeader = (
        <div className="row">
            <div className="col">
                <i className="fas fa-database me-2" />Database address:
            </div>
        </div>);

        const databaseAddressBody = (
            <div className="row">
                <div className="col overflow-ellipses overflow-hidden">
                    <strong>
                        {this.props.databaseLocation}
                    </strong>
                </div>
            </div>
        );

        const dbSchemaContext: DBSchemaContextInterface = this.context;
        console.log(dbSchemaContext);

        /* Bubble 2: Selected table */
        const selectedTableBubbleHeader = (
            <div className="row">
                <div className="col">
                    <i className="fas fa-table me-2" />Starting table:
                </div>
            </div>);
    
            const selectedTableBubbleBody = (
                <div className="row">
                    <div className="col overflow-ellipses overflow-hidden">
                        <strong>
                            {this.props.selectedTableIndex >= 0 ? dbSchemaContext.allEntitiesList[this.props.selectedTableIndex].tableName : (<em>None selected</em>)}
                        </strong>
                    </div>
                </div>
            );
        
        return (
        <div className="col-4 col-lg-3 p-3" id="app-sidebar-cont">
            <SidebarBubbleBlock 
                headerElement={databaseAddressHeader} 
                bodyElement={databaseAddressBody} 
                isLoaded={this.state.isLoaded} />
            <SidebarBubbleBlock 
                headerElement={selectedTableBubbleHeader} 
                bodyElement={selectedTableBubbleBody} 
                isLoaded={this.state.isLoaded}
                onClick={this.props.onClickShowStartingTableSelectModal} />
        </div>
        );
    }
}
AppSidebar.contextType = DBSchemaContext;

class AppMainCont extends React.Component {
    render() {
        return (
            <div className="col-auto">
            </div>
        );
    }
}

// Code to run
const readVisSchemaJSON = () => {
    Connections.readVisSchemaJSON().then((res:VisSchema[]) => visSchema = res)
}

let appContNode = document.getElementById("app-cont");
ReactDOM.render(<Application />, appContNode);
let visSchema: VisSchema[];

// TODO: refactor this to another file?
