import * as React from "react";
import { Attribute, ForeignKey, PrimaryKey, Table } from "./ts/types";


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

export const entityArrayRenderer = (item: Table, index: number, onClickCallback: React.MouseEventHandler<HTMLAnchorElement>, selectedIndex: number) => { 
    let oid = item.oid;
    let relname = item.relname;
    let affix = () => {
        // Markers of the type of table
        if (item.isJunction) {
            return <i className="fas fa-compress-alt me-1 pe-none" />
        }
    }

    let weRels = () => {
        if (item.weakEntitiesIndices != undefined) {
            if (item.weakEntitiesIndices.length > 0) {
                let visitedKeys = [];
                return item.weakEntitiesIndices.map((weIndex:number, arrayIndex:number) => {
                    if (visitedKeys.includes(item.fk[weIndex].confrelid)) {
                        return null;
                    }
                    visitedKeys.push(item.fk[weIndex].confrelid);
                    return (
                    <div className="me-1 text-muted dropdown-tip bg-tip-weak-link d-flex align-items-center tip-fontsize" key={arrayIndex}>
                        <i className="fas fa-asterisk me-1 pe-none fa-xs" /> <em>{item.fk[weIndex].confname}</em>
                    </div>)
                })
                 // TODO: more information
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    // Check this.props.state.selectedIndex
    return <a className={"dropdown-item pe-auto" + (index == selectedIndex ? " active" : "")} 
        data-key={oid} data-index={index} data-content={relname} key={index} href="#" onMouseDown={onClickCallback}>
            <div className="pe-none">
                {affix()}{relname}
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