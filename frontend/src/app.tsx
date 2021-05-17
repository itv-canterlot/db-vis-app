import * as React from 'react';
import ReactDOM = require('react-dom');

import {Attribute, RelationNode, Table, VisKey, VISPARAMTYPES, VisSchema, VISSCHEMATYPES} from './ts/types'
import { DBSchemaContext } from './DBSchemaContext';
import { AppMainCont } from './AppMainCont';

import { AppSidebar, StartingTableSelectModal } from './AppSidebar';


import * as ComponentTypes from './ts/components';
import * as Connections from './Connections';
import * as SchemaParser from './SchemaParser';

const preciseNumDataTypes = [
    "bit", "tinyint", "smallint", "int", "bigint", "decimal",
    "money", "smallmoney", "integer", "numeric", "dec", "fixed"
];

const approxNumDataTypes = ["float", "real", "double precision", "double"];

const dateAndTimeDataTypes = ["date", "time", "datetime2", "datetimeoffset", "smalldatetime", "datetime", "year", "timestamp"];

const charDataTypes = [
    "char", "varchar", "character varying", "text", "varchar(max)", "nchar", "nvchar", "ntext"
];

const binaryDataTypes = ["binary", "varbinary", "varbinary(max)", "image"];

const otherScalarDataTypes = ["rowversion", "uniqueidentifier", "cursor", "table", "sql_variant"];

const scalarDataTypes = [preciseNumDataTypes, approxNumDataTypes, otherScalarDataTypes];

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
        const attTypName = att.typname;
        for (let dts of scalarDataTypes) {
            for (let dt of dts) {
                if (dt.toLowerCase() === attTypName.toLowerCase()) {
                    return true;
                }
            }
        }

        return false;
    }

    isAttributeTemporal = (att: Attribute) => {
        for (let dt of dateAndTimeDataTypes) {
            if (dt.toLowerCase() === att.typname.toLowerCase()) {
                return true;
            }
        }

        return false;
    }

    isAttributeLexical = (att: Attribute) => {
        // TODO
        return false;
    }

    isAttributeColor = (att: Attribute) => {
        // TODO
        return false;
    }

    isAttributeGeographical = (att: Attribute) => {
        // TODO
        return false;
    }

    basicKeyConditionCheck = (table: Table, keys: VisKey) => {
        // Check if there *is* a key
        if (table.pk.columns.length < 1) return false;

        const keyMinCount = keys.minCount,
            keyMaxCount = keys.maxCount,
            tableKeyCount = table.pk.keyCount;
        // Count checks
        if (keyMaxCount) {
            if (tableKeyCount > keyMaxCount) return false;
        }
        if (tableKeyCount < keyMinCount) return false;
        

        // Key type check
        if (keys.type) {
            for (let pkCol of table.pk.columns) {
                const thisAttr = table.attr[pkCol.colPos]
                if (keys.type === VISPARAMTYPES.TEMPORAL) {
                    if (!this.isAttributeTemporal(thisAttr)) {
                        return false;
                    }
                } else if (keys.type === VISPARAMTYPES.LEXICAL) {
                    if (table.pk.columns.length > 1) return false;
                    if (!this.isAttributeLexical(thisAttr)) {
                        return false;
                    }
                } else if (keys.type === VISPARAMTYPES.COLOR) {
                    // Assumption: there's only one key column for colour?
                    if (table.pk.columns.length > 1) return false;
                    if (!this.isAttributeLexical(thisAttr)) return false;
                } else if (keys.type === VISPARAMTYPES.GEOGRAPHICAL) {
                    if (!this.isAttributeGeographical(thisAttr)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    weKeyConditionCheck = (table: Table, keys: VisKey) => {
        
    }

    matchTableWithRel(table: Table, rel: RelationNode, vs:VisSchema) {
        if (!table.pk) return false; // Not suitable if there is no PK to use

        switch (vs.type) {
            case VISSCHEMATYPES.BASIC:
                if (!this.basicKeyConditionCheck(table, vs.keys)) {
                    return false;
                }
                
                // Find combinations of attributes that match the requirements
                let allMatchableParameters: number[][] = [];
                
                // For each attribute in vs, compare against each attr in table, add appropriate indices to list
                for (let mp of vs.mandatoryParameters) {
                    let thisConstMatchableIndices: number[] = [];
                    for (let i = 0; i < table.attr.length; i++) {
                        const thisAttr = table.attr[i];
                        // Skip pks(?)
                        if (table.pk.columns.map(col => col.colPos).includes(i)) continue;
                        // Check specific types first
                        if (mp.type) {
                            if (mp.type === VISPARAMTYPES.TEMPORAL) {
                                if (!this.isAttributeTemporal(thisAttr)) {
                                    continue;
                                }
                            } else if (mp.type === VISPARAMTYPES.LEXICAL) {
                                if (!this.isAttributeLexical(thisAttr)) {
                                    continue;
                                }
                            } else if (mp.type === VISPARAMTYPES.COLOR) {
                                if (!this.isAttributeLexical(thisAttr)) {
                                    continue;
                                };
                            } else if (mp.type === VISPARAMTYPES.GEOGRAPHICAL) {
                                if (!this.isAttributeGeographical(thisAttr)) {
                                    continue;
                                }
                            }
                        } else if (mp.scalar) {
                            if (!this.isAttributeScalar(thisAttr)) {
                                continue;
                            }
                        }

                        // Add this attribute to the list above
                        thisConstMatchableIndices.push(i);
                    }
                    allMatchableParameters.push(thisConstMatchableIndices);
                }

                // Check if there is at least one match for each mandatory attributes
                if (!allMatchableParameters.every(idxes => idxes.length > 0)) {
                    return false;
                }
                return true;
            case VISSCHEMATYPES.WEAKENTITY:
                return false;
            default:
                return false;
        }
    }

    getAllMatchableVisSchema = () => {
        // Break if not all the components had been initiated
        if (this.state.relationsList === undefined) return;
        if (visSchema === undefined) return;

        // Check type of the relation
        let selectedEntity = this.state.allEntitiesList[this.state.selectedTableIndex];
        let entityRel = SchemaParser.getRelationInListByName(this.state.relationsList, selectedEntity.tableName);
        
        visSchema.forEach(vs => {
            const matchResult = this.matchTableWithRel(selectedEntity, entityRel, vs);
            if (matchResult) console.log(vs);
        })
        
        // For demo: simple entity
        if ((!selectedEntity.hasOwnProperty("weakEntitiesIndices") || selectedEntity.weakEntitiesIndices.length === 0) && 
            (!selectedEntity.hasOwnProperty("isJunction") || !selectedEntity.isJunction)) {
            if (selectedEntity.pk) {
                let pkAtts = selectedEntity.pk.columns.map(key => selectedEntity.attr[key.colPos].attname);
                Connections.getTableDistCounts(selectedEntity.tableName, pkAtts).then(distCountRes => {
                    return Math.max(distCountRes.map(count => count.distinct_count));
    
                }).then(maxDistCount => {
                    // TODO: colours not checked - need additional markup
                    // TODO: list of schemas - use all of them
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
