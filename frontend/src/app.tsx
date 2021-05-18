import * as React from 'react';
import ReactDOM = require('react-dom');

import { VisSchema } from './ts/types'
import { DBSchemaContext } from './DBSchemaContext';
import { AppMainCont } from './AppMainCont';

import { AppSidebar } from './AppSidebar';
import { matchTableWithRel } from './VisSchemaMatcher'

import * as ComponentTypes from './ts/components';
import * as Connections from './Connections';
import * as SchemaParser from './SchemaParser';
import { StartingTableSelectModal } from './SidebarModals';

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

    getAllMatchableVisSchema = () => {
        // Break if not all the components had been initiated
        if (this.state.relationsList === undefined) return;
        if (visSchema === undefined) return;

        // Check type of the relation
        let selectedEntity = this.state.allEntitiesList[this.state.selectedTableIndex];
        let entityRel = SchemaParser.getRelationInListByName(this.state.relationsList, selectedEntity.tableName);
        
        visSchema.forEach(vs => {
            const matchResult = matchTableWithRel(selectedEntity, entityRel, vs);
            if (matchResult) console.log(matchResult);
        })
        
        // For demo: simple entity
        // if ((!selectedEntity.hasOwnProperty("weakEntitiesIndices") || selectedEntity.weakEntitiesIndices.length === 0) && 
        //     (!selectedEntity.hasOwnProperty("isJunction") || !selectedEntity.isJunction)) {
        //     if (selectedEntity.pk) {
        //         let pkAtts = selectedEntity.pk.columns.map(key => selectedEntity.attr[key.colPos].attname);
        //         Connections.getTableDistCounts(selectedEntity.tableName, pkAtts).then(distCountRes => {
        //             return Math.max(distCountRes.map(count => count.distinct_count));
    
        //         }).then(maxDistCount => {
        //             // TODO: colours not checked - need additional markup
        //             // TODO: list of schemas - use all of them
        //             for (const schema of visSchema) {
        //                 if (schema.type === VISSCHEMATYPES.BASIC) {
        //                     // Count check
        //                     if (!(schema.localKey.minCount <= maxDistCount)) continue;
        //                     if (schema.localKey.maxCount !== undefined) {
        //                         if (!(schema.localKey.maxCount >= maxDistCount)) continue;
        //                     }
                            
        //                     // Type check
        //                     // console.log(schema);
        //                 }
        //                 // For each schema, compare
        //             }
        //         });
        //     }
        // }
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
            this.getAllMatchableVisSchema(); // TODO: major overhaul
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
                <div className="row" id="app-wrapper">
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
    Connections.readVisSchemaJSON().then((res:VisSchema[][]) => {
        res.forEach(vses => {
            vses["schema"].forEach(vs => visSchema.push(vs));
        })
    })
}

let appContNode = document.getElementById("app-cont");
ReactDOM.render(<Application />, appContNode);
let visSchema: VisSchema[] = [];

// TODO: refactor this to another file?
