import * as React from 'react';
import ReactDOM = require('react-dom');

import { MatchedParamIndicesType, VisSchema } from './ts/types'
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
            selectedAttributesIndices: [[], []],
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
        const firstValidPatternIndex = matchStatusForAllSchema.findIndex(v => typeof(v) !== "undefined" && v !== null);
        const firstValidPatternMatchStatus: MatchedParamIndicesType = matchStatusForAllSchema.find(v => typeof(v) !== "undefined" && v !== null);
        const mandatoryParamInitIndices = firstValidPatternMatchStatus.mandatoryAttributes.map((mandMatch, idx) => {
            return Math.floor(Math.random() * mandMatch.length);
        });
        let optionalParamInitIndices;
        if (firstValidPatternMatchStatus.hasOwnProperty("optionalAttributes")) {
            optionalParamInitIndices = firstValidPatternMatchStatus.optionalAttributes.map((mandMatch, idx) => {
                return Math.floor(Math.random() * mandMatch.length);
            });
        } else {
            optionalParamInitIndices = [];
        }
        
        // TODO: make sure the picked indices are not duplicates of each other
        // for (let i = 0; i < firstValidPatternMatchStatus.mandatoryAttributes.length; i++) {
        //     for (let j = 0; j < firstValidPatternMatchStatus.mandatoryAttributes[i].length; j++) {
                
        //     }
        // }
        console.log(firstValidPatternMatchStatus)
        this.setState({
            visSchemaMatchStatus: matchStatusForAllSchema,
            selectedPatternIndex: firstValidPatternIndex ? firstValidPatternIndex : -1,
            selectedAttributesIndices: [mandatoryParamInitIndices, optionalParamInitIndices]
        });
    }

    onVisPatternIndexChange = (newIndex: number) => {
        const newPatternMatchStatus: MatchedParamIndicesType = 
            this.state.visSchemaMatchStatus[newIndex];

        const mandatoryParamInitIndices = newPatternMatchStatus.mandatoryAttributes.map((mandMatch, idx) => {
            return Math.floor(Math.random() * mandMatch.length);
        });
        const optionalParamInitIndices = newPatternMatchStatus.optionalAttributes.map((mandMatch, idx) => {
            return Math.floor(Math.random() * mandMatch.length);
        });

        this.setState({
            selectedPatternIndex: newIndex,
            selectedAttributesIndices: [mandatoryParamInitIndices, optionalParamInitIndices],
            rerender: true
        }, () => {
            this.setState({
                rerender: false
            });
        });
    }

    onSelectedAttributeIndicesChange = (e: React.BaseSyntheticEvent) => {
        const target = e.target;
        const isMandatoryIdx = target.getAttribute("data-mandatory") === "true" ? 0 : 1;
        const patternAttIdx = parseInt(target.getAttribute("data-pattern-att-idx"));
        const listIdx = parseInt(target.getAttribute("data-list-idx"));
        let newAttIndices = JSON.parse(JSON.stringify(this.state.selectedAttributesIndices));
        newAttIndices[isMandatoryIdx][patternAttIdx] = listIdx;
        
        this.setState({
            selectedAttributesIndices: newAttIndices,
            rerender: true
        }, () => {
            this.setState({
                rerender: false
            })
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
                    load: false,
                    // rerender: false
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
            selectedPatternIndex: this.state.selectedPatternIndex,
            selectedAttributesIndices: this.state.selectedAttributesIndices
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
                        selectedAttributesIndices={this.state.selectedAttributesIndices}
                        visSchemaMatchStatus={this.state.visSchemaMatchStatus}
                        load={this.state.load}
                        rerender={this.state.rerender}
                        onVisPatternIndexChange={this.onVisPatternIndexChange}
                        onSelectedAttributeIndicesChange={this.onSelectedAttributeIndicesChange}
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
