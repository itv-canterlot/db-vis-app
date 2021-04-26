import * as React from 'react';
const ReactDOM = require('react-dom');
import SearchDropdownList from './UIElements';
import {ForeignKey, PrimaryKey, Table, Attribute} from './ts/types'
import * as ComponentTypes from './ts/components';
import {DBSchemaContext} from './DBSchemaContext'

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
        return attributeArrayRenderer(item, index, onClickCallback, selectedIndex, this.props.tablePrimaryKey, this.props.tableForeignKeys);
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

        console.log(fk);
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

    FKArrayRenderer = (item, index, onClickCallback, selectedIndex) => { 
        return <a className={"d-flex dropdown-item pe-auto" + (index == selectedIndex ? " active" : "")} 
            data-key={item.confrelid} data-index={index} data-content={item.confname} key={index} href="#" onMouseDown={onClickCallback}>
                <div className="d-flex pe-none">
                {item.confname}
                </div>
                <div className="d-flex ms-auto pe-none">
                    <div className="me-1 text-muted dropdown-tip bg-tip-fk" key={index}>fk: <em>{item.conname}</em></div>
                </div>
            </a>
    }

    entityArrayRenderer = (item: Table, index, onClickCallback) => { 
        let oid = item.oid;
        let relname = item.relname;
        // Check this.props.state.selectedIndex
        return <a className={"dropdown-item pe-auto" + (index == this.props.state.selectedTableIndex ? " active" : "")} 
            data-key={oid} data-index={index} data-content={relname} key={index} href="#" onMouseDown={onClickCallback}>
                {item.isJunction? <i className="fas fa-compress-alt me-1 pe-none" /> : null}{relname}
            </a>
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
                        arrayRenderer={this.entityArrayRenderer}
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
                    arrayRenderer={this.FKArrayRenderer}
                    />
            </div>
        ) 
        : null;

    attributeArrayRendererHandler = (item, index, onClickCallback, selectedIndex) => {
        let selectedEntity = this.props.state.allEntitiesList[this.props.state.selectedTableIndex];
        return attributeArrayRenderer(item, index, onClickCallback, selectedIndex, selectedEntity.pk, selectedEntity.fk);
    }

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

class Visualiser extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="col"></div>
        )
    }
}

enum EntityRelationshipTypes {
    OneToOne,
    OneToMany,
    ManyToMany
}

class Application extends React.Component<{}, ComponentTypes.ApplicationStates> {
    constructor(props) {
        super(props);

        this.state = {
            allEntitiesList: [],
            selectedTableIndex: -1,
            selectedTableOID: -1,
            selectedAttributeIndex: -1,
            selectedForeignKeyIndex: -1,
            selectedFKAttributeIndex: -1,
            load: false
        };
    }

    // TO BE DEPRECATED
    getEntityRelationshipType = () => {
        let selectedEntity = this.state.allEntitiesList[this.state.selectedTableIndex];
        let pkConKey = selectedEntity.pk.conkey;
        let fks = selectedEntity.fk;

        // Return nothing if no PK exist
        if (!pkConKey || pkConKey.length === 0) {
            // TODO: implement this
            console.log("No primary key");
            return undefined;
        }

        if (!fks) {
            // TODO: check this
            console.log("No foreign keys");
            return undefined;
        }

        let fkConKeys = fks.map(e => e.conkey);
        
        if (fks.length < 2) {
            // If there is none or one foreign key, TODO
        } else {
            // This entity might be a link table between many-to-many relationships
            // For each FK, check if the PK set covered all of its constraints
            var fkMatchCount = 0;
            fks.forEach(element => {
                // If this FK is a subset of the PK
                if (element.conkey.every(v => pkConKey.includes(v))) {
                    fkMatchCount++;
                }
            });
            
            if (fkMatchCount >= 2) {
                // This is a many-to-many link table
                // TODO: do things
                return EntityRelationshipTypes.ManyToMany;
            } else {
                return undefined;
            }
            
        }        
    }

    tableIsJunction = (table: Table) => {
        if (!table.pk) return false;
        let pkConKey = table.pk.conkey;
        // Return nothing if no PK/FK exist
        if (!pkConKey || pkConKey.length === 0) {
            return false;
        }

        if (!table.fk || table.fk.length < 2) {
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

            if (thisTableKey.every(v => pkConKey.includes(v))) {
                comparedFKKeys.push(thisTableKey);
                fkMatchCount++;
            }
        });

