import * as React from 'react';
import * as d3 from 'd3';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext'
import { Table } from './ts/types'

export class Visualiser extends React.Component<{selectedTableIndex: number}, {load?: boolean}> {
    constructor(props) {
        super(props);
        this.state = {
            load: false
        };
    }
    
    componentDidUpdate() {
        if (this.state.load) {
            return;
        }
        let dbContext: DBSchemaContextInterface = this.context;
        if (dbContext.allEntitiesList !== undefined && dbContext.allEntitiesList.length !== 0) {
            renderScatterPlot(dbContext.allEntitiesList[0], dbContext.allEntitiesList[0], 6, 7);
            this.setState({
                load: true
            });
        }
    }

    render() {
        return (
            <div className="col" id="vis-cont"></div>
        )
    }
}
Visualiser.contextType = DBSchemaContext;

// Some visualisation rendering methods
const renderScatterPlot = (e1: Table, e2: Table, a1Index: number, a2Index: number) => {
    let a1 = e1.attr[a1Index],
        a2 = e2.attr[a2Index];
    // TODO: group two requests into one
    let prom1 = fetch("http://localhost:3000/temp-data-table-name-fields", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            "tableName": e1.tableName,
            "fields": [
                a1.attname
            ]
        }),
    }).then(rawResponse => rawResponse.json());

    let prom2 = fetch("http://localhost:3000/temp-data-table-name-fields", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            "tableName": e2.tableName,
            "fields": [
                a2.attname
            ]
        }),
    }).then(rawResponse => rawResponse.json());

    Promise.all([prom1, prom2]).then(res => {
        return res[0].map((el, i) => {
            return {...el, ...res[1][i]}
        });
    }).then(res => {
        // Copied from https://www.d3-graph-gallery.com/graph/scatter_basic.html
        // set the dimensions and margins of the graph
        var margin = {top: 10, right: 30, bottom: 30, left: 60},
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
        var svg = d3.select("#vis-cont")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
        // Add X axis
        var x = d3.scaleLinear()
        .domain([-180, 180]) // TODO: hardcoded
        .range([ 0, width ]);
        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

        // Add Y axis
        var y = d3.scaleLinear()
        .domain([-180, 180])
        .range([ height, 0]);
        svg.append("g")
        .call(d3.axisLeft(y));

        console.log(res);

        // Add dots
        svg.append('g')
        .selectAll("dot")
        .data(res)
        .enter()
        .append("circle")
            .attr("cx", function (d:any) { return x(d.longitude); } )
            .attr("cy", function (d:any) { return y(d.latitude); } )
            .attr("r", 1.5)
            .style("fill", "#69b3a2")
    })
}