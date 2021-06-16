import * as React from 'react';
import * as d3 from 'd3';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext'
import { VisTemplateBuilder } from './ts/types'
import { getDataFromSingleTableByName } from './Connections'

import visTemplates from './visTemplates';
import { VisualiserProps, VisualiserStates } from './ts/components';

export class Visualiser extends React.Component<VisualiserProps, VisualiserStates> {
    constructor(props) {
        super(props);
    }

    visualisationHandler = () => {
        if (!this.props.rerender) return;

        let dbContext: DBSchemaContextInterface = this.context;
        const thisTable = dbContext.allEntitiesList[this.props.selectedTableIndex];
        const selectedPattern = dbContext.selectedPatternIndex;
        const patternMatchStatus = dbContext.visSchemaMatchStatus[selectedPattern];
        const selectedPatternTemplateCode = dbContext.visSchema[selectedPattern].template
        if (!patternMatchStatus) return;
        // TODO: deal with multiple tables

        // Map matched attributes to their names
        const matchedMandatoryAttributeNames = this.props.selectedAttributesIndices[0].map(matchAttr => matchAttr.table.attr[matchAttr.attributeIndex].attname)

        // TODO: other attributes
        getDataFromSingleTableByName(thisTable.tableName, matchedMandatoryAttributeNames).then(data => {
            // Separate out data points with null
            renderVisualisation(selectedPatternTemplateCode, data, matchedMandatoryAttributeNames);
            this.setState({
                renderedAttributesIndices: this.props.selectedAttributesIndices,
                renderedTableIndex: this.props.selectedTableIndex
            })
        });
    }

    componentDidMount() {
        let dbContext: DBSchemaContextInterface = this.context;
        if (dbContext.allEntitiesList !== undefined && dbContext.allEntitiesList.length !== 0) {
            if (this.props.selectedTableIndex < 0) return;

            this.visualisationHandler();
        }
    }
    
    componentDidUpdate() {
        let dbContext: DBSchemaContextInterface = this.context;
        if (this.state) {
            if (this.props.selectedTableIndex === this.state.renderedTableIndex) {
                let allAttributeSetMatched = true;
                for (let x = 0; x < this.props.selectedAttributesIndices.length; x++) {
                    const newAttSet = this.props.selectedAttributesIndices[x];
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
                    if (dbContext.allEntitiesList !== undefined && dbContext.allEntitiesList.length !== 0) {
                        if (this.props.selectedTableIndex < 0) return;
            
                        this.visualisationHandler();
                    }
                }
            }
        } else {
            this.visualisationHandler();
        }
    }

    render() {
        return (
            <div className="col" id="vis-cont"></div>
        )
    }
}

Visualiser.contextType = DBSchemaContext;

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
        console.log("Non-empty")
        svg.selectAll("*").remove();
    } else {
        console.log("Empty")
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