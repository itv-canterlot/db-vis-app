import * as React from 'react';
import ReactDOM = require('react-dom');

import { Filter, PatternMatchResult, VisSchema } from './ts/types'
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { AppMainCont } from './AppMainCont';

import { AppSidebar } from './AppSidebar';
import { matchAllSelectedRelationsWithVisPatterns, matchRelationWithAllVisPatterns, matchTableWithAllVisPatterns } from './VisSchemaMatcher'

import * as ComponentTypes from './ts/components';
import * as Connections from './Connections';
import * as SchemaParser from './SchemaParser';
import { StartingTableSelectModal } from "./StartingTableSelectModal";

import "../styles/app.scss"
import { FilterSelectModal } from './FilterSelectModal';
import { filterDataByFilters } from './DatasetUtils';
import { VisKeyCountConfirmModal } from './VisKeyCountConfirmModal';

let visSchema: VisSchema[] = [];

class Application extends React.Component<{}, ComponentTypes.ApplicationStates> {
    constructor(props) {
        super(props);

        this.state = {
            allEntitiesList: [],
            filters: [],
            selectedEntitesIndices: [],
            selectedRelationsIndices: [],
            selectedPatternIndex: -1,
            relHierarchyIndices: [[], [], []],
            rendererSelectedAttributes: [[], []],
            rerender: true,
            dataLoaded: false,
            load: false,
            listLoaded: false,
            databaseLocation: "http://localhost:5432", // Placeholder
            showStartingTableSelectModal: false,
            showMatchedSchemasModal: false,
            showFilterSelectModal: false,
            showVisKeyCountConfirmModal: false,
            visKeyOverride: false
        };
    }

    // Event handlers
    onClickShowStartingTableSelectModal = () => {
        if (this.state.allEntitiesList.length == 0) {
            this.getTableMetadata();
        }
        
        this.setState({
            showStartingTableSelectModal: true,
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

    showVisKeyCountConfirmModal = () => {
        this.setState({
            showVisKeyCountConfirmModal: true
        })
    }

    onCloseVisKeyCountConfirmModal = (cancel: boolean) => {
        const newSelectedPatternIndex = cancel ? -1 : this.state.selectedPatternIndex;
        this.setState({
            showVisKeyCountConfirmModal: false,
            selectedPatternIndex: newSelectedPatternIndex
        })
    }

    onConfirmVisKeyCountConfirmModal = () => {
        this.setState({
            showVisKeyCountConfirmModal: false,
            visKeyOverride: true
        })
    }

    onSelectFilteringFromConfirmModal = () => {
        this.setState({
            showVisKeyCountConfirmModal: false
        })
    }
    
    
    onMatchResultIndexChange = (newIndex: number) => {
        const newPatternMatchStatusesByIndex: PatternMatchResult[] =
            this.state.visSchemaMatchStatus[this.state.selectedPatternIndex];
        let newPatternMatchStatus = newPatternMatchStatusesByIndex[newIndex]

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
            selectedMatchResultIndexInPattern: newIndex,
            rendererSelectedAttributes: newParamAttrs,
            visKeyOverride: false
        });
    }

    onVisPatternIndexChange = (newIndex: number) => {
        const newPatternMatchStatusesByIndex: PatternMatchResult[] =
            this.state.visSchemaMatchStatus[newIndex];
        let newSelectedMatchResultIndexInPattern;
        let newPatternMatchStatus: PatternMatchResult;

        if (newPatternMatchStatusesByIndex.length > 0) {
            newSelectedMatchResultIndexInPattern = newPatternMatchStatusesByIndex.findIndex(status => status.matched)
            if (newSelectedMatchResultIndexInPattern < 0) return;
            newPatternMatchStatus = 
                newPatternMatchStatusesByIndex[newSelectedMatchResultIndexInPattern];
        } else {
            return;
        }

        let mandatoryParamInitIndices: number[], optionalParamInitIndices: number[];
        if (!newPatternMatchStatus) {
            mandatoryParamInitIndices = [];
            optionalParamInitIndices = [];
        } else {
            // Obtain the selected attributes as much as possible
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
            if (this.state.selectedEntitesIndices.length !== 0) {
                const getDataCallback = (data: object[]) => {
                    this.setState({
                        dataLoaded: true,
                        data: data,
                        selectedPatternIndex: newIndex,
                        selectedMatchResultIndexInPattern: newSelectedMatchResultIndexInPattern,
                        rendererSelectedAttributes: newParamAttrs,
                        visKeyOverride: false
                    })
                };
    
                Connections.getDataByMatchAttrs(
                    newParamAttrs, 
                    this.state.visSchemaMatchStatus[newIndex][newSelectedMatchResultIndexInPattern],
                    this.getProviderValues())
                        .then(getDataCallback.bind(this));
            } else {
                const getDataCallback = (data: object[]) => {
                    this.setState({
                        dataLoaded: true,
                        data: data,
                        selectedPatternIndex: newIndex,
                        selectedMatchResultIndexInPattern: newSelectedMatchResultIndexInPattern,
                        rendererSelectedAttributes: newParamAttrs,
                        visKeyOverride: false
                    });
                }

                Connections.getRelationBasedData(
                        this.state.relHierarchyIndices.flat()
                            .map(relIdx => this.state.relationsList[relIdx]), this.getProviderValues(), newParamAttrs, this.state.filters)
                    .then(getDataCallback.bind(this))
            }
        })

    }

