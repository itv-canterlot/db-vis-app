import * as React from 'react';

import { Table, RelationNode, Attribute, VISSCHEMATYPES } from './ts/types';
import * as SchemaParser from './SchemaParser';
import * as TypeConstants from './TypeConstants';

export const foreignRelationsElement = (thisRels: RelationNode[], thisTable: Table, 
        onClickForeignRelationElement?: React.MouseEventHandler, highlightRelIndex?: number) => {
    if (thisRels) {
        // Display parent relations first
        let thisRelsSorted: RelationNode[] = [], 
            thisRelsParent: RelationNode[] = [], 
            thisRelsChildren: RelationNode[] = [];
        thisRels.forEach(rel => {
            if (SchemaParser.isTableAtRootOfRel(thisTable, rel)) {
                thisRelsParent.push(rel);
            } else {
                thisRelsChildren.push(rel);
            }
        });

        thisRelsSorted = [...thisRelsParent, ...thisRelsChildren];
        return thisRelsSorted.map((rel, idx) => {
            const thisRelType = rel.type;
            const isTableAtRoot = SchemaParser.isTableAtRootOfRel(thisTable, rel);

            let relationTypeTip, relationParentTip, foreignTableList;

            // Listing related tables
            const getForeignTableList = (useParentFk: boolean) => {
                return rel.childRelations.map((childRel, childIdx) => {
                    const childEntity = childRel.table;
                    if (childEntity === thisTable) return null; // TODO: write something else here
                    if (useParentFk) {
                        return (
                            <div key={childIdx}>
                                <i className="fas fa-arrow-right me-1" /> 
                                {childEntity.tableName}
                            </div>);
                    } else {
                        return (
                            <div key={childIdx}>
                                <i className="fas fa-arrow-right me-1" /> {childEntity.tableName}
                            </div>);
                    }
                }
            )};

            // Tooltip for root status
            if (isTableAtRoot) {
                if (thisRelType === VISSCHEMATYPES.MANYMANY) {
                    relationParentTip = (
                        <div className="type-tip tip-parent">Junction table</div>
                    );
                    foreignTableList = getForeignTableList(true);
                } else if (thisRelType === VISSCHEMATYPES.WEAKENTITY) {
                    relationParentTip = (
                        <div className="type-tip tip-parent">Parent</div>
                    );
                    foreignTableList = getForeignTableList(false);
                } else if (thisRelType === VISSCHEMATYPES.SUBSET) {
                    relationParentTip = (
                        <div className="type-tip tip-parent">Superset</div>
                    );
                    foreignTableList = getForeignTableList(false);
                } else if (thisRelType === VISSCHEMATYPES.ONEMANY) {
                    relationParentTip = (
                        <div className="type-tip tip-parent">Parent</div>
                    );
                    foreignTableList = getForeignTableList(false);
                }
            } else {
                if (thisRelType === VISSCHEMATYPES.SUBSET) {
                    relationParentTip = (
                        <div className="type-tip tip-child">Subset (parent: {rel.parentEntity.tableName})</div>
                    );
                    foreignTableList = getForeignTableList(false);
                } else if (thisRelType === VISSCHEMATYPES.MANYMANY) {
                    relationParentTip = (
                        <div className="type-tip tip-child">Child (parent: {rel.parentEntity.tableName})</div>
                    );
                    foreignTableList = getForeignTableList(true);
                } else if (thisRelType === VISSCHEMATYPES.WEAKENTITY) {
                    relationParentTip = (
                        <div className="type-tip tip-child">Child (parent: {rel.parentEntity.tableName})</div>
                    );
                    foreignTableList = getForeignTableList(false);
                }else if (thisRelType === VISSCHEMATYPES.ONEMANY) {
                    relationParentTip = (
                        <div className="type-tip tip-child">Child (parent: {rel.parentEntity.tableName})</div>
                    );
                }
            }

            // Tooltip for relation type
            switch (thisRelType) {
                case VISSCHEMATYPES.WEAKENTITY:
                    relationTypeTip = (
                        <div className="type-tip tip-text bg-tip-we">
                            Weak entity
                        </div>
                    );
                    break;
                case VISSCHEMATYPES.MANYMANY:
                    relationTypeTip = (
                        <div className="type-tip tip-text bg-tip-junc">
                            Many-to-many
                        </div>
                    );
                    break;
                case VISSCHEMATYPES.SUBSET:
                    relationTypeTip = (
                        <div className="type-tip tip-text bg-tip-subset">
                            Subset
                        </div>
                    );
                    break;
                case VISSCHEMATYPES.ONEMANY:
                    relationTypeTip = (
                        <div className="type-tip tip-text bg-tip-onemany">
                            One-to-many
                        </div>
                    );
                    break;
                default:
                    break;
            }

            const elemIsHighlighted = highlightRelIndex !== undefined && (highlightRelIndex >= 0) && (highlightRelIndex === rel.index);
            
            const relationElement = (
                <li className={"list-group-item foreign-relations-group-item" 
                    + (elemIsHighlighted ? " active" : "")} key={idx} data-foreign-rel-idx={rel.index} data-idx={idx}
                    onClick={onClickForeignRelationElement ? onClickForeignRelationElement : () => undefined}>
                    <div className="d-flex justify-content-between">
                        {relationTypeTip}
                        {relationParentTip}
                    </div>
                    {foreignTableList}
                </li>
            );

            return relationElement;

        });
    } else {
        return (
            <li className="list-group-item">
                <div>
                    <em>No foreign relations</em>
                </div>
            </li>
        )
    }
}




export const renderTips = (table: Table, att: Attribute, showForeignKey?: boolean) => {
    let isAttributeInPrimaryKey, tablePrimaryKeyTip;
    if (table.pk) {
        isAttributeInPrimaryKey = SchemaParser.isAttributeInPrimaryKey(att.attnum, table.pk);
    } else {
        isAttributeInPrimaryKey = false;
    }

    if (isAttributeInPrimaryKey) {
        tablePrimaryKeyTip = (
            <div className="me-1 text-muted dropdown-tip bg-tip-pk d-inline-block">pk</div>
        )
    } else {
        tablePrimaryKeyTip = null;
    }

    let fkTip = null;
    if (showForeignKey) {
        const thisAttFKIndex = table.fk.findIndex(fk => fk.columns.some(col => col.fkColPos === att.attnum))
        if (thisAttFKIndex > -1) {
            // This column is of a foreign key
            const pkTableName = table.fk[thisAttFKIndex].pkTableName
            fkTip = <div className="dropdown-tip bg-tip-fk att-to-fk" data-fk-id={thisAttFKIndex}> ➔ {pkTableName}</div>
        }
    }

    if (TypeConstants.isAttributeScalar(att)) {
        return (
            <div className="d-flex">
                {tablePrimaryKeyTip}
                {fkTip}
                <div data-bs-toggle="tooltip" data-bs-placement="top" title={att.typname}>
                    <i className="fas fa-sort-numeric-down" />
                </div>
            </div>
            )
    } else if (TypeConstants.isAttributeTemporal(att)) {
        return (
            <div className="d-flex">
                {tablePrimaryKeyTip}
                {fkTip}
                <div data-bs-toggle="tooltip" data-bs-placement="top" title={att.typname}>
                    <i className="fas fa-calendar" />
                </div>
            </div>
            )
    } else {
        return (
            <div className="d-flex">
                {tablePrimaryKeyTip}
                {fkTip}
                <div data-bs-toggle="tooltip" data-bs-placement="top" title={att.typname}>
                    <i className="fas fa-question" />
                </div>
            </div>)
    }
}