        if (fkMatchCount >= 2) {
            // This is a many-to-many link table
            // TODO: do things
            return EntityRelationshipTypes.ManyToMany;
        } else {
            return false;
        }
            
    }

    // Called when R1 is changed
    onTableSelectChange = (e) => {
        let tableIndex = parseInt(e.target.getAttribute("data-index"));
        let tableKey = parseInt(e.target.getAttribute("data-key"));

        if (tableIndex < 0) return;

        this.setState({
            selectedTableIndex: tableIndex,
            selectedTableOID: tableKey,
            selectedAttributeIndex: -1,
            selectedForeignKeyIndex: -1,
            selectedFKAttributeIndex: -1,
            load: true
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
            let entitiesListPromise = this.getAllTableMetadata();

            Promise.resolve(entitiesListPromise).then(res => {
                this.setState({
                    allEntitiesList: res
                });
            });
            
            this.setState({
                load: false
            });
        });
    }

    checkVisualisationPossibility = () => {
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
                let tableOID = this.state.selectedTableOID;
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

    getAllTableMetadata = () => {
        // TODO/Work under progress: new backend hook
        return fetch('http://localhost:3000/tables')
            .then(rawResponse => rawResponse.json())
            .then(tableList => {
                // Annotate each table based on its key relationships
                let tableListTranscribed = {}; // TODO: TO BE DEPRECATED
                tableList.forEach((item: Table, _) => {
                    if (this.tableIsJunction(item) == EntityRelationshipTypes.ManyToMany) {
                        item.isJunction = true;
                    }
                    tableListTranscribed[item.oid] = item.relname;
                });
                
                return tableList;
            });
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
                    <Visualiser />
                </div>
            </DBSchemaContext.Provider>

        );
    }
}

let appContNode = document.getElementById("app-cont");
ReactDOM.render(<Application />, appContNode);

async function getAttributeContentFromDatabase(tableIndex) {
    const rawResponse = fetch("http://localhost:3000/table-attributes", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            "oid": tableIndex
        }),
        
    })

    const response = rawResponse.then(val => {
        return val.json();
    })
    return response;
}

// TODO: set operation(s)
function symmetricDifference(setA, setB) {
    let _difference = new Set(setA)
    for (let elem of setB) {
        if (_difference.has(elem)) {
            _difference.delete(elem)
        } else {
            _difference.add(elem)
        }
    }
    return _difference
}

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
const attributeArrayRenderer = (item:Attribute, index: number, onClickCallback, selectedIndex: number, tablePrimaryKey?: PrimaryKey, tableForeignKeys?: ForeignKey[]) => {
    let itemIsPrimaryKey = false;
    let itemIsForeignKey = false;
    let pkConstraintName;
    let fkConstraintNames = [];
    if (tablePrimaryKey) {
        if (tablePrimaryKey.conkey.includes(item.attnum)) {
            itemIsPrimaryKey = true;
            pkConstraintName = tablePrimaryKey.conname;
        }
    }
    if (tableForeignKeys) {
        tableForeignKeys.forEach(cons => {
            if (cons.conkey.includes(item.attnum)) {
                itemIsForeignKey = true;
                fkConstraintNames.push(cons.conname);
            }
        });
    }

    return <a className={"d-flex dropdown-item pe-auto" + (index == selectedIndex ? " active" : "") + (itemIsPrimaryKey ? " disabled" : "")} 
        data-key={index} data-index={index} data-content={item.attname} key={item.attnum} href="#" onMouseDown={onClickCallback}>
            <div className="d-flex pe-none">
            {item.attname}
            </div>
            <div className="d-flex ms-auto align-items-center">
                {
                    // Print primary key prompt
                    itemIsPrimaryKey ?
                    <div className="me-1 text-muted dropdown-tip bg-tip-pk">pk: <em>{pkConstraintName}</em></div> :
                    null
                }
                {
                    // Print foreign key prompt(s)
                    itemIsForeignKey ?
                    fkConstraintNames.map((fkConstraintName, index) => {
                        return <div className="me-1 text-muted dropdown-tip bg-tip-fk" key={index}>fk: <em>{fkConstraintName}</em></div>;
                    }) :
                    null
                }
                <div className="bg-tip-type text-secondary dropdown-tip">
                    <em>
                    {item.typname}
                    </em>
                </div>
            </div>
        </a>
}