import * as React from 'react';
const ReactDOM = require('react-dom');
import SearchDropdownList from './UIElements';
import {ForeignKey, PrimaryKey, Table, Attribute} from './ts/types'
import * as ComponentTypes from './ts/components';
import { DBSchemaContext } from './DBSchemaContext';
import { VisSchema } from './ts/vis-encodings';
import { Visualiser } from './Visualiser';
import * as Connections from './Connections';
import * as UIRenderers from './UIRenderers';

class JunctionTableLinks extends React.Component<ComponentTypes.JunctionTableLinksProps, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        let selectedEntity = this.props.selectedEntity as Table;
        let foreignKeyList = selectedEntity.fk;
        let fkListNode = foreignKeyList.map(fk => {
            return (
                <FixedAttributeSelector key={fk.oid} entity={selectedEntity} fk={fk} />
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
        console.log(el.target);
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
                    let fkEntity = getEntityFromOID(context.allEntitiesList, fk.confrelid)
                    return (<div className="mt-1 mb-1">
                        <div className="text-muted">
                            <div className="dropdown-tip bg-tip-fk d-inline-block">
                                <i className="fas fa-link me-2" />{fk.conname}
                            </div>
                            <div className="ms-1 tip-fontsize d-inline-block">
                            <i className="fas fa-arrow-right" />
                            </div>
                        </div>
                        <div className="ms-2">
                            <AttributeListSelector 
                                dropdownList={fkEntity.attr}
                                onListSelectionChange={this.onAttributeSelectionChange}
                                prependText={fk.confname}
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
                        updateListHandler={this.props.updateOnTableListFocus}
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
            let selectedFkOID = this.props.state
                .allEntitiesList[this.props.state.selectedTableIndex]
                .fk[this.props.state.selectedForeignKeyIndex].confrelid
            return (
                <div className="row mt-2 ms-4 position-relative">
                    <SearchDropdownList placeholder="Select Attribute 2..." 
                        prependText="a2" dropdownList={getAttrsFromOID(this.props.state.allEntitiesList, selectedFkOID)} 
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

    tableHasPKAndFK = (table: Table) => {
        // Return nothing if no PK/FK exist
        if (!table.pk) return false;
        if (!table.pk.conkey || table.pk.conkey.length === 0) {
            return false;
        }
        if (!table.fk || table.fk.length === 0) {
            return false;
        }

        let fkHasLength = false;
        for (var i = 0; i < table.fk.length; i++) {
            if (table.fk[i].conkey.length != 0) {
                fkHasLength = true;
                break;
            }
        }

        return fkHasLength;
    }

    /**
     * Find out if the entity is a weak entity, and if so, which entity does it lead to.
     * @param table Table in question
     * @returns Empty array if the entity is not a weak entity. Otherwise the array contains all foreign keys 
     * that formed a subset of the primary key. 
     */
    getWeakEntityStatus = (table: Table) => {
        // An entity is a weak entity if:
        // > It has a compound key
        // > A proper subset of those key attributes are foreign
        // First - check the existance of PK/FK
        if (!this.tableHasPKAndFK) return [];
        const conkeyLength = table.pk ? table.pk.conkey.length : 0;

        let subsetKeyIdx: number[] = []; // TODO: should I also pass this on?
        for (let i = 0; i < table.fk.length; i++) {
            let fkElem = table.fk[i];
            let fkKeys = fkElem.conkey;
            if (fkKeys.length >= conkeyLength) {
                // If this key is longer than the primary key it self, it is not a proper subset
                continue;
            } else {
                if (fkKeys.every(val => table.pk.conkey.includes(val))) {
                    // This is a proper subset
                    subsetKeyIdx.push(i);
                }
            }
        }

        return subsetKeyIdx;
    }

    tableIsJunction = (table: Table) => {
        // Return nothing if no PK/FK exist
        if (!this.tableHasPKAndFK(table)) return false;

        // Return if there is less than 2 foreign keys
        if (table.fk.length < 2) {
            return false;
        }

        // This entity might be a link table between many-to-many relationships
        // For each FK, check if the PK set covered all of its constraints
        var fkMatchCount = 0;
        var comparedFKKeys = []; // Keeping track for duplicates
        table.fk.forEach(element => {
            // If this FK is a subset of the PK
            let thisTableKey = element.conkey as [number];
            for (let comparedIndex = 0; comparedIndex < comparedFKKeys.length; comparedIndex++) {
                const comparedKey = comparedFKKeys[comparedIndex] as [number];
                if (thisTableKey.length === comparedKey.length) {
                    if (thisTableKey.every(v => comparedKey.includes(v))) {
                        return false;
                    }
                }
            }

            if (thisTableKey.every(v => table.pk.conkey.includes(v))) {
                comparedFKKeys.push(thisTableKey);
                fkMatchCount++;
            }
        });

        if (fkMatchCount >= 2) {
            // This is a many-to-many link table
            // TODO: do things
            return true;
        } else {
            return false;
        }
            
    }

    TEMPcheckVisualisationPossibility = () => {
        let selectedEntity = this.state.allEntitiesList[this.state.selectedTableIndex];
        // TODO: implement other vis types
        // For demo: simple entity
        if ((!selectedEntity.hasOwnProperty("weakEntitiesIndices") || selectedEntity.weakEntitiesIndices.length === 0) && 
            (!selectedEntity.hasOwnProperty("isJunction") || !selectedEntity.isJunction)) {
            
            let selectedAttributes: Attribute[] = [];
            let TEMPattCount = 2;
            selectedEntity.attr.forEach(att => {
                // TODO: .d.ts the typcategories
                if (att.typcategory === "N") {
                    selectedAttributes.push(att);
                }
            });

            Connections.getTableDistCounts(selectedEntity.relname, selectedAttributes.map(e => e.attname)).then(res => {
                console.log(res);
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

    updateOnTableListFocus = () => {
        if (this.state.allEntitiesList.length !== 0) {
            return;
        }

        this.setState({
            load: true
        }, () => {
            let entitiesListPromise = Connections.getAllTableMetadata();

            Promise.resolve(entitiesListPromise).then(res => {
                let entitiesList = this.preprocessEntities(res);
                this.setState({
                    allEntitiesList: entitiesList
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
        if (this.state.selectedTableIndex >= 0 && this.state.selectedAttributeIndex >= 0) {
            // -- 2 -- A second entity/attribute pair have been selected
            if (this.state.selectedForeignKeyIndex >= 0 && this.state.selectedFKAttributeIndex >= 0) {
                // TODO
                return;
            } else {
                // Single attribute: bar chart (more to be implemented)
                // Check attribute data type
                let tableAttributes = this.state.allEntitiesList[this.state.selectedTableIndex].attr;
                let attributeEntry = tableAttributes[this.state.selectedAttributeIndex];
                let attributeTypeCat = attributeEntry.typcategory;
                let tableIndex = this.state.selectedTableIndex;
                if (attributeTypeCat === "N") {
                    // TODO: Fitting the new table list
                    // If it is a number, retrieve data from database
                    fetch("http://localhost:3000/temp-data-table-name-fields", {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        method: "POST",
                        body: JSON.stringify({
                            "tableName": this.state.allEntitiesList[tableIndex].relname,
                            "fields": [
                                attributeEntry.attname
                            ]
                        }),
                    }).then(rawResponse => rawResponse.json())
                    .then(data => {
                        console.log(data);
                    })
                }
            }
        } else {
            return;
        }
    }

    preprocessEntities(tableList: Table[]) {
        tableList.forEach((item: Table, _) => {
            if (this.tableIsJunction(item)) {
                item.isJunction = true;
            }
            else {
                item.weakEntitiesIndices = this.getWeakEntityStatus(item);
                // Check if this entity is a weak entity
                if (item.weakEntitiesIndices.length > 0) {
                    // TODO
                } else {
                    // TODO
                }
            }
        });

        return tableList;
    }

    async componentDidMount() {
        // Can even do some loading screen stuff here
        await readVisSchemaJSON();
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
                    updateOnTableListFocus={this.updateOnTableListFocus}
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

const getAttrsFromOID = (entities: Table[], oid: number) => {
    return getEntityFromOID(entities, oid).attr;
}

// TODO: refactor this to another file?
