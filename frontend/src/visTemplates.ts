import * as d3 from "d3";
import { VisTemplateBuilder } from "./ts/types";

export default function visTemplates(graphType, parameters) {
    switch (graphType) {
        case "scatter":
            renderScatterPlot(parameters);
            return;
        case "bubble":
            renderBubblePlot(parameters);
            return;
        default:
            return;
    }
}

function renderScatterPlot(parameters: VisTemplateBuilder) {
    const width = parameters.width,
        height = parameters.height,
        svg = parameters.svg,
        margin = parameters.margin,
        xname = parameters.args[0],
        yname = parameters.args[1];
        // rawData = parameters.data;
        
    // let data = [];
    let data = parameters.data
    let nullPoints = [];
    // Separate out null data points
    let nullFilterIndex = data.length - 1;

    while (nullFilterIndex >= 0) {
        const d = data[nullFilterIndex];
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined);
        if (hasNull) {
            nullPoints.push(d);
            data.splice(nullFilterIndex, 1)
        } else {
            // data.push(d);
        }
        nullFilterIndex--;
    }


    // Floating point values for the data points - for statistical use only, not for plotting
    const xfloat = data
        .map(d => parseFloat(d[xname]))
        .filter(d => !isNaN(d));

    const yfloat = data
        .map(d => parseFloat(d[yname]))
        .filter(d => !isNaN(d))

    // Find out the range of each data dimension
    const xmax = Math.max(...xfloat),
        xmin = Math.min(...xfloat),
        ymax = Math.max(...yfloat),
        ymin = Math.min(...yfloat)
    const scaleExtensionRatio = 0.15;

    const limitExtensionFunction = (llim: number, hlim: number, scale: number) => {
        return (hlim - llim) * scale;
    }

    const xext = limitExtensionFunction(xmin, xmax, scaleExtensionRatio);
    const yext = limitExtensionFunction(ymin, ymax, scaleExtensionRatio);

    var x = d3.scaleLinear()
    .domain([xmin - xext, xmax + xext])
    .range([ 0, width ]);
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([ymin - yext, ymax + yext])
    .range([ height, 0]);
    svg.append("g")
    .call(d3.axisLeft(y));

    // Add X axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width/2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text(xname);

    // Y axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", - margin.left + 20)
    .attr("x", - margin.top - height/2 + 20)
    .text(yname)

    // Add dots
    svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
        .attr("cx", function (d) { return x(d[xname]); } )
        .attr("cy", function (d) { return y(d[yname]); } )
        .attr("r", 1.5)
        .style("fill", "#69b3a2")
}

function renderBubblePlot(parameters: VisTemplateBuilder) {
    const width = parameters.width,
        height = parameters.height,
        svg = parameters.svg,
        margin = parameters.margin,
        xname = parameters.args[0],
        yname = parameters.args[1],
        zname = parameters.args[2];
        // rawData = parameters.data;
        
    // let data = [];
    let data = parameters.data
    let nullPoints = [];
    // Separate out null data points
    let nullFilterIndex = data.length - 1;

    while (nullFilterIndex >= 0) {
        const d = data[nullFilterIndex];
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined);
        if (hasNull) {
            nullPoints.push(d);
            data.splice(nullFilterIndex, 1)
        } else {
            // data.push(d);
        }
        nullFilterIndex--;
    }


    // Floating point values for the data points - for statistical use only, not for plotting
    const xfloat = data
        .map(d => parseFloat(d[xname]))
        .filter(d => !isNaN(d));

    const yfloat = data
        .map(d => parseFloat(d[yname]))
        .filter(d => !isNaN(d))

    const zfloat = data
        .map(d => parseFloat(d[zname]))
        .filter(d => !isNaN(d))

    // Find out the range of each data dimension
    const xmax = Math.max(...xfloat),
        xmin = Math.min(...xfloat),
        ymax = Math.max(...yfloat),
        ymin = Math.min(...yfloat),
        zmax = Math.max(...zfloat),
        zmin = Math.min(...zfloat)
    const scaleExtensionRatio = 0.15;

    const limitExtensionFunction = (llim: number, hlim: number, scale: number) => {
        return (hlim - llim) * scale;
    }

    const xext = limitExtensionFunction(xmin, xmax, scaleExtensionRatio);
    const yext = limitExtensionFunction(ymin, ymax, scaleExtensionRatio);

    var x = d3.scaleLinear()
    .domain([xmin - xext, xmax + xext])
    .range([ 0, width ]);
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([ymin - yext, ymax + yext])
    .range([ height, 0]);
    svg.append("g")
    .call(d3.axisLeft(y));

    // Add scale for bubble size
    var z = d3.scaleLinear()
    .domain([zmin, zmax])
    .range([ 1, 40]); // TODO: hard-coded

    // Add X axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width/2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text(xname);

    // Y axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", - margin.left + 20)
    .attr("x", - margin.top - height/2 + 20)
    .text(yname)

    // Add dots
    svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
        .attr("cx", function (d) { return x(d[xname]); } )
        .attr("cy", function (d) { return y(d[yname]); } )
        .attr("r", function (d) { return z(d[zname]); } )
        .style("fill", "#69b3a2")
        .style("opacity", "0.3") // TODO: hard-coded
        .attr("stroke", "black")
}