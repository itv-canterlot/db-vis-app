import * as React from 'react';
import ReactDOM = require('react-dom');

import {Attribute, VisSchema, VISSCHEMATYPES} from './ts/types'
import { DBSchemaContext } from './DBSchemaContext';
import { AppMainCont } from './AppMainCont';

import { AppSidebar, StartingTableSelectModal } from './AppSidebar';


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
            if (selectedEntity.pk) {
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
    }

    // Called when R1 is changed
    onTableSelectChange = (e) => {
        let tableIndex = -1;

        if (e instanceof Object) {
            tableIndex = parseInt(e.target.getAttribute("data-index"));
        } else {
            tableIndex = e;
        }

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
                    <AppMainCont
                        selectedTableIndex={this.state.selectedTableIndex} />
                </div>
            </DBSchemaContext.Provider>

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
