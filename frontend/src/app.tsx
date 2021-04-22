const React = require('react');
const ReactDOM = require('react-dom');
import { closeSync } from 'node:fs';
import SearchDropdownList from './UIElements';

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

    entitiesListNode = () => 
    (<div className="row">
        <SearchDropdownList placeholder="Select Entity 1..." 
            prependText="E1" dropdownList={this.props.state.allEntitiesList} 
            updateListHandler={this.props.updateOnTableListFocus}
            selectedIndex={this.props.state.selectedTableIndex}
            onListSelectionChange={this.props.onTableSelectChange}
            />
    </div>)

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
``    }

    
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
                        tablePrimaryKeys: attributeContent["tablePrimaryKeys"][0],
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
            })
            
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
                if (attributeTypeCat === "N") {
                    // If it is a number, retrieve data from database
                    fetch("http://localhost:3000/temp-data-table-name-fields", {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        method: "POST",
                        body: JSON.stringify({
                            "tableName": this.state.allEntitiesList[tableOID],
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
        return fetch('http://localhost:3000/temp-db-table-list')
            .then(rawResponse => rawResponse.json())
            .then(tableList => {
                let tableListTranscribed = {};
                tableList.forEach((item, _) => {
                    tableListTranscribed[item.oid] = item.relname;
                })
                return tableListTranscribed;
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
