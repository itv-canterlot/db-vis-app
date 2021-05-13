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
        let dbContext: DBSchemaContextInterface = this.context;
        let selectedEntity = dbContext.allEntitiesList[this.props.selectedTableIndex];
        return UIRenderers.attributeArrayRenderer(item, index, onClickCallback, selectedIndex, selectedEntity.pk, selectedEntity.fk);
    }

    entityArrayRendererHandler = (item: Table, index: number, onClickCallback: React.MouseEventHandler<HTMLAnchorElement>) => {
        return UIRenderers.entityArrayRenderer(item, onClickCallback, this.props.selectedTableIndex);
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
                        innerVal={selectedEntity ? selectedEntity.tableName : ""}
                        listFilter={UIRenderers.entityArrayFilter}
                        />

                </div>
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
                {this.entitiesListNode()}
                {/* {this.props.selectedTableIndex >= 0 ? this.attributeListNode() : null}
                {this.props.selectedTableIndex >= 0 ? this.foreignKeyNode() : null} */}
                {/* {this.props.selectedTableIndex >= 0 && this.props.selectedForeignKeyIndex >= 0 ? this.fkAttributeListNode() : null} */}
                {/* <MetadataGraph listLoaded={this.props.listLoaded} selectedTable={this.props.selectedTableIndex} /> */}
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
            strings.push(rel.parentEntity.tableName + "->" + rel.childEntities.map(t => t.parentEntity.tableName).join());
        })

        console.log(strings);

        return (<div>{strings.map(string => (<p>{string}</p>))}</div>)
    }
    
    renderSelectedTableMetaGraph = () => {
        // Attempt 1: with d3.js
        if (this.state.selectedTableIndex < 0) return;
        const containerViewport = document.getElementById("meta-graph-cont");
        let margin = {top: 10, right: 30, bottom: 30, left: 40},
        maxWidth = containerViewport.clientWidth, maxHeight = 600,
        width = maxWidth - margin.left - margin.right,
        height = maxHeight - margin.top - margin.bottom;

        let boxWidth = 10, boxHeight = 2; // in REM
        let boxWidthText = boxWidth + "rem", boxHeightText = boxHeight + "rem";

        var svg = d3.select("#meta-graph-cont")
            .append("svg")
                .attr("width", "100%")
                .attr("height", maxHeight + "px")
                // .attr("preserveAspectRatio", "none")
                // .attr("viewBox", containerString)
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
        
        let dbSchemaContext: DBSchemaContextInterface = this.context;
        let linkedRelations = dbSchemaContext.relationsList[this.props.selectedTable]; // Pretty sure rel list is listed in order as well
        let data = [linkedRelations].concat(linkedRelations.childEntities);
        
        let links = linkedRelations.childEntities.map(child => {
            return {
                "source": linkedRelations.index,
                "target": child.index
            };
        });

        console.log(data);
        console.log(links);

        const node = svg.selectAll("g")
            .data(data)
            .enter();

        node.append("g")
            .append("rect")
            .attr("width", boxWidthText)
            .attr("height", boxHeightText)
            .attr("transform", (d, idx) => "translate (" + convertRemToPixels(idx * (boxWidth + 2)) + ", 0)");
        
        svg.selectAll("g")
            .append("text")
            .text((d: RelationNode) => d.parentEntity.tableName)
            .attr("transform", (d, idx) => {
                const textX = convertRemToPixels(idx * (boxWidth + 2)) + 10;
                const textY = convertRemToPixels(boxHeight / 2);
                return `translate (${textX},${textY})`;
            })
            
        // Set status of parent node so CSS can do things with it
        svg.selectAll("g").filter((d: RelationNode) => d.index === this.state.selectedTableIndex)
            .attr("class", "parent-node");

        svg.selectAll("g").filter((d: RelationNode) => d.index !== this.state.selectedTableIndex)
            .attr("class", "child-node");
        
    }

    renderMetaGraph() {
        let margin = {top: 10, right: 30, bottom: 30, left: 40},
        maxWidth = 400, maxHeight = 400,
        width = maxWidth - margin.left - margin.right,
        height = maxHeight - margin.top - margin.bottom;
        
        let dbSchemaContext: DBSchemaContextInterface = this.context;
        let links = [];
        console.log(dbSchemaContext.relationsList);

        dbSchemaContext.relationsList.forEach(rel => {
            let thisId = rel.index;
            let listOfLinks = rel.childEntities.map(child => {
                return {
                    "source": thisId,
                    "target": child.index
                }
            });
            links = links.concat(listOfLinks);
        });
        
        const containerViewport = document.getElementById("meta-graph-cont");
        let containerWidth = containerViewport.parentElement.parentElement.clientWidth,
            containerHeight = 600;

        let containerString = `0 0 ${containerWidth} ${containerHeight}`;
        var svg = d3.select("#meta-graph-cont")
            .append("svg")
                .attr("width", "100%")
                .attr("height", "600px")
                // .attr("preserveAspectRatio", "none")
                // .attr("viewBox", containerString)
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");


        const simulation = d3.forceSimulation(dbSchemaContext.relationsList)
            .force("link", d3.forceLink(links).id(d => d.index))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(containerViewport.clientWidth / 2, containerViewport.clientHeight / 2))
            .force("collide", d3.forceCollide());;

            
        const link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            
        const node = svg.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
        .selectAll("rect")
        .data(dbSchemaContext.relationsList)
        .join("rect")
            .attr("width", "5rem")
            .attr("height", "2rem")
            .attr("x", Math.random() * containerViewport.clientWidth)
            .attr("y", Math.random() * containerViewport.clientHeight)
            .attr("fill", "orange");
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        
            node
                .attr("x", d => d["x"])
                .attr("y", d => d["y"]);
            });

        return svg.node();
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
