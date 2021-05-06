import * as React from 'react';
const ReactDOM = require('react-dom');

import SearchDropdownList from './UIElements';
import {Attribute, ForeignKey, Table, VisSchema, 
    VISSCHEMATYPES, VISPARAMTYPES} from './ts/types'
import { DBSchemaContext } from './DBSchemaContext';
import { Visualiser } from './Visualiser';

import * as ComponentTypes from './ts/components';
import * as Connections from './Connections';
import * as UIRenderers from './UIRenderers';
import * as SchemaParser from './SchemaParser';


class JunctionTableLinks extends React.Component<ComponentTypes.JunctionTableLinksProps, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        let selectedEntity = this.props.selectedEntity as Table;
        let foreignKeyList = selectedEntity.fk;
        let fkListNode = foreignKeyList.map(fk => {
            return (
                <FixedAttributeSelector key={fk.keyName} entity={selectedEntity} fk={fk} />
            );
        });
        return (
            <div className="col">
                {fkListNode}
            </div>
        );
    }
}

class AttributeListSelector extends React.Component<ComponentTypes.AttributeListSelectorProps, {}> {
    constructor(props) {
        super(props);
    }

    attributeArrayRendererHandler = (item, index, onClickCallback, selectedIndex) => {
        return UIRenderers.attributeArrayRenderer(item, index, onClickCallback, selectedIndex, this.props.tablePrimaryKey, this.props.tableForeignKeys);
    }

    render() {
        return (
        <div className="row mt-2 ms-4 position-relative">
            <SearchDropdownList placeholder="Select Attribute 1..." 
                prependText={this.props.prependText} dropdownList={this.props.dropdownList} 
                selectedIndex={this.props.selectedIndex}
                onListSelectionChange={this.props.onListSelectionChange}
                arrayRenderer={this.attributeArrayRendererHandler}
                />
        </div>
        )
    }
}

class FixedAttributeSelector extends React.Component<ComponentTypes.FixedAttributeSelectorProps, {selectedAttributeIndex?: number}> {
    constructor(props) {
        super(props);
        this.state = {
            selectedAttributeIndex: -1
        }
    }

    onAttributeSelectionChange = (el: React.BaseSyntheticEvent) => {
        this.setState({
            selectedAttributeIndex: el.target.getAttribute("data-index")
        }); // TODO
    }

    render() {
        let thisEntity = this.props.entity as Table;
        let fk = this.props.fk as ForeignKey;

        return (
            <DBSchemaContext.Consumer>
                {(context) => {
                    let fkEntity = getEntityFromTableName(context.allEntitiesList, fk.pkTableName)
                    return (<div className="mt-1 mb-1">
                        <div className="text-muted">
                            <div className="dropdown-tip bg-tip-fk d-inline-block">
                                <i className="fas fa-link me-2" />{fk.keyName}
                            </div>
                            <div className="ms-1 tip-fontsize d-inline-block">
                            <i className="fas fa-arrow-right" />
                            </div>
                        </div>
                        <div className="ms-2">
                            <AttributeListSelector 
                                dropdownList={fkEntity.attr}
                                onListSelectionChange={this.onAttributeSelectionChange}
                                prependText={fk.pkTableName}
                                selectedIndex={this.state.selectedAttributeIndex}
                                tableForeignKeys={fkEntity.fk}
                                tablePrimaryKey={fkEntity.pk}
                            />
                        </div>
                    </div>);
                    }
                }
            </DBSchemaContext.Consumer>
        )
    }
}

class EntitySelector extends React.Component<ComponentTypes.EntitySelectorProps> {
    constructor(props) {
        super(props);
    }

    attributeArrayRendererHandler = (item, index, onClickCallback, selectedIndex) => {
        let selectedEntity = this.props.state.allEntitiesList[this.props.state.selectedTableIndex];
        return UIRenderers.attributeArrayRenderer(item, index, onClickCallback, selectedIndex, selectedEntity.pk, selectedEntity.fk);
    }

    entityArrayRendererHandler = (item: Table, index: number, onClickCallback: React.MouseEventHandler<HTMLAnchorElement>) => {
        return UIRenderers.entityArrayRenderer(item, index, onClickCallback, this.props.state.selectedTableIndex);
    }

    /* React components for entity selectors */
    entitiesListNode = () => {
        let selectedEntity = this.props.state.allEntitiesList[this.props.state.selectedTableIndex] as Table;
        let selectedIsJunction = selectedEntity ? selectedEntity.isJunction : false;
        return (<div className="row">
            <div className="col">
                <div className="row position-relative">
                    <SearchDropdownList placeholder="Select Entity 1..." 
                        prependText="E1" dropdownList={this.props.state.allEntitiesList} 
                        selectedIndex={this.props.state.selectedTableIndex}
                        onListSelectionChange={this.props.onTableSelectChange}
                        arrayRenderer={this.entityArrayRendererHandler}
                        />

                </div>
                {
                    // Display the linked tables if the selected table is a junction table
                    selectedIsJunction 
                    ? <div className="row ms-4">
                        <JunctionTableLinks selectedEntity={selectedEntity} />
                    </div>
                    : null
                }
            </div>
        </div>)
    }

