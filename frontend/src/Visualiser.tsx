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
        const patternMatchStatus = context.visSchemaMatchStatus[selectedPattern];
        const selectedPatternTemplateCode = context.visSchema[selectedPattern].template
        
        if (!context.dataLoaded) {
            return;
        }

        if (!patternMatchStatus || !patternMatchStatus[0].matched) {
            this.setState({
                renderFailed: true,
                renderedAttributesIndices: context.selectedAttributesIndices,
                renderedTableIndex: context.selectedFirstTableIndex,
                renderedVisSchemaIndex: selectedPattern,
                renderedFilters: context.filters
            })
            renderEmptyChart();
            return;
        }
        // TODO: deal with multiple tables

        // Map matched attributes to their names
        const attributeNames = context.selectedAttributesIndices
            .map(atts => atts.map(matchAttr => {
                if (matchAttr) {
                    return matchAttr.table.attr[matchAttr.attributeIndex].attname
                }
            }));

        const firstTablePrimaryKeyNames = 
            context.allEntitiesList[context.selectedFirstTableIndex]
                .pk.columns.map(col => col.colName);

        const params = {
            attributeNames: attributeNames,
            firstTablePrimaryKeyNames: firstTablePrimaryKeyNames,
            xLogScale: true,
            yLogScale: true
        }

        if (!context.data || context.data.length === 0) {
            this.setState({
                renderFailed: true,
                renderedAttributesIndices: context.selectedAttributesIndices,
                renderedTableIndex: context.selectedFirstTableIndex,
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
            renderedTableIndex: context.selectedFirstTableIndex,
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
                if (context.selectedFirstTableIndex === this.state.renderedTableIndex) {
                    // Table selection unchanged
                    let allAttributeSetChanged = this.isAllAttributeSetChanged();
                    
                    if (allAttributeSetChanged) {
                        if (context.allEntitiesList !== undefined && context.allEntitiesList.length !== 0) {
                            // If the entity list is loaded
                            // If no table is selected, do not render
                            return context.selectedFirstTableIndex >= 0;
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
            if (context.selectedFirstTableIndex < 0) return;
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