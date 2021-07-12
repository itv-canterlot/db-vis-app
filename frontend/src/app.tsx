import * as React from 'react';
import ReactDOM = require('react-dom');

import { Filter, PatternMatchAttribute, PatternMatchResult, VisSchema } from './ts/types'
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { AppMainCont } from './AppMainCont';

import { AppSidebar } from './AppSidebar';
import { matchTableWithAllVisPatterns } from './VisSchemaMatcher'

import * as ComponentTypes from './ts/components';
import * as Connections from './Connections';
import * as SchemaParser from './SchemaParser';
import { StartingTableSelectModal } from "./StartingTableSelectModal";

import "../styles/app.scss"
import { FilterSelectModal } from './FilterSelectModal';
import { filterDataByFilters } from './DatasetUtils';

let visSchema: VisSchema[] = [];

class Application extends React.Component<{}, ComponentTypes.ApplicationStates> {
    constructor(props) {
        super(props);

        this.state = {
            allEntitiesList: [],
            filters: [],
            selectedFirstTableIndex: -1,
            selectedPatternIndex: -1,
            rendererSelectedAttributes: [[], []],
            rerender: true,
            dataLoaded: false,
            load: false,
            listLoaded: false,
            databaseLocation: "http://localhost:5432", // Placeholder
            showStartingTableSelectModal: false,
            showMatchedSchemasModal: false,
            showFilterSelectModal: false
        };
    }

    onClickShowStartingTableSelectModal = () => {
        this.setState({
            showStartingTableSelectModal: true
        });
    }

    onClickShowFilterSelectModal = () => {
        this.setState({
            showFilterSelectModal: true
        });
    }

    onCloseShowStartingTableSelectModal = () => {
        this.setState({
            showStartingTableSelectModal: false
        });
    }

    onCloseShowFilterSelectModal = () => {
        this.setState({
            showFilterSelectModal: false
        });
    }

    isPatternMatchResultValid = (res: PatternMatchResult) => {
        if (typeof(res) == "undefined" || res == null) return false;
        return res.matched;
    }


    getAllMatchableVisSchemaPatterns = (selectedFirstTableIndex: number, pkNum?: number, getFirstIndices?: boolean) => {
        // Break if not all the components had been initiated
        if (this.state.relationsList === undefined) return;
        if (visSchema === undefined) return;

        // Check type of the relation
        let selectedEntity = this.state.allEntitiesList[selectedFirstTableIndex];
        let entityRel = SchemaParser.getRelationsInListByName(this.state.relationsList, selectedEntity.tableName);
    
        const matchStatusForAllSchema: PatternMatchResult[][] = matchTableWithAllVisPatterns(selectedEntity, entityRel, visSchema, pkNum);

        if (!getFirstIndices) return {
            visSchemaMatchStatus: matchStatusForAllSchema,
            selectedPatternIndex: undefined,
            rendererSelectedAttributes: undefined
        };;
        
        const firstValidPatternIndex = matchStatusForAllSchema.findIndex(res => res.length > 0 && this.isPatternMatchResultValid(res[0]));
        if (!firstValidPatternIndex) return;

        const firstMatchResultIndex = 0;

        // Find the first pattern-matching result that resulted in a match
        const firstValidPatternMatchStatus: PatternMatchResult = matchStatusForAllSchema[firstValidPatternIndex][firstMatchResultIndex];
        if (!firstValidPatternMatchStatus) return;
        
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

        // TODO: make sure the picked indices are not duplicates of each other
        return {
            visSchemaMatchStatus: matchStatusForAllSchema,
            selectedPatternIndex: firstValidPatternIndex ? firstValidPatternIndex : -1,
            selectedMatchResultIndexInPattern: firstMatchResultIndex,
            rendererSelectedAttributes: [mandatoryParamInitAtts, optionalParamInitAtts]
        };

        
    }