    attributeListNode = () => {
        let selectedTable = this.props.state.allEntitiesList[this.props.state.selectedTableIndex];
        if (this.props.state.selectedTableIndex >= 0) {
            return (
                <AttributeListSelector 
                    dropdownList={selectedTable.attr}
                    selectedIndex={this.props.state.selectedAttributeIndex}
                    onListSelectionChange={this.props.onAttributeSelectChange}
                    tablePrimaryKey={selectedTable.pk}
                    tableForeignKeys={selectedTable.fk}
                    prependText="a1"
                />
            )
        } else {
            return null;
        }
    }

    foreignKeyNode = () => 
        this.props.state.selectedTableIndex >= 0 
        ? (
            <div className="row mt-2 position-relative">
                <SearchDropdownList placeholder="Select Entity 2..." 
                    prependText="E2" 
                    dropdownList={this.props.state.allEntitiesList[this.props.state.selectedTableIndex].fk}
                    selectedIndex={this.props.state.selectedForeignKeyIndex}
                    onListSelectionChange={this.props.onForeignKeySelectChange}
                    arrayRenderer={UIRenderers.FKArrayRenderer}
                    />
            </div>
        ) 
        : null;

    fkAttributeListNode = () => {
        if (this.props.state.selectedForeignKeyIndex >= 0) {
            let selectedFkName = this.props.state
                .allEntitiesList[this.props.state.selectedTableIndex]
                .fk[this.props.state.selectedForeignKeyIndex].pkTableName
            return (
                <div className="row mt-2 ms-4 position-relative">
                    <SearchDropdownList placeholder="Select Attribute 2..." 
                        prependText="a2" dropdownList={getAttrsFromTableName(this.props.state.allEntitiesList, selectedFkName)} 
                        selectedIndex={this.props.state.selectedFKAttributeIndex}
                        onListSelectionChange={this.props.onFKAttributeSelectChange}
                        arrayRenderer={this.attributeArrayRendererHandler}
                        />
                </div>
            ) 
        } else {
            return null;
        }
    }

    render() {
        return (
            <div className="col dropdown-custom-text-wrapper">
                {/* TODO: logic to be changed */}
                {this.entitiesListNode()}
                {this.props.state.selectedTableIndex >= 0 ? this.attributeListNode() : null}
                {this.props.state.selectedTableIndex >= 0 ? this.foreignKeyNode() : null}
                {this.props.state.selectedTableIndex >= 0 && this.props.state.selectedForeignKeyIndex >= 0 ? this.fkAttributeListNode() : null}
            </div>
        )
    }
}
class Application extends React.Component<{}, ComponentTypes.ApplicationStates> {
    constructor(props) {
        super(props);

        this.state = {
            allEntitiesList: [],
            selectedTableIndex: -1,
            selectedAttributeIndex: -1,
            selectedForeignKeyIndex: -1,
            selectedFKAttributeIndex: -1,
            load: false
        };
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
                        console.log(schema);
                    }
                    // For each schema, compare
                }
            })
            // let selectedAttributes: Attribute[] = [];
            // selectedEntity.attr.forEach(att => {
            //     // TODO: .d.ts the typcategories
            //     if (att.typcategory === "N") {
            //         selectedAttributes.push(att);
            //     }
            // });

            // Connections.getTableDistCounts(selectedEntity.relname, selectedAttributes.map(e => e.attname)).then(res => {
            //     console.log(res);
            // });
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
                    relationsList: preprocessResult.relationsList
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
            <DBSchemaContext.Provider value={{allEntitiesList: this.state.allEntitiesList}}>
                <div className="row g-0">
                    <EntitySelector state={this.state} 
                    onTableSelectChange={this.onTableSelectChange}
                    onAttributeSelectChange={this.onAttributeSelectChange}
                    onFKAttributeSelectChange={this.onFKAttributeSelectChange}
                    onForeignKeySelectChange={this.onForeignKeySelectChange}
                    />
                    <Visualiser selectedTableIndex={this.state.selectedTableIndex} />
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

const getEntityFromOID = (entities: Table[], oid: number) => {
    let fkRelIndex;
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].oid === oid) {
            fkRelIndex = i;
            break;
        }
    }

    return entities[fkRelIndex];
}

const getEntityFromTableName = (entities: Table[], tableName: string) => {
    let fkRelIndex;
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].tableName === tableName) {
            fkRelIndex = i;
            break;
        }
    }

    return entities[fkRelIndex];
}

const getAttrsFromOID = (entities: Table[], oid: number) => {
    return getEntityFromOID(entities, oid).attr;
}

const getAttrsFromTableName = (entities: Table[], tableName: string) => {
    return getEntityFromTableName(entities, tableName).attr;
}

// TODO: refactor this to another file?
