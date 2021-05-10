import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';

export class AppMainCont extends React.Component<{selectedTableIndex: number}, {}> {
    attrCard = () => {
        const dbSchemaContext: DBSchemaContextInterface = this.context;
        const selectedTable = dbSchemaContext.allEntitiesList[this.props.selectedTableIndex];
        let pkConstraintName = "";
        
        if (selectedTable === undefined) return null;
        
        if (selectedTable.pk) {
            pkConstraintName = selectedTable.pk.keyName
        }

        return (
        <div className="card" style={{width: "32rem"}}>
            <div className="card-header" style={{fontSize: "0.9rem"}}>
                Selected Table
            </div>

            <div className="card-body">
                <h5 className="card-text"><strong>{selectedTable.tableName}</strong></h5>
                {
                    // Print primary key prompt
                    selectedTable.pk ?
                    <div className="me-1 text-muted dropdown-tip bg-tip-pk d-inline-block">pk: <em>{pkConstraintName}</em></div> :
                    null
                }
            </div>
                <ul className="list-group list-group-flush">
                    {selectedTable.attr.map((el, idx) => {
                        let itemIsPrimaryKey = false, itemIsForeignKey = false;
                        let fkConstraintNames = [];
                        if (selectedTable.pk) {
                            if (selectedTable.pk.columns.map(key => key.colPos).includes(el.attnum)) {
                                itemIsPrimaryKey = true;
                                pkConstraintName = selectedTable.pk.keyName;
                            }
                        }
                        if (selectedTable.fk) {
                            selectedTable.fk.forEach(cons => {
                                if (cons.columns.map(key => key.fkColPos).includes(el.attnum)) {
                                    itemIsForeignKey = true;
                                    fkConstraintNames.push(cons.keyName);
                                }
                            });
                        }

                        return (
                            <li className="list-group-item d-flex align-items-center" key={idx}>
                                <div className="d-flex pe-none me-auto">
                                    {itemIsPrimaryKey ? <strong>{el.attname}<i className="fas fa-key ms-2" /></strong> : el.attname}
                                </div>
                                <div className="d-flex" style={{flexWrap: "wrap", justifyContent: "flex-end"}}>
                                    {
                                        // Print foreign key prompt(s)
                                        itemIsForeignKey ?
                                        fkConstraintNames.map((fkConstraintName, index) => {
                                            return <div className="ms-1 text-muted dropdown-tip bg-tip-fk mt-1 mb-1" key={index}>fk: <em>{fkConstraintName}</em></div>;
                                        }) :
                                        null
                                    }
                                    <div className="bg-tip-type text-secondary dropdown-tip mt-1 ms-1 mb-1">
                                        <em>
                                        {el.typname}
                                        </em>
                                    </div>
                                </div>
                            </li>
                        // <li className="list-group-item">
                        //     {el.attname}
                        // </li>
                        );
                    })}
                </ul>
        </div>
        );
    }

    render() {
        
        return (
            <div className="col-auto p-3">
                {this.props.selectedTableIndex >= 0 ? this.attrCard() : null}
            </div>
        );
    }
}
AppMainCont.contextType = DBSchemaContext;