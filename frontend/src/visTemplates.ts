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
        case "bar":
            renderBarPlot(parameters);
            return;
        case "chord":
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
        xname = parameters.args["attributeNames"][0][0],
        yname = parameters.args["attributeNames"][0][1],
        xlogScale = parameters.args["xLogScale"],
        ylogScale = parameters.args["yLogScale"];

    // Separate out null data points
    let data = JSON.parse(JSON.stringify(parameters.data))
    let nullPoints = [];
    let nullFilterIndex = data.length - 1;

    while (nullFilterIndex >= 0) {
        const d = data[nullFilterIndex];
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined);
        if (hasNull) {
            nullPoints.push(d);
            data.splice(nullFilterIndex, 1)
        }
        nullFilterIndex--;
    }

    console.log(nullPoints)

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
    
    
    let xShiftValue = 0, yShiftValue = 0;

    let x: d3.ScaleLinear<number, number, never> | d3.ScaleLogarithmic<number, number, never>,
        y: d3.ScaleLinear<number, number, never> | d3.ScaleLogarithmic<number, number, never>;

    
    // Use the smallest (absolute) value next to 0
    let xSmallNumber = 0, ySmallNumber = 0;        
    // let x: d3.ScaleLinear | d3.ScaleLogarithmic;
    if (xlogScale === true) {
        if (xmin <= 0) {
            // Get the second smallest number in the dataset
            xSmallNumber = Math.abs(getSecondSmallestNumberInArray(xmin, xfloat) / 10);
            if (xSmallNumber === undefined) {
                xSmallNumber = 1e-16; // Arbitrary
            }

            xShiftValue = Math.abs(xmin) + xSmallNumber;
        }
        
        x = d3.scaleLog()
            .domain([Math.max(xSmallNumber, xmin), xmax])
            .range([ width / 50, width - (width / 50) ]);


        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x)
                .tickFormat((d, i) => {
                    return x.tickFormat()(d.valueOf() - xShiftValue);
                })
            );
    } else {
        x = d3.scaleLinear()
            .domain([xmin - xext, xmax + xext])
            .range([ 0, width ]);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
    }

    // Add Y axis
    if (ylogScale === true) {
        if (ymin <= 0) {
            ySmallNumber = Math.abs(getSecondSmallestNumberInArray(ymin, yfloat) / 10);
            if (ySmallNumber === undefined) {
                ySmallNumber = 1e-16; // Arbitrary
            }
            yShiftValue = Math.abs(ymin) + ySmallNumber;
        }

        y = d3.scaleLog()
            .domain([Math.max(ySmallNumber, ymin), ymax])
            .range([ height - (height / 50), height / 50]);

        svg.append("g")
            .call(d3.axisLeft(y)
                .tickFormat((d, i) => {
                    return x.tickFormat()(d.valueOf() - yShiftValue)
                })
            );
    } else {
        y = d3.scaleLinear()
            .domain([ymin - yext, ymax + yext])
            .range([ height, 0]);
        
        svg.append("g")
            .call(d3.axisLeft(y));
    }
    
    

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
        .attr("cx", function (d) {
            let xValue = parseFloat(d[xname]) + xShiftValue + xSmallNumber;
            return x(xValue); 
        })
        .attr("cy", function (d) {
            let yValue = parseFloat(d[yname]) + yShiftValue + ySmallNumber;
            return y(yValue); 
        })
        .attr("r", 1.5)
        .style("fill", "#69b3a2")
}

function renderBubblePlot(parameters: VisTemplateBuilder) {
    const width = parameters.width,
        height = parameters.height,
        svg = parameters.svg,
        margin = parameters.margin,
        xname = parameters.args["attributeNames"][0][0],
        yname = parameters.args["attributeNames"][0][1],
        zname = parameters.args["attributeNames"][0][2];
        
    // Separate out null data points
    let data = parameters.data
    let nullPoints = [];
    let nullFilterIndex = data.length - 1;

    while (nullFilterIndex >= 0) {
        const d = data[nullFilterIndex];
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined);
        if (hasNull) {
            nullPoints.push(d);
            data.splice(nullFilterIndex, 1)
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

function renderBarPlot(parameters: VisTemplateBuilder) {
    const width = parameters.width,
        height = parameters.height,
        svg = parameters.svg,
        margin = parameters.margin,
        xname = parameters.args["attributeNames"][0][0],
        publicKeyNames = parameters.args["firstTablePrimaryKeyNames"];

    // Separate out null data points
    let data = JSON.parse(JSON.stringify(parameters.data))
    // Assume the plotted axis is numbers only?
    data = data.map(d => {
        let newD = d;
        newD[xname] = parseFloat(newD[xname]);
        return newD;
    });

    let nullPoints = [];
    let nullFilterIndex = data.length - 1;

    while (nullFilterIndex >= 0) {
        const d = data[nullFilterIndex];
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined);
        if (hasNull) {
            nullPoints.push(d);
            data.splice(nullFilterIndex, 1)
        }
        nullFilterIndex--;
    }

    console.log(nullPoints)

    // Floating point values for the data points - for statistical use only, not for plotting
    const xfloat = data
        .map(d => parseFloat(d[xname]))
        .filter(d => !isNaN(d));

    // Find out the range of each data dimension
    const xmax = Math.max(...xfloat),
        xmin = Math.min(...xfloat);

    const scaleExtensionRatio = 0.15;

    const limitExtensionFunction = (llim: number, hlim: number, scale: number) => {
        return (hlim - llim) * scale;
    }

    const xext = limitExtensionFunction(xmin, xmax, scaleExtensionRatio);

    var x = d3.scaleBand()
    .domain(data.map(d => d[publicKeyNames[0]])) // TODO: assuming single attribute
    .range([ 0, width ])
    .padding(0.2);
    
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([xmin - xext, xmax + xext])
    .range([ height, 0]);
    
    svg.append("g")
    .call(d3.axisLeft(y));

    // Add X axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width/2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text(publicKeyNames[0]);

    // Y axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", - margin.left + 20)
    .attr("x", - margin.top - height/2 + 20)
    .text(xname)

    svg.selectAll("bar")
        .data(data)
        .enter()
        .append("rect")
            .attr("x", function(d) { return x(d[publicKeyNames[0]]); })
            .attr("y", function(d) { return y(d[xname]); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d[xname]); })
            .attr("fill", "#69b3a2")
}

const getSecondSmallestNumberInArray = (min: number, array: number[]) => {
    let targetNumber = undefined;
    array.forEach(d => {
        if (targetNumber === undefined || (d !== min && d < targetNumber)) {
            targetNumber = d;
        }
    })
    return targetNumber;
}