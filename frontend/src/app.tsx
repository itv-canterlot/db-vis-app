import * as React from 'react';
import ReactDOM = require('react-dom');

import { VisSchema } from './ts/types'
import { DBSchemaContext } from './DBSchemaContext';
import { AppMainCont } from './AppMainCont';

import { AppSidebar } from './AppSidebar';
import { matchTableWithAllRels as getmatchTableWithAllVisSchemas, matchTableWithRel } from './VisSchemaMatcher'

import * as ComponentTypes from './ts/components';
import * as Connections from './Connections';
import * as SchemaParser from './SchemaParser';
import { StartingTableSelectModal } from './SidebarModals';

let visSchema: VisSchema[] = [];

class Application extends React.Component<{}, ComponentTypes.ApplicationStates> {
    constructor(props) {
        super(props);

        this.state = {
            allEntitiesList: [],
            selectedTableIndex: -1,
            selectedPatternIndex: -1,
            rerender: true,
            load: false,
            listLoaded: false,
            databaseLocation: "http://localhost:5432", // Placeholder
            showStartingTableSelectModal: false,
            showMatchedSchemasModal: false
        };
    }

    onClickShowStartingTableSelectModal = () => {
        this.setState({
            showStartingTableSelectModal: true
        });
    }

    onClickShowMatchedSchemasModal = () => {
        if (this.state.selectedTableIndex < 0) {
            return;
        }
        this.setState({
            showMatchedSchemasModal: true
        });
    }

    onCloseShowStartingTableSelectModal = () => {
        this.setState({
            showStartingTableSelectModal: false
        });
    }

    onCloseShowMatchedSchemasModal = () => {
        this.setState({
            showMatchedSchemasModal: false
        });
    }

    getAllMatchableVisSchemaPatterns = () => {
        // Break if not all the components had been initiated
        if (this.state.relationsList === undefined) return;
        if (visSchema === undefined) return;

        // Check type of the relation
        let selectedEntity = this.state.allEntitiesList[this.state.selectedTableIndex];
        let entityRel = SchemaParser.getRelationInListByName(this.state.relationsList, selectedEntity.tableName);

        const matchStatusForAllSchema = getmatchTableWithAllVisSchemas(selectedEntity, entityRel, visSchema);
        const firstValidPattern = matchStatusForAllSchema.findIndex(v => typeof(v) !== "undefined" && v !== null);
        this.setState({
            visSchemaMatchStatus: matchStatusForAllSchema,
            selectedPatternIndex: firstValidPattern ? firstValidPattern : -1
        });
    }

    onVisPatternIndexChange = (newIndex: number) => {
        this.setState({
            selectedPatternIndex: newIndex
        });
    }

    // Called when R1 is changed
    onTableSelectChange = (e) => {
        this.setState({
            load: true,
            rerender: false
        }, () => {
            let tableIndex = -1;
    
            if (e instanceof Object) {
                tableIndex = parseInt(e.target.getAttribute("data-index"));
            } else {
                tableIndex = e;
            }
    
            if (tableIndex < 0) {
                this.setState({
                    load: true
                });
                return;
            };

            const tableIndexChanged = this.state.selectedTableIndex !== tableIndex
    
            this.setState({
                selectedTableIndex: tableIndex,
                rerender: tableIndexChanged
            }, () => {
                this.getAllMatchableVisSchemaPatterns();
                this.setState({
                    load: false
                });
            });
        })
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
        const providerValues = {
            allEntitiesList: this.state.allEntitiesList, 
            relationsList: this.state.relationsList, 
            visSchema: visSchema,
            selectedPatternIndex: this.state.selectedPatternIndex
        };

        return (
            <DBSchemaContext.Provider value={providerValues}>
                {this.state.showStartingTableSelectModal ? 
                <StartingTableSelectModal 
                    onClose={this.onCloseShowStartingTableSelectModal} onTableSelectChange={this.onTableSelectChange} 
                    selectedTableIndex={this.state.selectedTableIndex}/> 
                : null}
                <div className="row" id="app-wrapper">
                    <AppSidebar 
                        databaseLocation={this.state.databaseLocation}
                        onClickShowStartingTableSelectModal={this.onClickShowStartingTableSelectModal}
                        onClickShowMatchedSchemasModal={this.onClickShowMatchedSchemasModal}
                        selectedTableIndex={this.state.selectedTableIndex} />
                    <AppMainCont
                        selectedTableIndex={this.state.selectedTableIndex}
                        visSchemaMatchStatus={this.state.visSchemaMatchStatus}
                        load={this.state.load}
                        rerender={this.state.rerender}
                        onVisPatternIndexChange={this.onVisPatternIndexChange}
                         />
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

// TODO: refactor this to another file?