    onSelectedAttributeIndicesChange = (e: React.BaseSyntheticEvent) => {
        const target = e.target;
        const isMandatory = target.getAttribute("data-mandatory") === "true";
        const isMandatoryIdx = isMandatory ? 0 : 1;
        const patternAttIdx = parseInt(target.getAttribute("data-pattern-att-idx"));
        const matchIdx = parseInt(target.getAttribute("data-match-idx"));
        const currentPatternMatchResult = this.state.visSchemaMatchStatus[this.state.selectedPatternIndex][this.state.selectedMatchResultIndexInPattern];
        let newMatchAttr;
        if (isMandatory) {
            newMatchAttr = currentPatternMatchResult.mandatoryAttributes[patternAttIdx][matchIdx];
        } else {
            newMatchAttr = currentPatternMatchResult.optionalAttributes[patternAttIdx][matchIdx]
        }

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
            if (this.state.selectedEntitesIndices.length !== 0) {
                const getDataCallback = (data: object[]) => {
                    this.setState({
                        dataLoaded: true,
                        data: data,
                        rendererSelectedAttributes: newAttsObject,
                        visKeyOverride: false
                    });
                }
                Connections.getDataByMatchAttrs(newAttsObject, 
                    currentPatternMatchResult, 
                    this.getProviderValues())
                    .then(getDataCallback.bind(this))
            } else {
                // this.updateRelationBasedDataWithFilter(this.state.filters, undefined, this);
                const getDataCallback = (data: object[]) => {
                    const filteredData = filterDataByFilters(data, this.getProviderValues(), this.state.filters);
                    
                    const mainRelation = this.state.relHierarchyIndices[0].map(relIdx => this.state.relationsList[relIdx])
                    // const visSchemaMatchesFromRels = 
                    //     this.getVisSchemaMatchesFromSelectedRelations();
                    const setStateCallback = visSchemaMatchesFromRels => {
                        this.setState({
                            dataLoaded: true,
                            data: filteredData,
                            visSchemaMatchStatus: visSchemaMatchesFromRels,
                            rendererSelectedAttributes: newAttsObject,
                            visKeyOverride: false
                        })
                    };
                    
                    this.getVisSchemaMatchesFromSelectedRelations().then(setStateCallback.bind(this));
                }
                
                Connections.getRelationBasedData(
                    this.state.selectedRelationsIndices
                        .map(relIdx => this.state.relationsList[relIdx]), this.getProviderValues(), 
                            newAttsObject, this.state.filters).then(getDataCallback.bind(this));
            }
        })
    }

    getAllPatternMatchesFromRelations = () => {
        const getDataCallback = (data: object[]) => {
            this.setState({
                dataLoaded: true,
                data: data
            });
        }

        Connections.getRelationBasedData(this.state.selectedRelationsIndices.map(relIdx => this.state.relationsList[relIdx]), this.getProviderValues())
            .then(getDataCallback.bind(this))

        const setStateCallback = (visSchemaMatchesFromRels => {
            console.log(visSchemaMatchesFromRels)
        });

        this.getVisSchemaMatchesFromSelectedRelations().then(setStateCallback.bind(this));
    }

    onRelHierarchyChange = (newHierarchy: number[][]) => {
        this.setState({
            relHierarchyIndices: newHierarchy
        }, () => {
            // If primary relation is not selected, clear screen and data
            if (newHierarchy[0].length === 0) {
                this.setState({
                    dataLoaded: false,
                    data: undefined,
                    selectedPatternIndex: -1,
                    rendererSelectedAttributes: [[], []],
                    visSchemaMatchStatus: undefined,
                    visKeyOverride: false
                });
                return;
            }

            const getDataCallback = (data: object[]) => {
                this.setState({
                    dataLoaded: true,
                    data: data
                });
            }
    
            Connections.getRelationBasedData(newHierarchy.flat().map(relIdx => this.state.relationsList[relIdx]), this.getProviderValues())
                .then(getDataCallback)
                
            const setStateCallback = (visSchemaMatchesFromRels => {
                this.setState({
                    visSchemaMatchStatus: visSchemaMatchesFromRels,
                    visKeyOverride: false
                })
            });

            this.getVisSchemaMatchesFromSelectedRelations().then(setStateCallback.bind(this));

            // const visSchemaMatchesFromRels = 
            //     this.getVisSchemaMatchesFromSelectedRelations();
        });

    }

    onDatasetSchemaSelectChange = (newEntities?: number[], newRelations?: number[]) => {
        const entitiesIndicesChanged = this.state.selectedEntitesIndices !== newEntities
        const relationIndicesChanged = this.state.selectedRelationsIndices !== newRelations

        if (newEntities.length === 0 && newRelations.length === 0) {
            this.setState({
                data: undefined,
                dataLoaded: false,
                filters: [],
                selectedEntitesIndices: [],
                selectedRelationsIndices: [],
                load: false
            });
            return;
        };

        if (!entitiesIndicesChanged && !relationIndicesChanged) return;

        // TODO: only process one array only; entity priority
        // Entity case
        if (newEntities.length !== 0 ) {
            this.setState({
                dataLoaded: false,
                data: undefined,
                filters: []
            }, () => {
                this.setState({
                    selectedEntitesIndices: newEntities,
                    selectedRelationsIndices: newRelations
                })
                const {
                    visSchemaMatchStatus, 
                    selectedPatternIndex, 
                    selectedMatchResultIndexInPattern,
                    rendererSelectedAttributes} = this.getAllMatchableVisSchemaPatterns(newEntities[0], undefined, true);

                if (selectedPatternIndex < 0 || selectedMatchResultIndexInPattern < 0) {
                    return;
                }
    
                const getDataCallback = (data: object[]) => {
                    this.setState({
                        dataLoaded: true,
                        data: data,
                        selectedMatchResultIndexInPattern: selectedMatchResultIndexInPattern,
                        rerender: entitiesIndicesChanged,
                        visSchemaMatchStatus: visSchemaMatchStatus,
                        selectedPatternIndex: selectedPatternIndex ? selectedPatternIndex : -1,
                        rendererSelectedAttributes: rendererSelectedAttributes,
                        visKeyOverride: false
                    });
                }
    
                Connections.getDataByMatchAttrs(
                    rendererSelectedAttributes, 
                    visSchemaMatchStatus[selectedPatternIndex][0],
                    this.getProviderValues())
                        .then(getDataCallback.bind(this));
            })
        } else {            
            this.setState({
                selectedEntitesIndices: newEntities,
                selectedRelationsIndices: newRelations,
                visKeyOverride: false
            }, () => {
                if (newRelations.length === 1) {
                    this.onRelHierarchyChange([[newRelations[0]], [], []])
                }
            });
        }
    }

    onDataChange = (data) => {
        this.setState({
            data: data
        })
    }

    updateRelationBasedDataWithFilter = (filters: Filter[], newStates?: object, thisObj?: object) => {
        const getDataCallback = (data: object[]) => {
            const filteredData = filterDataByFilters(data, this.getProviderValues(), filters);
            this.setState({
                data: filteredData,
                dataLoaded: true
            }, () => {
                const setStateCallback = (visSchemaMatchesFromRels) => {
                    this.setState({
                        visSchemaMatchStatus: visSchemaMatchesFromRels,
                        visKeyOverride: false
                    })
                }
                this.getVisSchemaMatchesFromSelectedRelations().then(setStateCallback.bind(this));
            })
        }
        
        Connections.getRelationBasedData(
            this.state.selectedRelationsIndices
                .map(relIdx => this.state.relationsList[relIdx]), this.getProviderValues(), 
                    this.state.rendererSelectedAttributes, filters).then(getDataCallback);
    }

    onFilterChange = (filters: Filter[]) => {
        // TODO: temporary divergence
        if (this.state.selectedEntitesIndices.length === 0) {
            this.setState({
                filters: filters,
                visKeyOverride: false
            }, () => {
                this.updateRelationBasedDataWithFilter(filters, {}, this);
            })
        } else {
            const filteredData = filterDataByFilters(this.state.data, this.getProviderValues(), filters);
            const {
                visSchemaMatchStatus, 
                selectedPatternIndex, 
                selectedMatchResultIndexInPattern, 
                rendererSelectedAttributes} = this.getAllMatchableVisSchemaPatterns(this.state.selectedEntitesIndices[0], filteredData.length, false);

            const getDataCallback = (data: object[]) => {
                this.setState({
                    data: data,
                    filters: filters,
                    visSchemaMatchStatus: visSchemaMatchStatus,
                    visKeyOverride: false
                });
            }

            Connections.getDataByMatchAttrs(
                this.state.rendererSelectedAttributes, 
                visSchemaMatchStatus[this.state.selectedPatternIndex][this.state.selectedMatchResultIndexInPattern], 
                this.getProviderValues())
                    .then(getDataCallback.bind(this));
        }
    }

    // Helpers
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
        if (firstValidPatternIndex < 0) {
            return {
                visSchemaMatchStatus: matchStatusForAllSchema,
                selectedPatternIndex: -1,
                selectedMatchResultIndexInPattern: -1,
                rendererSelectedAttributes: [[], []]
            }
        }

        const firstMatchResultIndex = 0;

        // Find the first pattern-matching result that resulted in a match
        const firstValidPatternMatchStatus: PatternMatchResult = matchStatusForAllSchema[firstValidPatternIndex][firstMatchResultIndex];
        if (!firstValidPatternMatchStatus) {
            return {
            visSchemaMatchStatus: matchStatusForAllSchema,
            selectedPatternIndex: firstValidPatternIndex,
            selectedMatchResultIndexInPattern: -1,
            rendererSelectedAttributes: [[], []]
            }
        };
        
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
            selectedPatternIndex: (firstValidPatternIndex >= 0) ? firstValidPatternIndex : -1,
            selectedMatchResultIndexInPattern: firstMatchResultIndex,
            rendererSelectedAttributes: [mandatoryParamInitAtts, optionalParamInitAtts]
        };

        
    }

    getVisSchemaMatchesFromSelectedRelations = () => {
        return matchRelationWithAllVisPatterns(this.getProviderValues(), this.state.relationsList[this.state.relHierarchyIndices[0][0]]);
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
                    listLoaded: true,
                    visKeyOverride: false
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
            selectedEntitiesIndices: this.state.selectedEntitesIndices,
            selectedRelationsIndices: this.state.selectedRelationsIndices,
            relHierarchyIndices: this.state.relHierarchyIndices,
            visKeyOverride: this.state.visKeyOverride,
            showVisKeyCountConfirmModal: this.state.showVisKeyCountConfirmModal,
            selectedAttributesIndices: this.state.rendererSelectedAttributes
        };
    }

    render() {
        const providerValues = this.getProviderValues();

        return (
            <DBSchemaContext.Provider value={providerValues}>
                {this.state.showStartingTableSelectModal ? 
                    <StartingTableSelectModal 
                        onClose={this.onCloseShowStartingTableSelectModal} onDatasetSchemaSelectChange={this.onDatasetSchemaSelectChange} /> 
                    : null}
                {this.state.showFilterSelectModal ? 
                    <FilterSelectModal 
                        onClose={this.onCloseShowFilterSelectModal}
                        filters={this.state.filters}
                        onFilterChange={this.onFilterChange} /> 
                    : null}

                {this.state.showVisKeyCountConfirmModal ? 
                    <VisKeyCountConfirmModal 
                        onClose={this.onCloseVisKeyCountConfirmModal}
                        onConfirm={this.onConfirmVisKeyCountConfirmModal}
                        onSelectFiltering={this.onSelectFilteringFromConfirmModal} /> 
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
                        onMatchResultIndexChange={this.onMatchResultIndexChange}
                        onSelectedAttributeIndicesChange={this.onSelectedAttributeIndicesChange}
                        onClickShowFilterSelectModal={this.onClickShowFilterSelectModal}
                        onRelHierarchyChange={this.onRelHierarchyChange}
                        showVisKeyCountConfirmModal={this.showVisKeyCountConfirmModal}
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