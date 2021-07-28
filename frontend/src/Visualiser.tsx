import * as React from 'react';
import * as d3 from 'd3';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext'
import { VisTemplateBuilder } from './ts/types'

import visTemplates from './visTemplates';
import { VisualiserProps, VisualiserStates } from './ts/components';
import { filterDataByFilters } from './DatasetUtils';

export class Visualiser extends React.Component<VisualiserProps, VisualiserStates> {
    constructor(props) {
        super(props);
        this.state = {
            renderFailed: false,
            axisScales: {
            }
        }
    }

    visualisationHandler = () => {
        console.log("Vis handler")
        if (!this.props.rerender) return;

        let context: DBSchemaContextInterface = this.context;
        const selectedPattern = context.selectedPatternIndex;
        const patternMatchStatus = context.visSchemaMatchStatus[selectedPattern][context.selectedMatchResultIndexInPattern];
        const selectedPatternTemplateCode = context.visSchema[selectedPattern].template
        
        if (!context.dataLoaded) {
            return;
        }

        if (!patternMatchStatus || !patternMatchStatus.matched) {
            this.setState({
                renderFailed: true,
                renderedAttributesIndices: context.selectedAttributesIndices,
                renderedTableIndex: context.selectedEntitiesIndices[0],
                renderedMatchResultIndex: context.selectedMatchResultIndexInPattern,
                renderedVisSchemaIndex: selectedPattern,
                renderedFilters: context.filters
            })
            renderEmptyChart();
            return;
        }
        
        // Figure out if there is a foreign key involved in the match

        // Temporary: split the case on table/relation based selection

        // Map matched attributes to their names
        let attributeNames, firstTablePrimaryKeyNames, selectedAttributesPublicKeyNames, selectedAttributesForeignKeyNames;
        if (context.selectedEntitiesIndices.length !== 0) {
            attributeNames = context.selectedAttributesIndices
                .map(atts => atts.map(matchAttr => {
                    if (matchAttr) {
                        return matchAttr.table.attr[matchAttr.attributeIndex].attname
                    }
                }));
    
            firstTablePrimaryKeyNames = 
                context.allEntitiesList[context.selectedEntitiesIndices[0]]
                    .pk.columns.map(col => col.colName);
    
            selectedAttributesPublicKeyNames = 
                context.selectedAttributesIndices[0].map(att => att.table.pk.columns.map(col => col.colName))
    
            selectedAttributesForeignKeyNames = context.selectedAttributesIndices[0].map(att => {
                if (!patternMatchStatus || !patternMatchStatus.responsibleRelation) return;
                const responsibleFkInRel = 
                    patternMatchStatus.responsibleRelation.childRelations
                        .find(cr => cr.table.idx === att.table.idx);
                if (responsibleFkInRel) {
                    // If defined:
                    return att.table.fk
                        [responsibleFkInRel.fkIndex]
                            .columns.map(col => col.fkColName);
                } else {
                    // If not defined: return undefined
                    return undefined;
                }
            })
        } else {
            attributeNames = context.selectedAttributesIndices
                .map(atts => atts.map(matchAttr => {
                    if (matchAttr) {
                        const attName = matchAttr.table.attr[matchAttr.attributeIndex].attname;
                        return `a_${matchAttr.table.tableName}_${attName}`;
                    }
                }));
    
            firstTablePrimaryKeyNames = 
                context.allEntitiesList[context.relHierachyIndices[0][0]]
                    .pk.columns.map(col => {
                        return `pk_${context.allEntitiesList[context.relHierachyIndices[0][0]].tableName}_${col.colName}`;
                    });
    
            selectedAttributesPublicKeyNames = 
                context.selectedAttributesIndices[0].map(att => att.table.pk.columns.map(col => `pk_${att.table.tableName}_${col.colName}`))
    
            selectedAttributesForeignKeyNames = context.selectedAttributesIndices[0].map(att => {
                if (!patternMatchStatus || !patternMatchStatus.responsibleRelation) return;
                const responsibleFkInRel = 
                    patternMatchStatus.responsibleRelation.childRelations
                        .find(cr => cr.table.idx === att.table.idx);
                if (responsibleFkInRel) {
                    // If defined:
                    return att.table.fk
                        [responsibleFkInRel.fkIndex]
                            .columns.map(col => `fk_${att.table.tableName}_${col.fkColName}`);
                } else {
                    // If not defined: return undefined
                    return undefined;
                }
            })   
        }

        const params = {
            attributeNames: attributeNames,
            firstTablePrimaryKeyNames: firstTablePrimaryKeyNames,
            selectedAttributesPublicKeyNames: selectedAttributesPublicKeyNames,
            selectedAttributesForeignKeyNames: selectedAttributesForeignKeyNames,
            xLogScale: true,
            yLogScale: true
        }

        console.log(params);

        if (!context.data || context.data.length === 0) {
            this.setState({
                renderFailed: true,
                renderedAttributesIndices: context.selectedAttributesIndices,
                renderedTableIndex: context.selectedEntitiesIndices[0],
                renderedMatchResultIndex: context.selectedMatchResultIndexInPattern,
                renderedVisSchemaIndex: selectedPattern,
                renderedFilters: context.filters
            });
            renderEmptyChart();
            return;
        }
        
        renderVisualisation(selectedPatternTemplateCode, filterDataByFilters(context.data, context, context.filters), params);
        this.setState({
            renderFailed: false,
            renderedAttributesIndices: context.selectedAttributesIndices,
            renderedMatchResultIndex: context.selectedMatchResultIndexInPattern,
            renderedTableIndex: context.selectedEntitiesIndices[0],
            renderedVisSchemaIndex: selectedPattern,
            renderedFilters: context.filters
        })
    }

