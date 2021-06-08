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
        this.state = {
            load: false,
        };
    }

    visualisationHandler = () => {
        if (!this.props.rerender) return;

        let dbContext: DBSchemaContextInterface = this.context;
        const thisTable = dbContext.allEntitiesList[this.props.selectedTableIndex];
        const selectedPattern = dbContext.selectedPatternIndex;
        const patternMatchStatus = this.props.visSchemaMatchStatus[selectedPattern];
        const selectedPatternTemplateCode = dbContext.visSchema[selectedPattern].template
        if (!patternMatchStatus) return;
        console.log(dbContext.selectedPatternIndex)
        // TODO: deal with multiple tables

        // Map matched attributes to their names
        const matchedAttributeNames = patternMatchStatus["mandatoryAttributes"]
            .map(indAttr => {
                return indAttr.map(attId => thisTable.attr[attId].attname);
            });

        // TODO: other attributes

        const args = {
            xname: matchedAttributeNames[0][dbContext.selectedAttributesIndices[0][0]],
            yname: matchedAttributeNames[1][dbContext.selectedAttributesIndices[0][1]]
        };

        getDataFromSingleTableByName(thisTable.tableName, [args.xname, args.yname]).then(data => {
            // Separate out data points with null
            renderVisualisation(selectedPatternTemplateCode, data, args)
        });
    }
    
    componentDidUpdate() {
        if (this.state.load) {
            return;
        }
        this.setState({
            load: true,
        }, () => {
            let dbContext: DBSchemaContextInterface = this.context;
            if (dbContext.allEntitiesList !== undefined && dbContext.allEntitiesList.length !== 0) {
                if (this.props.selectedTableIndex < 0) return;
    
                this.visualisationHandler();
            }
        })
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
    var svg = d3.select("#vis-cont")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

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