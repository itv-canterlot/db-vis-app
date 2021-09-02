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
            renderChordPlot(parameters);
            return;
        case "treemap":
            renderTreeMap(parameters);
            return;
        case "line":
            renderLinePlot(parameters);
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

    const dotRadius = 3

    // Separate out null data points
    let data = JSON.parse(JSON.stringify(parameters.data))
    let nullPoints = [];
    let nullFilterIndex = data.length - 1;

    while (nullFilterIndex >= 0) {
        const d = data[nullFilterIndex];
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined || x === NaN);
        if (hasNull) {
            nullPoints.push(d);
            data.splice(nullFilterIndex, 1)
        }
        nullFilterIndex--;
    }

    // console.log(nullPoints)

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
            // .domain([Math.max(xSmallNumber, xmin), xmax])
            .domain([xmin + xShiftValue, xmax + xShiftValue])
            .range([ width / 50, width - (width / 50) ]);


        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x)
                .tickFormat((d, i) => {
                    const unShiftedValue = d.valueOf() - xShiftValue;
                    const defaultTick = x.tickFormat()(d);

                    if (defaultTick.length > 0) {
                        // This needs to be shifted
                        return formatNumberAsExponential(unShiftedValue);
                    } else {
                        return "";
                    }
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
            // .domain([Math.max(ySmallNumber, ymin), ymax])
            .domain([ymin + yShiftValue, ymax + yShiftValue])
            .range([ height - (height / 50), height / 50]);

        svg.append("g")
            .call(d3.axisLeft(y)
                .tickFormat((d, i) => {
                    const unShiftedValue = d.valueOf() - yShiftValue;
                    const defaultTick = y.tickFormat()(d);

                    if (defaultTick.length > 0) {
                        // This needs to be shifted
                        return formatNumberAsExponential(unShiftedValue);
                    } else {
                        return "";
                    }
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
        .attr("r", dotRadius)
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

    const zRange = [2, 80];
        
    // Separate out null data points
    let data = parameters.data
    let nullPoints = [];
    let nullFilterIndex = data.length - 1;

    while (nullFilterIndex >= 0) {
        const d = data[nullFilterIndex];
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined || x === NaN);
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
    .range(zRange); // TODO: hard-coded

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
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined || x === NaN);
        if (hasNull) {
            nullPoints.push(d);
            data.splice(nullFilterIndex, 1)
        }
        nullFilterIndex--;
    }

    // console.log(nullPoints)

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

function renderTreeMap(parameters: VisTemplateBuilder) {
    const width = parameters.width,
        height = parameters.height,
        svg = parameters.svg,
        margin = parameters.margin,
        xname = parameters.args["attributeNames"][0][0],
        groupByKeyNames = parameters.args["selectedAttributesForeignKeyNames"],
        individualKeyNames = parameters.args["firstTablePrimaryKeyNames"];

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
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined || x === NaN);
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

    // Find out the range of each data dimension
    // const xmax = Math.max(...xfloat),
    //     xmin = Math.min(...xfloat);

    let dataGroupedByKeyNames = groupByMultipleKeys(data, groupByKeyNames[0]);
    let treeMapRoot: any = {
        "name": "root",
        "children": Object.keys(dataGroupedByKeyNames).map(key => {
            return {
                "name": JSON.parse(key).join(","),
                "children": dataGroupedByKeyNames[key].map(object => {
                    return {
                        "name": individualKeyNames.map(kk => object[kk]).join(","),
                        "value": object[xname]
                    }
                })
            }
        })
    }

    const color = d3.scaleOrdinal(d3.schemeCategory10)
    
    const treeMapObject = d3.treemap()
        .size([width, height])
        .padding(1)
        .round(true)
        (d3.hierarchy(treeMapRoot).sum(d => d.value))

    const leaf = svg.selectAll("g")
        .data(treeMapObject.leaves())
        .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

    leaf.append("rect")
        .attr("id", (d, i) => {
            const newId = "leaf" + i;
            d.leadUid = newId;
            return newId;
        })
        .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
        .attr("fill-opacity", 0.6)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0);
    
    leaf.append("clipPath")
        .attr("id", (d, i) => {
            const newId = "clip" + i;
            d.clipUId = newId;
            return newId;
        })
        .append("use")
            .attr("xlink:href", (d, i) => "#leaf" + i);

    leaf.append("text")
        .attr("clip-path", (d, i) => "url(#clip" + i + ")")
        .selectAll("tspan")
        // .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(d3.format(d.value)))
        .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g))
        .enter()
        .append("tspan")
            .attr("x", 4)
            // .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("y", (d, i, nodes) => `${ 1.1 + i * 0.9}em`)
            // .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .text(d => d);

}

