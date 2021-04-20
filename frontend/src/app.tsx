const React = require('react');
const ReactDOM = require('react-dom');
import SearchDropdownList from './UIElements';

class AttributeRow extends React.Component {
    constructor(props) {
        super(props);
    }

    onClickSelectButton = () => {
        // Do nothing if this element has already been selected
        if (this.props.isSelected) return; 
        this.props.onBaseTableAttSelect(this.props.attnum);
    }

    render() {
        return (
            <tr key={this.props.attnum}>
                <td>{this.props.attnum}</td>
                <td>{this.props.attname}</td>
                <td>{this.props.typname}</td>
                <td>
                    <button 
                        type="button" 
                        className={"btn " + (this.props.isSelected 
                            ? "btn-success" 
                            : "btn-primary")}
                        key={this.props.attnum}
                        onClick={this.onClickSelectButton}>
                        {this.props.isSelected
                            ? "Selected"
                            : "Select"
                        }
                    </button>
                </td>
            </tr>
        )
    }
}

class AttributeList extends React.Component {
    constructor(props) {
        super(props);
    }

    onBaseTableAttSelect = (attnum) => {
        this.props.onChangeSelectedBaseTableAtt(attnum)
    }
    
    render() {
        return (
            <div>
                <p className="h2" />
                <table className="table att-table">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Attribute name</th>
                            <th scope="col">Type</th>
                            <th scope="col" />
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.tableAttributes.map(item => (
                            <AttributeRow
                                key={item.attnum}
                                attnum={item.attnum}
                                attname={item.attname}
                                typname={item.typname}
                                isSelected={this.props.selectedBaseTableAtt == item.attnum}
                                onBaseTableAttSelect={this.onBaseTableAttSelect}
                             />
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }
}

class EntitySelector extends React.Component {
    constructor(props) {
        super(props);
    }

    attributeArrayRenderer = (item, index, onClickCallback, selectedIndex) => { 
        return <a className={"d-flex dropdown-item" + (index == selectedIndex ? " active" : "")} 
            data-key={index} data-index={index} data-content={item.attname} key={item.attnum} href="#" onMouseDown={onClickCallback}>
                <div className="d-flex">
                {item.attname}
                </div>
                <div className="d-flex ms-auto">
                    <em>
                        {item.typname}
                    </em>
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
                    <em>
                        {item.conname}
                    </em>
                </div>
            </a>
    }

    fkAttributeList = () => 
        this.props.state.selectedForeignKeyIndex >= 0 
        ? (
            <div className="mt-2 ms-4">
                <SearchDropdownList placeholder="Select Attribute 2..." 
                    prependText="e2" dropdownList={this.props.state.frelAtts[this.props.state.selectedForeignKeyIndex]} 
                    selectedIndex={this.props.state.selectedFKAttributeIndex}
                    onListSelectionChange={this.props.onFKAttributeSelectChange}
                    arrayRenderer={this.attributeArrayRenderer}
                    />
            </div>
        ) 
        : null;

    render() {
        return (
            <div className="col">
                <div className="dropdown-custom-text-wrapper">
                    <SearchDropdownList placeholder="Select Entity 1..." 
                        prependText="R1" dropdownList={this.props.state.allEntitiesList} 
                        updateListHandler={this.props.updateOnTableListFocus}
                        selectedIndex={this.props.state.selectedTableIndex}
                        onListSelectionChange={this.props.onTableSelectChange}
                        />  
                    {
                        // Check if the first entity had been selected or not
                        this.props.state.selectedTableIndex >= 0 ?
                            (<div>
                                <div className="mt-2 ms-4">
                                    <SearchDropdownList placeholder="Select Attribute 1..." 
                                        prependText="e1" dropdownList={this.props.state.tableAttributes} 
                                        selectedIndex={this.props.state.selectedAttributeIndex}
                                        onListSelectionChange={this.props.onAttributeSelectChange}
                                        arrayRenderer={this.attributeArrayRenderer}
                                        />
                                </div>
                                <div className="mt-2">
                                    <SearchDropdownList placeholder="Select Entity 2..." 
                                        prependText="R2" 
                                        dropdownList={this.props.state.tableForeignKeys}
                                        selectedIndex={this.props.state.selectedForeignKeyIndex}
                                        onListSelectionChange={this.props.onForeignKeySelectChange}
                                        arrayRenderer={this.FKArrayRenderer}
                                        />
                                </div>
                                <div>
                                    {this.fkAttributeList()}
                                </div>
                            </div>) : null
                    }
                </div>
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

class Application extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            allEntitiesList: [],
            selectedTableIndex: -1,
            selectedAttributeIndex: -1,
            selectedForeignKeyIndex: -1,
            selectedFKAttributeIndex: -1,
            tableAttributes: [],
            tableForeignKeys: [],
            frelAtts: []
        };
    }

    // Called when R1 is changed
    onTableSelectChange = (e) => {
        let tableIndex = e.target.getAttribute("data-index");
        let tableKey = e.target.getAttribute("data-key");

        if (tableIndex < 0) return;

        this.setState({
            selectedTableIndex: tableIndex,
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
                        frelAtts: attributeContent["frelAtts"]
                    })
                });
            
            this.setState({
                load: false
            });
        });
    }

    onAttributeSelectChange = (e) => {
        let attributeIndex = e.target.getAttribute("data-index");

        if (attributeIndex < 0) return;

        this.setState({
            selectedAttributeIndex: attributeIndex
        });
    }

    onFKAttributeSelectChange = (e) => {
        let attributeIndex = e.target.getAttribute("data-index");

        if (attributeIndex < 0) return;

        this.setState({
            selectedFKAttributeIndex: attributeIndex
        });
    }

    onForeignKeySelectChange = (e) => {
        let fkIndex = e.target.getAttribute("data-index");

        if (fkIndex < 0) return;

        this.setState({
            selectedForeignKeyIndex: fkIndex
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
                // Single attribute: bar chart (details to be implemented)
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