    onVisPatternIndexChange = (newIndex: number) => {
        const newPatternMatchStatusesByIndex: PatternMatchResult[] =
            this.state.visSchemaMatchStatus[newIndex];
        let newSelectedMatchResultIndexInPattern = 0;
        let newPatternMatchStatus: PatternMatchResult;

        if (newPatternMatchStatusesByIndex.length > 0) {
            newSelectedMatchResultIndexInPattern = 0; // Default to the first one?
            newPatternMatchStatus = 
                newPatternMatchStatusesByIndex[newSelectedMatchResultIndexInPattern];
        } else {
            return;
        }

        let mandatoryParamInitIndices, optionalParamInitIndices;
        if (!newPatternMatchStatus) {
            mandatoryParamInitIndices = [];
            optionalParamInitIndices = [];
        } else {
            mandatoryParamInitIndices = newPatternMatchStatus.mandatoryAttributes.map((mandMatch, idx) => {
                return Math.floor(Math.random() * mandMatch.length);
            });
            
            optionalParamInitIndices = newPatternMatchStatus.optionalAttributes.map((mandMatch, idx) => {
                return Math.floor(Math.random() * mandMatch.length);
            });
        }

        const mandatoryParamAttrs = mandatoryParamInitIndices.map((attIdx, listIdx) => newPatternMatchStatus.mandatoryAttributes[listIdx][attIdx])
        const optionalParamAttrs = optionalParamInitIndices.map((attIdx, listIdx) => newPatternMatchStatus.optionalAttributes[listIdx][attIdx])
        const newParamAttrs = [mandatoryParamAttrs, optionalParamAttrs];

        this.setState({
            dataLoaded: false,
            data: undefined
        }, () => {
            const getDataCallback = (data: object[]) => {
                this.setState({
                    dataLoaded: true,
                    data: data,
                    selectedPatternIndex: newIndex,
                    selectedMatchResultIndexInPattern: newSelectedMatchResultIndexInPattern,
                    rendererSelectedAttributes: newParamAttrs
                })
            };

            Connections.getDataByMatchAttrs(
                newParamAttrs, 
                this.state.visSchemaMatchStatus[newIndex][newSelectedMatchResultIndexInPattern],
                this.getFilterMappedPMAttributes(this.state.filters))
                    .then(getDataCallback.bind(this))
        })

    }

