import * as React from 'react';

import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { SearchDropdownList } from './UIElements';
import { Table } from './ts/types';

import * as ComponentTypes from './ts/components';
import * as UIRenderers from './UIRenderers';
import { filterTablesByExistingRelations } from './SchemaParser';

export class EntitySelector extends React.Component<ComponentTypes.EntitySelectorProps, {innerVal?: string, tableIndicesInRels?: number[]}> {
    constructor(props) {
        super(props);
        this.state = {
            innerVal: "",
            tableIndicesInRels: []
        }
    }

    entityArrayRendererHandler = (item: Table, index: number, onClickCallback: React.MouseEventHandler<HTMLAnchorElement>) => {
        const context: DBSchemaContextInterface = this.context;
        return UIRenderers.entityArrayRenderer(
            item, onClickCallback, this.state.tableIndicesInRels, context.relationsList);
    }

    updateInnerText = (s: string) => {
        this.setState({
            innerVal: s
        })
    }

    onTableSelectChangeHandler = (e) => {
        this.props.onTableSelectChange(e);        
        this.setState({
            innerVal: ""
        })
    }

    entityArrayFilterBySelection = (list: Table[], text: string) => {
        return list.filter(en => {
            return en.tableName.toLowerCase().includes(text.toLowerCase());
        })
    }

    /* React components for entity selectors */
    entitiesListNode = () => {
        const context: DBSchemaContextInterface = this.context;
        const renderingIndex = this.props.selectedEntityIndex ? this.props.selectedEntityIndex : context.selectedEntitiesIndices[0]

        return (<div className="row">
            <div className="col">
                <div className="row position-relative">
                    <SearchDropdownList placeholder="Select Entity 1..." 
                        prependText="E1" dropdownList={context.allEntitiesList} 
                        selectedIndex={renderingIndex}
                        onListSelectionChange={this.onTableSelectChangeHandler}
                        arrayRenderer={this.entityArrayRendererHandler}
                        innerVal={this.state.innerVal}
                        updateInnerText={this.updateInnerText}
                        listFilter={this.entityArrayFilterBySelection}
                        id={this.props.id}
                        />
                </div>
            </div>
        </div>)
    }

    updateTableIndicesInRels = () => {
        const context: DBSchemaContextInterface = this.context;
        let tableIndicesInRelations = filterTablesByExistingRelations(
            context.allEntitiesList, context.relationsList, 
            this.props.cachedSelectedEntitiesList, this.props.cachedSelectedRelationsList)
            .map(table => table.idx);
        
        if (this.state.tableIndicesInRels !== undefined) {
            if (!(tableIndicesInRelations.length === this.state.tableIndicesInRels.length && 
                tableIndicesInRelations.every((el, idx) => el === this.state.tableIndicesInRels[idx]))) {
                this.setState({
                    tableIndicesInRels: tableIndicesInRelations
                });
            }
        }

        return;
    }

    componentDidMount() {
        console.log("mount")
        const context: DBSchemaContextInterface = this.context;
        
        this.updateTableIndicesInRels();


        const propSelectedIndex = this.props.selectedEntityIndex ? this.props.selectedEntityIndex : -1;
        const contextSelectedIndex = context.selectedEntitiesIndices[0];
    
        if (propSelectedIndex >= 0 && contextSelectedIndex >= 0) {
            const selectedEntity = this.context.allEntitiesList[propSelectedIndex] as Table;
            this.setState({
                innerVal: selectedEntity.tableName
            });
        }
    }

    componentDidUpdate() {
        console.log("update");
        this.updateTableIndicesInRels();
    }

    render() {
        return (
            <div className="col dropdown-custom-text-wrapper">
                {this.entitiesListNode()}
            </div>
        )
    }
}
EntitySelector.contextType = DBSchemaContext;
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

const getAttrsFromTableName = (entities: Table[], tableName: string) => {
    return getEntityFromTableName(entities, tableName).attr;
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