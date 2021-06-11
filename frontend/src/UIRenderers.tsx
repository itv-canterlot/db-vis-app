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

export const entityArrayRenderer = (item: Table, onClickCallback: React.MouseEventHandler<HTMLAnchorElement>, selectedIndex: number, relationsList: RelationNode[]) => { 
    let index = item.idx;
    let oid = item.oid;
    let tableName = item.tableName;
    let relNameElement = (name: string) => {
        // Markers of the type of table
        const thisTableJunctionRels = getEntityJunctionRelations(item, relationsList)
        if (thisTableJunctionRels.length > 0) {
            return (
                <div>
                    <i className="fas fa-compress-alt me-1 pe-none" />{name}
                </div>
            )
        } else {
            return <div><i />{name}</div>;
        }
    }

    let weRels = () => {
        const thisTableJunctionRels = getEntityWeakRelations(item, relationsList)
        if (thisTableJunctionRels.length > 0) {
            let visitedKeys = [];
            return null;
            // return item.weakEntitiesIndices.map((weIndex:number, arrayIndex:number) => {
            //     if (visitedKeys.includes(item.fk[weIndex].pkTableName)) {
            //         return null;
            //     }
            //     visitedKeys.push(item.fk[weIndex].pkTableName);
            //     return (
            //     <div className="me-1 text-muted dropdown-tip bg-tip-weak-link d-flex align-items-center tip-fontsize" key={arrayIndex}>
            //         <i className="fas fa-asterisk me-1 pe-none fa-xs" /> <em>{item.fk[weIndex].pkTableName}</em>
            //     </div>)
            // })
        } else {
            return null;
        }
    }
    // Check this.props.state.selectedIndex
    return <a className={"dropdown-item pe-auto" + (index == selectedIndex ? " active" : "")} 
        data-key={oid} data-index={index} data-content={tableName} key={index} href="#" onMouseDown={onClickCallback}>
            <div className="pe-none">
                {relNameElement(tableName)}
            </div>
            <div className="pe-none d-flex">
                {weRels()}
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