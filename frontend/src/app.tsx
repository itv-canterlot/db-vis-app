const React = require('react');
const ReactDOM = require('react-dom');
import { closeSync } from 'node:fs';
import SearchDropdownList from './UIElements';

class FixedAttributeSelector extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let thisEntity = this.props.entity as Table;
        let fk = this.props.fk as ForeignKey;
        return (
            <div className="mt-1 mb-1">
                <div className="text-muted">
                    <div className="dropdown-tip bg-tip-fk d-inline-block">
                        <i className="fas fa-link me-2" />{fk.conname}
                    </div>
                    <div className="ms-1 tip-fontsize d-inline-block">
                    <i className="fas fa-arrow-right" />
                    </div>
                </div>
                <div className="ms-2">
                    {fk.confname}
                </div>
            </div>
        )
    }
}

class JunctionTableLinks extends React.Component {
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

class EntitySelector extends React.Component {
    constructor(props) {
        super(props);
    }

    attributeArrayRenderer = (item, index, onClickCallback, selectedIndex) => {
        let itemIsPrimaryKey = false;
        let itemIsForeignKey = false;
        let pkConstraintName;
        let fkConstraintNames = [];
        if (this.props.state.tablePrimaryKeys) {
            if (this.props.state.tablePrimaryKeys.conkey.includes(item.attnum)) {
                itemIsPrimaryKey = true;
                pkConstraintName = this.props.state.tablePrimaryKeys.conname;
            }
        }
        if (this.props.state.tableForeignKeys) {
            this.props.state.tableForeignKeys.forEach(cons => {
                if (cons.conkey.includes(item.attnum)) {
                    itemIsForeignKey = true;
                    fkConstraintNames.push(cons.conname);
                }
            });
        }
        return <a className={"d-flex dropdown-item" + (index == selectedIndex ? " active" : "") + (itemIsPrimaryKey ? " disabled" : "")} 
            data-key={index} data-index={index} data-content={item.attname} key={item.attnum} href="#" onMouseDown={onClickCallback}>
                <div className="d-flex">
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

    FKArrayRenderer = (item, index, onClickCallback, selectedIndex) => { 
        return <a className={"d-flex dropdown-item" + (index == selectedIndex ? " active" : "")} 
            data-key={item.confrelid} data-index={index} data-content={item.confname} key={index} href="#" onMouseDown={onClickCallback}>
                <div className="d-flex">
                {item.confname}
                </div>
                <div className="d-flex ms-auto">
                    <div className="me-1 text-muted dropdown-tip bg-tip-fk" key={index}>fk: <em>{item.conname}</em></div>
                </div>
            </a>
    }

    entityArrayRenderer = (item: Table, index, onClickCallback) => { 
        let oid = item.oid;
        let relname = item.relname;
        return <a className={"dropdown-item" + (index == this.props.selectedIndex ? " active" : "")} 
            data-key={oid} data-index={index} data-content={relname} key={index} href="#" onMouseDown={onClickCallback}>
                {item.isJunction? <i className="fas fa-compress-alt me-1" /> : null}{relname}
            </a>
    }

    /* React components for entity selectors */
    entitiesListNode = () => {
        let selectedEntity = this.props.state.allEntitiesList[this.props.state.selectedTableIndex] as Table;
        let selectedIsJunction = selectedEntity ? selectedEntity.isJunction : false;
        return (<div className="row">
            <div className="col">
                <div className="row">
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

    attributeListNode = () => 
        this.props.state.selectedTableIndex >= 0
        ? (
            <div className="row mt-2 ms-4">
                <SearchDropdownList placeholder="Select Attribute 1..." 
                    prependText="a1" dropdownList={this.props.state.tableAttributes} 
                    selectedIndex={this.props.state.selectedAttributeIndex}
                    onListSelectionChange={this.props.onAttributeSelectChange}
                    arrayRenderer={this.attributeArrayRenderer}
                    />
            </div>
        ) 
        : null;

    foreignKeyNode = () => 
        this.props.state.selectedTableIndex >= 0 
        ? (
            <div className="row mt-2">
                <SearchDropdownList placeholder="Select Entity 2..." 
                    prependText="E2" 
                    dropdownList={this.props.state.tableForeignKeys}
                    selectedIndex={this.props.state.selectedForeignKeyIndex}
                    onListSelectionChange={this.props.onForeignKeySelectChange}
                    arrayRenderer={this.FKArrayRenderer}
                    />
            </div>
        ) 
        : null;

    fkAttributeListNode = () => 
        this.props.state.selectedForeignKeyIndex >= 0 
        ? (
            <div className="row mt-2 ms-4">
                <SearchDropdownList placeholder="Select Attribute 2..." 
                    prependText="a2" dropdownList={this.props.state.frelAtts[this.props.state.selectedForeignKeyIndex]} 
                    selectedIndex={this.props.state.selectedFKAttributeIndex}
                    onListSelectionChange={this.props.onFKAttributeSelectChange}
                    arrayRenderer={this.attributeArrayRenderer}
                    />
            </div>
        ) 
        : null;

    render() {
        return (
            <div className="col dropdown-custom-text-wrapper">
                {this.entitiesListNode()}
                {this.attributeListNode()}
                {this.foreignKeyNode()}
                {this.fkAttributeListNode()}
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

interface Table {
    oid: number,
    relname: string,
    pk?: PublicKey,
    fk?: [ForeignKey],
    isJunction: boolean
}

interface Key {
    oid: number,
    conname: string,
    conkey: number[],
    condef: string
}

interface PublicKey extends Key { }

interface ForeignKey extends Key {
    confrelid: number,
    confkey: number[],
    confname: string
}

class Application extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            allEntitiesList: [],
            selectedTableIndex: -1,
            selectedTableOID: -1,
            selectedAttributeIndex: -1,
            selectedForeignKeyIndex: -1,
            selectedFKAttributeIndex: -1,
            tableAttributes: [],
            tableForeignKeys: [],
            frelAtts: []
        };
    }

    // TO BE DEPRECATED
    getEntityRelationshipType = () => {
        let pkConKey = this.state.tablePrimaryKeys.conkey
        let pkConKeySet = new Set(pkConKey);

        // Return nothing if no PK exist
        if (!pkConKey || pkConKey.size === 0) {
            // TODO: implement this
            console.log("No primary key");
            return undefined;
        }

        if (!this.state.tableForeignKeys) {
            // TODO: check this
            console.log("No foreign keys");
            return undefined;
        }

        let fkConKeys = this.state.tableForeignKeys.map(e => e.conkey);
        
        if (this.state.tableForeignKeys.length < 2) {
            // If there is none or one foreign key, TODO
        } else {
            // This entity might be a link table between many-to-many relationships
            // For each FK, check if the PK set covered all of its constraints
            var fkMatchCount = 0;
            this.state.tableForeignKeys.forEach(element => {
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
        }, () => {
            getAttributeContentFromDatabase(tableKey)
                .then(attributeContent => {
                    // this.props.attributeHandler(attributeContent);
                    this.setState({
                        tableAttributes: attributeContent["tableAttributes"],
                        tableForeignKeys: attributeContent["tableForeignKeys"],
                        tablePrimaryKeys: attributeContent["tablePrimaryKeys"],
                        frelAtts: attributeContent["frelAtts"]
                    });

                    let thisRelationshipType = this.getEntityRelationshipType() as EntityRelationshipTypes;
                    if (thisRelationshipType == EntityRelationshipTypes.ManyToMany) {
                        // Do things here
                    }
                });
            
            this.setState({
                load: false
            });
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
            let entitiesListPromise = this.getAllTableNames();

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
                let attributeEntry = this.state.tableAttributes[this.state.selectedAttributeIndex];
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

    getAllTableNames = () => {
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
            <div className="row g-0">
                <EntitySelector state={...this.state} 
                onTableSelectChange={this.onTableSelectChange}
                onAttributeSelectChange={this.onAttributeSelectChange}
                onFKAttributeSelectChange={this.onFKAttributeSelectChange}
                onForeignKeySelectChange={this.onForeignKeySelectChange}
                updateOnTableListFocus={this.updateOnTableListFocus}
                />
                <Visualiser />
            </div>
        );
    }
}

let appContNode = document.getElementById("app-cont");
ReactDOM.render(<Application />, appContNode);

async function getAttributeContentFromDatabase(tableIndex) {
    const rawResponse = fetch("http://localhost:3000/temp-db-table-foreign-keys", {
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
