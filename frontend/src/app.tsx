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

        this.state = {
            allEntitiesList: [],
            selectedTableIndex: -1,
            selectedAttributeIndex: -1,
            tableAttributes: []
        };
    }

    tableSelectChanged = (e) => {
        let tableIndex = e.target.getAttribute("data-index");
        let tableKey = e.target.getAttribute("data-key");

        if (tableIndex < 0) return;

        this.setState({
            selectedTableIndex: tableIndex,
            load: true
        }, () => {
            getAttributeContentFromDatabase(tableKey)
                .then(attributeContent => {
                    this.props.attributeHandler(attributeContent);
                    this.setState({
                        tableAttributes: attributeContent["tableAttributes"]
                    })
                });
            
            this.setState({
                load: false
            });
        });
    }

    attributeSelectChanged = (e) => {
        let attributeIndex = e.target.getAttribute("data-index");

        if (attributeIndex < 0) return;

        this.setState({
            selectedAttributeIndex: attributeIndex
        });
        console.log(attributeIndex);
    }

    updateOnTableListFocus = () => {
        if (this.state.allEntitiesList.length !== 0) {
            return;
        }

        this.setState({
            load: true
        }, () => {
            let entitiesListPromise = this.props.getEntityList();

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

    render() {
        return (
            <div className="col">
                <div className="dropdown-custom-text-wrapper">
                    <SearchDropdownList placeholder="Select Entity 1..." 
                        prependText="R1" dropdownList={this.state.allEntitiesList} 
                        updateListHandler={this.updateOnTableListFocus}
                        selectedIndex={this.state.selectedTableIndex}
                        onListSelectionChange={this.tableSelectChanged}
                        />  
                    {
                        // Check if the first entity had been selected or not
                        this.state.selectedTableIndex >= 0 ?
                            (<div className="mt-2 ms-4">
                                <SearchDropdownList placeholder="Select Attribute 1..." 
                                    prependText="e1" dropdownList={this.state.tableAttributes} 
                                    // updateListHandler={this.updateOnTableListFocus}
                                    selectedIndex={this.state.selectedAttributeIndex}
                                    onListSelectionChange={this.attributeSelectChanged}
                                    arrayRenderer={this.attributeArrayRenderer}
                                    />
                            </div>) : null
                    }
                </div>
            </div>
        )
    }
}

class EntityBrowser extends React.Component {
    constructor(props) {
        super(props);

        // States
        this.state = {
            tableAttributes: [],
            selectedBaseTableAtt: undefined
        };
    }

    onChangeSelectedBaseTableAtt = (newAtt) => {
        this.setState({
            selectedBaseTableAtt: newAtt
        });
    }

    // Handles attribute list returned from EntitySelector, passed onto AttributeList
    attributeSelectHandler = (attributeContent) => {
        this.setState({
            tableAttributes: attributeContent["tableAttributes"],
            selectedBaseTableAtt: undefined
        })
        console.log(attributeContent); // TODO
    }

    baseTableAttSelectHander(attSelectId) {
        this.setState({
            selectedBaseTableAtt: attSelectId
        });
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
            <div className="col">
                <EntitySelector 
                    attributeHandler={this.attributeSelectHandler}
                    getEntityList={this.getAllTableNames}
                     />
                <AttributeList tableAttributes={this.state.tableAttributes}
                    selectedBaseTableAtt={this.state.selectedBaseTableAtt}
                    onChangeSelectedBaseTableAtt={this.onChangeSelectedBaseTableAtt} />
            </div>
        )
    }
}

class Application extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <EntityBrowser />
        );
    }
}

// TODO: Will move to its parent once visualisation is implemented
let tableSchemaList = document.getElementById("table-schema-list-cont");
ReactDOM.render(<Application />, tableSchemaList);



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