    areFiltersChanged = () => {
        let context: DBSchemaContextInterface = this.context;
        const contextFilters = context.filters,
              stateFilters = this.state.renderedFilters;

        if (contextFilters && stateFilters) {
            // If both filter sets exist...
            if (contextFilters.length === stateFilters.length) {
                for (let x = 0; x < contextFilters.length; x++) {
                    // Compare objects?
                    if (contextFilters[x] !== stateFilters[x]) {
                        return true;
                    }
                }

                // All filters identical
                return false;
            } else {
                return true;
            }

        } else {
            return contextFilters !== stateFilters;
        }     
    }

    isAllAttributeSetChanged = () => {
        // Check if the possible attribute set to be rendered has changed
        let context: DBSchemaContextInterface = this.context;

        if (context.selectedAttributesIndices.length !== this.state.renderedAttributesIndices.length) {
            return true;
        }

        for (let x = 0; x < context.selectedAttributesIndices.length; x++) {
            const newAttSet = context.selectedAttributesIndices[x];
            const oldAttSet = this.state.renderedAttributesIndices[x];
            
            if (newAttSet.length === oldAttSet.length) {
                for (let y = 0; y < newAttSet.length; y++) {
                    if (newAttSet[y] !== oldAttSet[y]) {
                        return true;
                    }
                }
            } else {
                return true;
            };
        }

        return false;
    }

    renderStateDidChange = () => {
        let context: DBSchemaContextInterface = this.context;
        if (context.dataLoaded) {
            // Data load status check
            if (context.selectedPatternIndex === this.state.renderedVisSchemaIndex) {
                // Pattern selection unchanged
                if (context.selectedEntitiesIndices[0] === this.state.renderedTableIndex) {
                    // Table selection unchanged
                    if (context.selectedMatchResultIndexInPattern === this.state.renderedMatchResultIndex) {
                        // Match result index unchanged
                        let allAttributeSetChanged = this.isAllAttributeSetChanged();
                        
                        if (allAttributeSetChanged) {
                            if (context.allEntitiesList !== undefined && context.allEntitiesList.length !== 0) {
                                // If the entity list is loaded
                                // If no table is selected, do not render
                                return context.selectedEntitiesIndices[0] >= 0;
                            } else {
                                // Entity list not loaded, do not render
                                return false;
                            }
                        } else {
                            // Attribute set unchanged
                            // Rerender if filter set is changed
                            return this.areFiltersChanged();
                        }
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    onAxisScaleChange = (e: React.BaseSyntheticEvent) => {
        const currentTarget = e.currentTarget;
        const attIndex = currentTarget.getAttribute("data-att-index");
        const isLog = currentTarget.getAttribute("data-is-log");

        let axisScales = this.state.axisScales;
        if (isLog === "true") {
            axisScales[attIndex] = true;
        } else if (isLog === "false") {
            axisScales[attIndex] = false;
        }

        this.setState({
            axisScales: axisScales
        })
    }

    componentDidMount() {
        let context: DBSchemaContextInterface = this.context;
        if (context.allEntitiesList !== undefined && context.allEntitiesList.length !== 0) {
            if (context.selectedEntitiesIndices[0] < 0) return;
            if (!context.dataLoaded) return;

            this.visualisationHandler();
        }
    }
    
    componentDidUpdate() {
        console.log("Vis component update")
        console.log(this.state.axisScales)
        let context: DBSchemaContextInterface = this.context;
        if (this.state) {
            if (this.renderStateDidChange()) {
                this.visualisationHandler();
            }
        }
    }

    render() {
        return (
            <div className="row" id="main-vis-cont">
                <div className="col">
                    <div className="btn-group btn-group-sm" id="a1-scale-btn-group" role="group" aria-label="Axis log scale radio buttons">
                        <input type="radio" className="btn-check" name="btnradio" id="btnradio1" autoComplete="off"
                            data-att-index="a1" data-is-log={false} onChange={this.onAxisScaleChange} />
                        <label className="btn btn-outline-primary" htmlFor="btnradio1">Linear scale</label>

                        <input type="radio" className="btn-check" name="btnradio" id="btnradio2" autoComplete="off" 
                            data-att-index="a1" data-is-log={true}  onChange={this.onAxisScaleChange}/>
                        <label className="btn btn-outline-primary" htmlFor="btnradio2">Log scale</label>
                    </div>
                    <div id="graph-cont">
                    </div>
                {/* {this.filterButton()} */}
                </div>
            </div>
        )
    }
}

Visualiser.contextType = DBSchemaContext;

const renderEmptyChart = () => {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svg = d3.select("#graph-cont")
        .select("svg > g");
    if (!svg.empty()) {
        svg.selectAll("*").remove();
    } else {
        svg = d3.select("#graph-cont").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")")
    }

    svg.append("text").text("Oh no!");
}

const renderVisualisation = (visSpecificCode: string, data: object[], args: object) => {
    if (!visSpecificCode) return; // Do not render if no template name is specified
    
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svg = d3.select("#graph-cont")
        .select("svg > g");
    if (!svg.empty()) {
        svg.selectAll("*").remove();
    } else {
        svg = d3.select("#graph-cont").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")")
    }

    const builder: VisTemplateBuilder = {
        width: width,
        height: height,
        margin: margin,
        svg: svg,
        data: data,
        args: args
    };

    visTemplates(visSpecificCode, builder)
}