function renderLinePlot(parameters: VisTemplateBuilder) {
    const width = parameters.width,
        height = parameters.height,
        svg = parameters.svg,
        margin = parameters.margin,
        attName = parameters.args["attributeNames"][0][0];

    let selectedAttributesPKNames = parameters.args["selectedAttributesPublicKeyNames"][0]; // Compulsory attributes only
    let selectedAttributesFKNames = parameters.args["selectedAttributesForeignKeyNames"][0]; // Compulsory attributes only

    // Remove columns in the table the attribute is in that links between tables
    for (let i = selectedAttributesPKNames.length - 1; i >= 0; i--) {
        if (selectedAttributesFKNames.includes(selectedAttributesPKNames[i])) {
            selectedAttributesPKNames.splice(i, 1);
        }
    }

    // Separate out null data points
    let data = JSON.parse(JSON.stringify(parameters.data))
    let dataGroupedByNames = d3.group(data, d => d[selectedAttributesFKNames[0]]);

    let nullPoints = [];
    let nullFilterIndex = data.length - 1;

    while (nullFilterIndex >= 0) {
        const d = data[nullFilterIndex];
        const hasNull = Object.values(d).some(x => x === null || x === '' || x === undefined || x === NaN);
        if (hasNull) {
            nullPoints.push(d);
            data.splice(nullFilterIndex, 1)
        }
        nullFilterIndex--;
    }

    // Floating point values for the data points - for statistical use only, not for plotting
    const dataFloat = data
        .map(d => parseFloat(d[attName]))
        .filter(d => !isNaN(d));

    const xAxisFloat = data
        .map(d => parseFloat(d[selectedAttributesPKNames[0]]))
        .filter(d => !isNaN(d));

    // Find out the range of each data dimension
    const attMax = Math.max(...dataFloat),
        attMin = Math.min(...dataFloat),
        xAxisMax = Math.max(...xAxisFloat),
        xAxisMin = Math.min(...xAxisFloat);

    var x = d3.scaleLinear()
        .domain([xAxisMin, xAxisMax])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5));

    var y = d3.scaleLinear()
        .domain([attMin, attMax])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add X axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width/2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text(selectedAttributesPKNames[0]);

    // Y axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", - margin.left + 20)
    .attr("x", - margin.top - height/2 + 20)
    .text(attName)

    // Group names
    // Colours TODO
    svg.selectAll(".line")
        .data(dataGroupedByNames)
        .enter()
        .append("path")
            .attr("fill", "none")
            .attr("stroke", (d, i) => color(i))
            .attr("stroke-width", 1.5)
            .attr("d", (d) => {
                return d3.line()
                    .x(d => x(d[selectedAttributesPKNames[0]]))
                    .y(d => y(d[attName]))
                    (d[1])
            })
}

