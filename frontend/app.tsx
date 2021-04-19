const React = require('react');
const ReactDOM = require('react-dom');

class AttributeList extends React.Component {
    constructor(props) {
        super(props);
        // TODO: add states
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
                        </tr>
                    </thead>
                    <tbody>
                        {(this.props.tableAttributes || []).map(item => (
                            <tr key={item.attnum}>
                                <th>{item.attnum}</th>
                                <th>{item.attname}</th>
                                <th>{item.typname}</th>
                            </tr>
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
            tableAttributes: []
        };
        
        // Binding handlers for child components
        this.attributeSelectHandler = this.attributeSelectHandler.bind(this);
    }

    // Handles attribute list returned from EntitySelector, passed onto AttributeList
    attributeSelectHandler(attributeContent) {
        this.setState({
            tableAttributes: attributeContent["tableAttributes"]
        })
        console.log(attributeContent); // TODO
    }

    render() {
        return (
            <div className="col">
                <EntitySelector attributeHandler={this.attributeSelectHandler} />
                <AttributeList tableAttributes={this.state.tableAttributes} />
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
