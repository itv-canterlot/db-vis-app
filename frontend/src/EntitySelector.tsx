import * as React from 'react';

import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import SearchDropdownList from './UIElements';
import {Attribute, ForeignKey, Table, VisSchema, 
    VISSCHEMATYPES, VISPARAMTYPES} from './ts/types';

import * as ComponentTypes from './ts/components';
import * as UIRenderers from './UIRenderers';

export class EntitySelector extends React.Component<ComponentTypes.EntitySelectorProps> {
    constructor(props) {
        super(props);
    }

    
    attributeArrayRendererHandler = (item, index, onClickCallback, selectedIndex) => {
        let dbContext: DBSchemaContextInterface = this.context;
        let selectedEntity = dbContext.allEntitiesList[this.props.selectedTableIndex];
        return UIRenderers.attributeArrayRenderer(item, index, onClickCallback, selectedIndex, selectedEntity.pk, selectedEntity.fk);
    }

    entityArrayRendererHandler = (item: Table, index: number, onClickCallback: React.MouseEventHandler<HTMLAnchorElement>) => {
        return UIRenderers.entityArrayRenderer(item, index, onClickCallback, this.props.selectedTableIndex);
    }

    /* React components for entity selectors */
    entitiesListNode = () => {
        let selectedEntity = this.context.allEntitiesList[this.props.selectedTableIndex] as Table;
        let selectedIsJunction = selectedEntity ? selectedEntity.isJunction : false;
        return (<div className="row">
            <div className="col">
                <div className="row position-relative">
                    <SearchDropdownList placeholder="Select Entity 1..." 
                        prependText="E1" dropdownList={this.context.allEntitiesList} 
                        selectedIndex={this.context.selectedTableIndex}
                        onListSelectionChange={this.props.onTableSelectChange}
                        arrayRenderer={this.entityArrayRendererHandler}
                        />

                </div>
                {
                    // Display the linked tables if the selected table is a junction table
                    selectedIsJunction 
                    ? <div className="row ms-4">
                        <JunctionTableLinks selectedEntity={selectedEntity} />
                    </div>
                    : null
                }
            </div>
        </div>)
    }

    attributeListNode = () => {
        let selectedTable = this.context.allEntitiesList[this.props.selectedTableIndex];
        if (this.props.selectedTableIndex >= 0) {
            return (
                <AttributeListSelector 
                    dropdownList={selectedTable.attr}
                    selectedIndex={this.props.selectedAttributeIndex}
                    onListSelectionChange={this.props.onAttributeSelectChange}
                    tablePrimaryKey={selectedTable.pk}
                    tableForeignKeys={selectedTable.fk}
                    prependText="a1"
                />
            )
        } else {
            return null;
        }
    }

    foreignKeyNode = () => 
        this.props.selectedTableIndex >= 0 
        ? (
            <div className="row mt-2 position-relative">
                <SearchDropdownList placeholder="Select Entity 2..." 
                    prependText="E2" 
                    dropdownList={this.context.allEntitiesList[this.props.selectedTableIndex].fk}
                    selectedIndex={this.props.selectedForeignKeyIndex}
                    onListSelectionChange={this.props.onForeignKeySelectChange}
                    arrayRenderer={UIRenderers.FKArrayRenderer}
                    />
            </div>
        ) 
        : null;

    fkAttributeListNode = () => {
        if (this.props.selectedForeignKeyIndex >= 0) {
            let selectedFkName = this.context
                .allEntitiesList[this.props.selectedTableIndex]
                .fk[this.props.selectedForeignKeyIndex].pkTableName
            return (
                <div className="row mt-2 ms-4 position-relative">
                    <SearchDropdownList placeholder="Select Attribute 2..." 
                        prependText="a2" dropdownList={getAttrsFromTableName(this.context.allEntitiesList, selectedFkName)} 
                        selectedIndex={this.props.selectedFKAttributeIndex}
                        onListSelectionChange={this.props.onFKAttributeSelectChange}
                        arrayRenderer={this.attributeArrayRendererHandler}
                        />
                </div>
            ) 
        } else {
            return null;
        }
    }

