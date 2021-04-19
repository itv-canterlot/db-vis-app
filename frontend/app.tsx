const React = require('react');
const ReactDOM = require('react-dom');

class AttributeRow extends React.Component {
    constructor(props) {
        super(props);

        this.onClickSelectButton = this.onClickSelectButton.bind(this);
    }

    onClickSelectButton() {
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

        this.onBaseTableAttSelect = this.onBaseTableAttSelect.bind(this);
    }

    onBaseTableAttSelect(attnum) {
        this.props.onChangeSelectedBaseTableAtt(attnum)
    }
    
    render() {
        return (
            <div>
                <p className="h2" />
                <table className="table">
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

    tableSelectChanged = () => {
        let tableIndex = getTableIndexFromElement();

        if (tableIndex <= 0) return;

        this.setState({
            load: true
        }, () => {
            getAttributeContentFromDatabase(tableIndex)
                .then(attributeContent => {
                    this.props.attributeHandler(attributeContent);
                });
            
            this.setState({
                load: false
            });
        });
    }

    render() {
        return (
            <div className="col">
                <label htmlFor="table-select">Select a table:</label>
                <select name="table-select" id="table-list-select-dropdown" onChange={this.tableSelectChanged} defaultValue="-1">
                    <option oid="-1" value="-1" disabled>*Select a table*</option>
                </select>
                <div id="table-schema-list-cont"></div>
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
        
        // Binding handlers for child components
        this.attributeSelectHandler = this.attributeSelectHandler.bind(this);
        this.onChangeSelectedBaseTableAtt = this.onChangeSelectedBaseTableAtt.bind(this);
    }

    onChangeSelectedBaseTableAtt(newAtt) {
        this.setState({
            selectedBaseTableAtt: newAtt
        });
    }

    // Handles attribute list returned from EntitySelector, passed onto AttributeList
    attributeSelectHandler(attributeContent) {
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

    render() {
        return (
            <div className="col">
                <EntitySelector attributeHandler={this.attributeSelectHandler} />
                <AttributeList tableAttributes={this.state.tableAttributes}
                    selectedBaseTableAtt={this.state.selectedBaseTableAtt}
                    onChangeSelectedBaseTableAtt={this.onChangeSelectedBaseTableAtt} />
            </div>
        )
    }
}

let tableSchemaList = document.getElementById("table-schema-list-cont");
ReactDOM.render(<EntityBrowser />, tableSchemaList);



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

function getTableIndexFromElement() {
    let tableListSelect = document.getElementById("table-list-select-dropdown") as HTMLSelectElement;
    let tableIndex = parseInt(tableListSelect.options[tableListSelect.selectedIndex].getAttribute("oid"));
    return tableIndex;
}