    onSelectedAttributeIndicesChange = (e: React.BaseSyntheticEvent) => {
        const target = e.target;
        const isMandatory = target.getAttribute("data-mandatory") === "true";
        const isMandatoryIdx = isMandatory ? 0 : 1;
        const patternAttIdx = parseInt(target.getAttribute("data-pattern-att-idx"));
        const matchIdx = parseInt(target.getAttribute("data-match-idx"));
        const currentPatternMatchResult = this.state.visSchemaMatchStatus[this.state.selectedPatternIndex][this.state.selectedMatchResultIndexInPattern];
        const newMatchAttr = currentPatternMatchResult.mandatoryAttributes[patternAttIdx][matchIdx]

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
            dataLoaded: false,
            data: undefined
        }, () => {
            const getDataCallback = (data: object[]) => {
                this.setState({
                    dataLoaded: true,
                    data: data,
                    rendererSelectedAttributes: newAttsObject
                });
            }
            Connections.getDataByMatchAttrs(newAttsObject, 
                currentPatternMatchResult, 
                this.getFilterMappedPMAttributes(this.state.filters))
                .then(getDataCallback.bind(this))
        })
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
            dataLoaded: false,
            data: undefined,
            filters: []
        }, () => {
            const {
                visSchemaMatchStatus, 
                selectedPatternIndex, 
                selectedMatchResultIndexInPattern,
                rendererSelectedAttributes} = this.getAllMatchableVisSchemaPatterns(tableIndex, undefined, true);

            const getDataCallback = (data: object[]) => {
                this.setState({
                    dataLoaded: true,
                    data: data,
                    selectedFirstTableIndex: tableIndex,
                    selectedMatchResultIndexInPattern: selectedMatchResultIndexInPattern,
                    rerender: tableIndexChanged,
                    visSchemaMatchStatus: visSchemaMatchStatus,
                    selectedPatternIndex: selectedPatternIndex ? selectedPatternIndex : -1,
                    rendererSelectedAttributes: rendererSelectedAttributes
                });
            }

            Connections.getDataByMatchAttrs(
                rendererSelectedAttributes, 
                visSchemaMatchStatus[selectedPatternIndex][0],
                this.getFilterMappedPMAttributes(this.state.filters))
                    .then(getDataCallback.bind(this));
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

            if (!entitiesListPromise) {
                return;
            }
            
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

    getFilterMappedPMAttributes = (filters: Filter[]): PatternMatchAttribute[] => {
        if (!filters) return [];
        return filters.map(filter => {
            return {
                table: this.state.allEntitiesList[filter.tableIndex],
                attributeIndex: filter.attNum - 1
            }
        });
    }

    onDataChange = (data) => {
        this.setState({
            data: data
        })
    }

    onFilterChange = (filters: Filter[]) => {
        this.setState({
            filters: filters
        }, () => {
            const filteredData = filterDataByFilters(this.state.data, this.getProviderValues(), this.state.filters);

            const {
                visSchemaMatchStatus, 
                selectedPatternIndex, 
                selectedMatchResultIndexInPattern, 
                rendererSelectedAttributes} = this.getAllMatchableVisSchemaPatterns(this.state.selectedFirstTableIndex, filteredData.length, false);

            const getDataCallback = (data: object[]) => {
                this.setState({
                    data: data,
                    visSchemaMatchStatus: visSchemaMatchStatus,
                });
            }

            Connections.getDataByMatchAttrs(
                this.state.rendererSelectedAttributes, 
                visSchemaMatchStatus[this.state.selectedPatternIndex][this.state.selectedMatchResultIndexInPattern], 
                this.getFilterMappedPMAttributes(filters))
                    .then(getDataCallback.bind(this));
        });
    }

    async componentDidMount() {
        // Can even do some loading screen stuff here
        readVisSchemaJSON();
        this.getTableMetadata();
    }

    getProviderValues = (): DBSchemaContextInterface => {
        return {
            allEntitiesList: this.state.allEntitiesList, 
            relationsList: this.state.relationsList,
            data: this.state.data,
            dataLoaded: this.state.dataLoaded,
            filters: this.state.filters,
            visSchemaMatchStatus: this.state.visSchemaMatchStatus,
            visSchema: visSchema,
            selectedPatternIndex: this.state.selectedPatternIndex,
            selectedMatchResultIndexInPattern: this.state.selectedMatchResultIndexInPattern,
            selectedFirstTableIndex: this.state.selectedFirstTableIndex,
            selectedAttributesIndices: this.state.rendererSelectedAttributes
        };
    }

    render() {
        const providerValues = this.getProviderValues();

        return (
            <DBSchemaContext.Provider value={providerValues}>
                {this.state.showStartingTableSelectModal ? 
                    <StartingTableSelectModal 
                        onClose={this.onCloseShowStartingTableSelectModal} onTableSelectChange={this.onTableSelectChange} /> 
                    : null}
                {this.state.showFilterSelectModal ? 
                    <FilterSelectModal 
                        onClose={this.onCloseShowFilterSelectModal}
                        filters={this.state.filters}
                        onFilterChange={this.onFilterChange} /> 
                    : null}
                <div className="row" id="app-wrapper">
                    <AppSidebar 
                        databaseLocation={this.state.databaseLocation}
                        onClickShowStartingTableSelectModal={this.onClickShowStartingTableSelectModal}
                        onClickShowFilterSelectModal={this.onClickShowFilterSelectModal}
                         />
                    <AppMainCont
                        onDataChange={this.onDataChange}
                        load={this.state.load}
                        rerender={this.state.rerender}
                        onVisPatternIndexChange={this.onVisPatternIndexChange}
                        onSelectedAttributeIndicesChange={this.onSelectedAttributeIndicesChange}
                        onClickShowFilterSelectModal={this.onClickShowFilterSelectModal}
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