    render() {
        return (
            <div className="col dropdown-custom-text-wrapper">
                {/* TODO: logic to be changed */}
                {this.entitiesListNode()}
                {this.props.selectedTableIndex >= 0 ? this.attributeListNode() : null}
                {this.props.selectedTableIndex >= 0 ? this.foreignKeyNode() : null}
                {this.props.selectedTableIndex >= 0 && this.props.selectedForeignKeyIndex >= 0 ? this.fkAttributeListNode() : null}
            </div>
        )
    }
}
EntitySelector.contextType = DBSchemaContext;

class JunctionTableLinks extends React.Component<ComponentTypes.JunctionTableLinksProps, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        let selectedEntity = this.props.selectedEntity as Table;
        let foreignKeyList = selectedEntity.fk;
        let fkListNode = foreignKeyList.map(fk => {
            return (
                <FixedAttributeSelector key={fk.keyName} entity={selectedEntity} fk={fk} />
            );
        });
        return (
            <div className="col">
                {fkListNode}
            </div>
        );
    }
}

class AttributeListSelector extends React.Component<ComponentTypes.AttributeListSelectorProps, {}> {
    constructor(props) {
        super(props);
    }

    attributeArrayRendererHandler = (item, index, onClickCallback, selectedIndex) => {
        return UIRenderers.attributeArrayRenderer(item, index, onClickCallback, selectedIndex, this.props.tablePrimaryKey, this.props.tableForeignKeys);
    }

    render() {
        return (
        <div className="row mt-2 ms-4 position-relative">
            <SearchDropdownList placeholder="Select Attribute 1..." 
                prependText={this.props.prependText} dropdownList={this.props.dropdownList} 
                selectedIndex={this.props.selectedIndex}
                onListSelectionChange={this.props.onListSelectionChange}
                arrayRenderer={this.attributeArrayRendererHandler}
                />
        </div>
        )
    }
}

class FixedAttributeSelector extends React.Component<ComponentTypes.FixedAttributeSelectorProps, {selectedAttributeIndex?: number}> {
    constructor(props) {
        super(props);
        this.state = {
            selectedAttributeIndex: -1
        }
    }

    onAttributeSelectionChange = (el: React.BaseSyntheticEvent) => {
        this.setState({
            selectedAttributeIndex: el.target.getAttribute("data-index")
        }); // TODO
    }

    render() {
        let thisEntity = this.props.entity as Table;
        let fk = this.props.fk as ForeignKey;

        return (
            <DBSchemaContext.Consumer>
                {(context) => {
                    let fkEntity = getEntityFromTableName(context.allEntitiesList, fk.pkTableName)
                    return (<div className="mt-1 mb-1">
                        <div className="text-muted">
                            <div className="dropdown-tip bg-tip-fk d-inline-block">
                                <i className="fas fa-link me-2" />{fk.keyName}
                            </div>
                            <div className="ms-1 tip-fontsize d-inline-block">
                            <i className="fas fa-arrow-right" />
                            </div>
                        </div>
                        <div className="ms-2">
                            <AttributeListSelector 
                                dropdownList={fkEntity.attr}
                                onListSelectionChange={this.onAttributeSelectionChange}
                                prependText={fk.pkTableName}
                                selectedIndex={this.state.selectedAttributeIndex}
                                tableForeignKeys={fkEntity.fk}
                                tablePrimaryKey={fkEntity.pk}
                            />
                        </div>
                    </div>);
                    }
                }
            </DBSchemaContext.Consumer>
        )
    }
}

const getAttrsFromOID = (entities: Table[], oid: number) => {
    return getEntityFromOID(entities, oid).attr;
}

const getAttrsFromTableName = (entities: Table[], tableName: string) => {
    return getEntityFromTableName(entities, tableName).attr;
}

const getEntityFromOID = (entities: Table[], oid: number) => {
    let fkRelIndex;
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].oid === oid) {
            fkRelIndex = i;
            break;
        }
    }

    return entities[fkRelIndex];
}

const getEntityFromTableName = (entities: Table[], tableName: string) => {
    let fkRelIndex;
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].tableName === tableName) {
            fkRelIndex = i;
            break;
        }
    }

    return entities[fkRelIndex];
}