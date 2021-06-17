import * as React from 'react';
import ReactDOM = require('react-dom');

import { PatternMatchAttribute, PatternMatchResult, VisSchema } from './ts/types'
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { AppMainCont } from './AppMainCont';

import { AppSidebar } from './AppSidebar';
import { matchTableWithAllVisPatterns } from './VisSchemaMatcher'

import * as ComponentTypes from './ts/components';
import * as Connections from './Connections';
import * as SchemaParser from './SchemaParser';
import { StartingTableSelectModal } from './SidebarModals';

import "../styles/app.scss"

let visSchema: VisSchema[] = [];

class Application extends React.Component<{}, ComponentTypes.ApplicationStates> {
    constructor(props) {
        super(props);

        this.state = {
            allEntitiesList: [],
            selectedFirstTableIndex: -1,
            selectedPatternIndex: -1,
            rendererSelectedAttributes: [[], []],
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
        if (this.state.selectedFirstTableIndex < 0) {
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

    isPatternMatchResultValid = (res: PatternMatchResult) => {
        if (typeof(res) == "undefined" || res == null) return false;
        return res.matched;
    }

    getAllMatchableVisSchemaPatterns = () => {
        // Break if not all the components had been initiated
        if (this.state.relationsList === undefined) return;
        if (visSchema === undefined) return;

        // Check type of the relation
        let selectedEntity = this.state.allEntitiesList[this.state.selectedFirstTableIndex];
        let entityRel = SchemaParser.getRelationsInListByName(this.state.relationsList, selectedEntity.tableName);

        // Find the first result that resulted in a match
        const matchStatusForAllSchema: PatternMatchResult[] = matchTableWithAllVisPatterns(selectedEntity, entityRel, visSchema);
        const firstValidPatternIndex = matchStatusForAllSchema.findIndex(res => this.isPatternMatchResultValid(res));
        const firstValidPatternMatchStatus: PatternMatchResult = matchStatusForAllSchema[firstValidPatternIndex];

        console.log(matchStatusForAllSchema)

        const mandatoryParamInitIndices = firstValidPatternMatchStatus.mandatoryAttributes.map((mandMatch, idx) => {
            return Math.floor(Math.random() * mandMatch.length);
        });
        const mandatoryParamInitAtts = mandatoryParamInitIndices.map((attIdx, listIdx) => firstValidPatternMatchStatus.mandatoryAttributes[listIdx][attIdx])

        let optionalParamInitIndices, optionalParamInitAtts;
        if (firstValidPatternMatchStatus.hasOwnProperty("optionalAttributes")) {
            optionalParamInitIndices = firstValidPatternMatchStatus.optionalAttributes.map((mandMatch, idx) => {
                return Math.floor(Math.random() * mandMatch.length);
            });
            optionalParamInitAtts = optionalParamInitIndices.map((attIdx, listIdx) => firstValidPatternMatchStatus.optionalAttributes[listIdx][attIdx])
        } else {
            optionalParamInitIndices = [];
        }

        console.log(mandatoryParamInitAtts)

        // TODO: make sure the picked indices are not duplicates of each other
        this.setState({
            visSchemaMatchStatus: matchStatusForAllSchema,
            selectedPatternIndex: firstValidPatternIndex ? firstValidPatternIndex : -1,
            rendererSelectedAttributes: [mandatoryParamInitAtts, optionalParamInitAtts]
        });
    }

    onVisPatternIndexChange = (newIndex: number) => {
        const newPatternMatchStatus: PatternMatchResult = 
            this.state.visSchemaMatchStatus[newIndex];

        const mandatoryParamInitIndices = newPatternMatchStatus.mandatoryAttributes.map((mandMatch, idx) => {
            return Math.floor(Math.random() * mandMatch.length);
        });
        const mandatoryParamAttrs = mandatoryParamInitIndices.map((attIdx, listIdx) => newPatternMatchStatus.mandatoryAttributes[listIdx][attIdx])
        
        const optionalParamInitIndices = newPatternMatchStatus.optionalAttributes.map((mandMatch, idx) => {
            return Math.floor(Math.random() * mandMatch.length);
        });
        const optionalParamAttrs = optionalParamInitIndices.map((attIdx, listIdx) => newPatternMatchStatus.optionalAttributes[listIdx][attIdx])

        this.setState({
            selectedPatternIndex: newIndex,
            rendererSelectedAttributes: [mandatoryParamAttrs, optionalParamAttrs],
            rerender: true
        }, () => {
            this.setState({
                rerender: false
            });
        });
    }

    onSelectedAttributeIndicesChange = (e: React.BaseSyntheticEvent) => {
        const target = e.target;
        const isMandatory = target.getAttribute("data-mandatory") === "true";
        const isMandatoryIdx = isMandatory ? 0 : 1;
        const patternAttIdx = parseInt(target.getAttribute("data-pattern-att-idx"));
        const listIdx = parseInt(target.getAttribute("data-list-idx"));
        const currentPatternMatchResult = this.state.visSchemaMatchStatus[this.state.selectedPatternIndex];
        const newMatchAttr = currentPatternMatchResult.mandatoryAttributes[patternAttIdx][listIdx]

        let newAttsObject = [], editedAtts = [];
        this.state.rendererSelectedAttributes[isMandatoryIdx].forEach((matchAttr, idx) => {
            if (idx === patternAttIdx) {
                editedAtts.push(newMatchAttr);
            } else {
                editedAtts.push(matchAttr);
            }
        });
        newAttsObject[isMandatoryIdx] = editedAtts;
        newAttsObject[Math.abs(isMandatoryIdx - 1)] = this.state.rendererSelectedAttributes[Math.abs(isMandatoryIdx - 1)];
        
        this.setState({
            rendererSelectedAttributes: newAttsObject,
            rerender: true
        }, () => {
            this.setState({
                rerender: false
            })
        });
    }

    // Called when R1 is changed
    onTableSelectChange = (e) => {
        let tableIndex = -1;
        if (e instanceof Object) {
            tableIndex = parseInt(e.target.getAttribute("data-index"));
        } else {
            tableIndex = e;
        }

        const tableIndexChanged = this.state.selectedFirstTableIndex !== tableIndex

        if (tableIndex < 0) {
            this.setState({
                load: true
            });
            return;
        };

        if (!tableIndexChanged) return;

        this.setState({
            load: true,
            rerender: false
        }, () => {    
            this.setState({
                selectedFirstTableIndex: tableIndex,
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
        const providerValues: DBSchemaContextInterface = {
            allEntitiesList: this.state.allEntitiesList, 
            relationsList: this.state.relationsList,
            visSchemaMatchStatus: this.state.visSchemaMatchStatus,
            visSchema: visSchema,
            selectedPatternIndex: this.state.selectedPatternIndex,
            selectedFirstTableIndex: this.state.selectedFirstTableIndex,
            selectedAttributesIndices: this.state.rendererSelectedAttributes
        };

        return (
            <DBSchemaContext.Provider value={providerValues}>
                {this.state.showStartingTableSelectModal ? 
                <StartingTableSelectModal 
                    onClose={this.onCloseShowStartingTableSelectModal} onTableSelectChange={this.onTableSelectChange} /> 
                : null}
                <div className="row" id="app-wrapper">
                    <AppSidebar 
                        databaseLocation={this.state.databaseLocation}
                        onClickShowStartingTableSelectModal={this.onClickShowStartingTableSelectModal}
                        onClickShowMatchedSchemasModal={this.onClickShowMatchedSchemasModal} />
                    <AppMainCont
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
