import * as React from 'react';

import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { SearchDropdownList } from './UIElements';
import { ForeignKey, RelationNode, Table } from './ts/types';

import * as ComponentTypes from './ts/components';
import * as UIRenderers from './UIRenderers';
import * as d3 from 'd3';

export class EntitySelector extends React.Component<ComponentTypes.EntitySelectorProps> {
    constructor(props) {
        super(props);
    }

    
    attributeArrayRendererHandler = (item, index, onClickCallback, selectedIndex) => {
        let context: DBSchemaContextInterface = this.context;
        let selectedEntity = context.allEntitiesList[context.selectedFirstTableIndex];
        return UIRenderers.attributeArrayRenderer(item, index, onClickCallback, selectedIndex, selectedEntity.pk, selectedEntity.fk);
    }

    entityArrayRendererHandler = (item: Table, index: number, onClickCallback: React.MouseEventHandler<HTMLAnchorElement>) => {
        const context: DBSchemaContextInterface = this.context;
        return UIRenderers.entityArrayRenderer(item, onClickCallback, context.selectedFirstTableIndex, context.relationsList);
    }

    /* React components for entity selectors */
    entitiesListNode = () => {
        const context: DBSchemaContextInterface = this.context;
        let selectedEntity = this.context.allEntitiesList[context.selectedFirstTableIndex] as Table;
        // let selectedIsJunction = selectedEntity ? selectedEntity.isJunction : false;
        return (<div className="row">
            <div className="col">
                <div className="row position-relative">
                    <SearchDropdownList placeholder="Select Entity 1..." 
                        prependText="E1" dropdownList={this.context.allEntitiesList} 
                        selectedIndex={this.context.selectedTableIndex}
                        onListSelectionChange={this.props.onTableSelectChange}
                        arrayRenderer={this.entityArrayRendererHandler}
                        innerVal={selectedEntity ? selectedEntity.tableName : ""}
                        listFilter={UIRenderers.entityArrayFilter}
                        id={this.props.id}
                        />

                </div>
            </div>
        </div>)
    }

    attributeListNode = () => {
        const context: DBSchemaContextInterface = this.context;
        let selectedTable = this.context.allEntitiesList[context.selectedFirstTableIndex];
        if (context.selectedFirstTableIndex >= 0) {
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

    foreignKeyNode = () => {
        const context: DBSchemaContextInterface = this.context;
        if (context.selectedFirstTableIndex >= 0) {
            return (
                <div className="row mt-2 position-relative">
                    <SearchDropdownList placeholder="Select Entity 2..." 
                        prependText="E2" 
                        dropdownList={this.context.allEntitiesList[context.selectedFirstTableIndex].fk}
                        selectedIndex={this.props.selectedForeignKeyIndex}
                        onListSelectionChange={this.props.onForeignKeySelectChange}
                        arrayRenderer={UIRenderers.FKArrayRenderer}
                        />
                </div>
            );
        } else {
            return null;
        }
    }

    fkAttributeListNode = () => {
        const context: DBSchemaContextInterface = this.context;
        if (this.props.selectedForeignKeyIndex >= 0) {
            let selectedFkName = this.context
                .allEntitiesList[context.selectedFirstTableIndex]
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
            ) ;
        } else {
            return null;
        }
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

class MetadataGraph extends React.Component<{listLoaded: boolean, selectedTable: number}, {loaded?: boolean, selectedTableIndex?: number}> {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            selectedTableIndex: -1
        }
    }

    componentDidUpdate() {
        if (this.state.selectedTableIndex !== this.props.selectedTable) {
            this.setState({
                selectedTableIndex: this.props.selectedTable
            }, () => this.renderSelectedTableMetaGraph())
        }
        if (this.state.loaded) return;
        if (this.props.listLoaded) {
            // this.renderMetaGraph();
            this.setState({
                loaded: true
            });
        }
    }

    getLinkedListBetweenTables = () => {
        if (!this.props.listLoaded) {
            return;
        }
        let strings = [];
        let dbSchemaContext: DBSchemaContextInterface = this.context;
        let relationsList = dbSchemaContext.relationsList;
        
        relationsList.forEach(rel => {
            strings.push(rel.parentEntity.tableName + "->" + rel.childRelations.map(t => t.table.tableName).join());
        })

        console.log(strings);

        return (<div>{strings.map(string => (<p>{string}</p>))}</div>)
    }
    
    renderSelectedTableMetaGraph = () => {
        // // Attempt 1: with d3.js
        // if (this.state.selectedTableIndex < 0) return;
        // const containerViewport = document.getElementById("meta-graph-cont");
        // let margin = {top: 10, right: 30, bottom: 30, left: 40},
        // maxWidth = containerViewport.clientWidth, maxHeight = 600,
        // width = maxWidth - margin.left - margin.right,
        // height = maxHeight - margin.top - margin.bottom;

        // let boxWidth = 10, boxHeight = 2; // in REM
        // let boxWidthText = boxWidth + "rem", boxHeightText = boxHeight + "rem";

        // var svg = d3.select("#meta-graph-cont")
        //     .append("svg")
        //         .attr("width", "100%")
        //         .attr("height", maxHeight + "px")
        //         // .attr("preserveAspectRatio", "none")
        //         // .attr("viewBox", containerString)
        //     .append("g")
        //         .attr("transform",
        //             "translate(" + margin.left + "," + margin.top + ")");
        
        // let dbSchemaContext: DBSchemaContextInterface = this.context;
        // let linkedRelations = dbSchemaContext.relationsList[this.props.selectedTable]; // Pretty sure rel list is listed in order as well
        // let data = [linkedRelations].concat(linkedRelations.childRelations.map(rel));
        
        // let links = linkedRelations.childRelations.map(child => {
        //     return {
        //         "source": linkedRelations.index,
        //         "target": child.index
        //     };
        // });

        // console.log(data);
        // console.log(links);

        // const node = svg.selectAll("g")
        //     .data(data)
        //     .enter();

        // node.append("g")
        //     .append("rect")
        //     .attr("width", boxWidthText)
        //     .attr("height", boxHeightText)
        //     .attr("transform", (d, idx) => "translate (" + convertRemToPixels(idx * (boxWidth + 2)) + ", 0)");
        
        // svg.selectAll("g")
        //     .append("text")
        //     .text((d: RelationNode) => d.parentEntity.tableName)
        //     .attr("transform", (d, idx) => {
        //         const textX = convertRemToPixels(idx * (boxWidth + 2)) + 10;
        //         const textY = convertRemToPixels(boxHeight / 2);
        //         return `translate (${textX},${textY})`;
        //     })
            
        // // Set status of parent node so CSS can do things with it
        // svg.selectAll("g").filter((d: RelationNode) => d.index === this.state.selectedTableIndex)
        //     .attr("class", "parent-node");

        // svg.selectAll("g").filter((d: RelationNode) => d.index !== this.state.selectedTableIndex)
        //     .attr("class", "child-node");
        
    }

    render() {
        return (
            <div className="col" id="meta-graph-cont">
                {/* {this.getLinkedListBetweenTables()} */}
            </div>
        );
    }
}
MetadataGraph.contextType = DBSchemaContext;

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

const convertRemToPixels = (rem) =>{    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
