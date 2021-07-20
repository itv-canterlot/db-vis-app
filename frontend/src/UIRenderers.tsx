import * as React from "react";
import { Attribute, ForeignKey, PrimaryKey, RelationNode, Table } from "./ts/types";
import { getEntityJunctionRelations, getEntityWeakRelations } from './SchemaParser';


export const FKArrayRenderer = (item, index, onClickCallback, selectedIndex) => { 
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

export const entityArrayFilter = (list: Table[], text: string) => {
    return list.filter(en => {
        return en.tableName.toLowerCase().includes(text.toLowerCase());
    })
}

export const entityArrayRenderer = (item: Table, onClickCallback: React.MouseEventHandler<HTMLAnchorElement>, entitiesInRels: number[], relationsList: RelationNode[]) => { 
    let index = item.idx;
    let oid = item.oid;
    let tableName = item.tableName;
    let relNameElement = (name: string, isInRels: boolean) => {
        // Markers of the type of table
        const thisTableJunctionRels = getEntityJunctionRelations(item, relationsList)
        if (isInRels) {
            return (
                <div className="d-flex align-items-center">
                    {name}<i className="bi bi-dot text-primary" style={{fontSize: "1.75rem", lineHeight: "1rem"}} />
                </div>
            )
        } else {
            return <div><i />{name}</div>;
        }
    }

    return <a className={"dropdown-item pe-auto"} 
        data-key={oid} data-index={index} data-content={tableName} key={index} href="#" onMouseDown={onClickCallback}>
            <div className="pe-none">
                {relNameElement(tableName, entitiesInRels.includes(item.idx))}
            </div>
        </a>
}

export const attributeArrayRenderer = (item:Attribute, index: number, onClickCallback, selectedIndex: number, tablePrimaryKey?: PrimaryKey, tableForeignKeys?: ForeignKey[]) => {
    let itemIsPrimaryKey = false;
    let itemIsForeignKey = false;
    let pkConstraintName;
    let fkConstraintNames = [];
    if (tablePrimaryKey) {
        if (tablePrimaryKey.columns.map(key => key.colPos).includes(item.attnum)) {
            itemIsPrimaryKey = true;
            pkConstraintName = tablePrimaryKey.keyName;
        }
    }
    if (tableForeignKeys) {
        tableForeignKeys.forEach(cons => {
            if (cons.columns.map(key => key.fkColPos).includes(item.attnum)) {
                itemIsForeignKey = true;
                fkConstraintNames.push(cons.keyName);
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