const renderChordPlot = (parameters: VisTemplateBuilder) => {
    const width = parameters.width,
        height = parameters.height,
        attName = parameters.args["attributeNames"][0][0];

    const outerRadius = Math.min(width, height) * 0.5 - 60,
        innerRadius = outerRadius - 10;

    let svg = parameters.svg;
    svg.attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    const publicKeyNames: string[] = parameters.args["firstTablePrimaryKeyNames"];
    let data: object[] = JSON.parse(JSON.stringify(parameters.data));

    // Get public key values for each of the PK names
    if (publicKeyNames.length !== 2) {
        return;
    }

    const uniqueEntriesPerKey = publicKeyNames.map(pkName => {
        const allEntryNames = data.map(d => d[pkName]);
        return [...new Set(allEntryNames)];
    })

    let allUniqueEntries = [...new Set([...uniqueEntriesPerKey[0], ...uniqueEntriesPerKey[1]])];
    // Filter dataset entries that are not contained within the set?
    // allUniqueEntries = allUniqueEntries.filter(key => uniqueEntriesPerKey.every(entries => entries.includes(key)));
    const allUniqueEntriesMapByIndex = allUniqueEntries.reduce((map, obj, idx) => {
        map[obj] = idx;
        return map;
    }, {});
    const uniqueEntryCount = allUniqueEntries.length;

    let matrix: number[][] = Array.from(Array(uniqueEntryCount), _ => Array(uniqueEntryCount).fill(0));

    data.forEach(d => {
        const k1 = d[publicKeyNames[0]];
        const k2 = d[publicKeyNames[1]];
        const v = parseFloat(d[attName]);

        const i1 = allUniqueEntriesMapByIndex[k1];
        const i2 = allUniqueEntriesMapByIndex[k2];
        // Check if both indices are able to be mapped into the matrix
        if (i1 !== undefined && i2 !== undefined) {
            matrix[i1][i2] = v;
            matrix[i2][i1] = v;
        }
    })

    const chordDataObject = Object.assign(matrix, {
        "names": allUniqueEntries
    });

    const chords = d3.chord()
        .padAngle(10 / innerRadius)
        .sortSubgroups(d3.descending)
        .sortChords(d3.descending)
        (chordDataObject);
    
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);
            
    const colors = d3.quantize(d3.interpolateRainbow, allUniqueEntries.length)
    const color = d3.scaleOrdinal(allUniqueEntries, colors)

    const group = svg.append("g")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .selectAll("g")
            .data(chords.groups)
            .join("g")

    group.append("path")
        .attr("fill", (d, i) => color(allUniqueEntries[i]))
        .attr("d", arc);
    
    group.append("title")
        .attr("id", (d, i) => "title" + i)
        .text(d => `${allUniqueEntries[d.index]}`);

    const tickStep = d3.tickStep(0, d3.sum(chordDataObject.flat()), 100)

    function ticks({startAngle, endAngle, value}) {
        const k = (endAngle - startAngle) / value;
        return d3.range(0, value, tickStep).map(value => {
            return {value, angle: value * k + startAngle};
        });
    }

    const groupTick = group.append("g")
        .selectAll("g")
        .data(ticks)
        .join("g")
          .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);
    
    groupTick.append("line")
        .attr("stroke", "currentColor")
        .attr("x2", 6);
    
    groupTick.append("text")
        .attr("x", 8)
        .attr("dy", "0.35em")
        .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    //   .text(d => d.value);

    group.select("text")
        .attr("font-weight", "bold")
        .text(function(d) {
          return this.getAttribute("text-anchor") === "end"
              ? `↑ ${allUniqueEntries[d.index]} (${matrix[d.index].reduce((a, b) => a + b, 0)})`
              : `${allUniqueEntries[d.index]} (${matrix[d.index].reduce((a, b) => a + b, 0)}) ↓`;
        });

    const ribbon = d3.ribbon()
        .radius(innerRadius - 1)
        .padAngle(1 / innerRadius);

    svg.append("g")
        .attr("fill-opacity", 0.8)
        .selectAll("path")
        .data(chords)
        .join("path")
            .style("mix-blend-mode", "multiply")
            .attr("fill", (d, i) => color(allUniqueEntries[d.source.index]))
            .attr("d", ribbon)
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

const formatNumberAsExponential = (n: number): string => {
    const expFormat = d3.format(".0e");
    return expFormat(n);
}

const groupByMultipleKeys = (xs: object[], keys: string[]) => {
    let out: {[key: string]: object[]} = {};
    xs.forEach(x => {
        // const {...keys, ...subObject} = x;
        const mappedKey = JSON.stringify(keys.map(k => x[k]));
        if (mappedKey in out) {
            out[mappedKey].push(x)
        } else {
            out[mappedKey] = [x];
        }
    });

    return out;
}