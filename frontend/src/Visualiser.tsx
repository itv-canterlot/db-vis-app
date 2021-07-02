import * as React from 'react';
import * as d3 from 'd3';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext'
import { VisTemplateBuilder } from './ts/types'
import { getDataByMatchAttrs } from './Connections'

import visTemplates from './visTemplates';
import { VisualiserProps, VisualiserStates } from './ts/components';

export class Visualiser extends React.Component<VisualiserProps, VisualiserStates> {
    constructor(props) {
        super(props);
        this.state = {
            renderFailed: false
        }
    }

    visualisationHandler = () => {
        if (!this.props.rerender) return;

        let context: DBSchemaContextInterface = this.context;
        const thisTable = context.allEntitiesList[context.selectedFirstTableIndex];
        const selectedPattern = context.selectedPatternIndex;
        const patternMatchStatus = context.visSchemaMatchStatus[selectedPattern];
        const selectedPatternTemplateCode = context.visSchema[selectedPattern].template

        if (!patternMatchStatus || !patternMatchStatus.matched) {
            this.setState({
                renderFailed: true
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

        // TODO: other attributes
        getDataByMatchAttrs(context.selectedAttributesIndices, patternMatchStatus).then(data => {
            renderVisualisation(selectedPatternTemplateCode, data, attributeNames);
            this.setState({
                renderFailed: false,
                renderedAttributesIndices: context.selectedAttributesIndices,
                renderedTableIndex: context.selectedFirstTableIndex,
                renderedVisSchemaIndex: selectedPattern
            })
        });
    }

    componentDidMount() {
        let context: DBSchemaContextInterface = this.context;
        if (context.allEntitiesList !== undefined && context.allEntitiesList.length !== 0) {
            if (context.selectedFirstTableIndex < 0) return;

            this.visualisationHandler();
        }
    }
    
    componentDidUpdate() {
        let context: DBSchemaContextInterface = this.context;
        if (this.state) {
            if (context.selectedPatternIndex === this.state.renderedVisSchemaIndex) {
                if (context.selectedFirstTableIndex === this.state.renderedTableIndex) {
                    let allAttributeSetMatched = true;
                    for (let x = 0; x < context.selectedAttributesIndices.length; x++) {
                        const newAttSet = context.selectedAttributesIndices[x];
                        const oldAttSet = this.state.renderedAttributesIndices[x];
                        
                        if (newAttSet.length === oldAttSet.length) {
                            for (let y = 0; y < newAttSet.length; y++) {
                                if (newAttSet[y] !== oldAttSet[y]) {
                                    allAttributeSetMatched = false;
                                    break;
                                }
                            }
                        } else allAttributeSetMatched = false;
                    }
        
                    if (!allAttributeSetMatched) {
                        if (context.allEntitiesList !== undefined && context.allEntitiesList.length !== 0) {
                            if (context.selectedFirstTableIndex < 0) return;
                
                            this.visualisationHandler();
                        }
                    }
                } else {
                    this.visualisationHandler();
                }
            } else {
                this.visualisationHandler();
            }
        } else {
            this.visualisationHandler();
        }
    }

    render() {
        return (
            <div className="col" id="vis-cont">
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
    let svg = d3.select("#vis-cont")
        .select("svg > g");
    if (!svg.empty()) {
        svg.selectAll("*").remove();
    } else {
        svg = d3.select("#vis-cont").append("svg")
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
    let svg = d3.select("#vis-cont")
        .select("svg > g");
    if (!svg.empty()) {
        svg.selectAll("*").remove();
    } else {
        svg = d3.select("#vis-cont").append("svg")
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