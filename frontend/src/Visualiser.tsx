import * as React from 'react';
import * as d3 from 'd3';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext'
import { VISSCHEMATYPES, VisTemplateBuilder } from './ts/types'

import visTemplates from './visTemplates';
import { VisualiserProps, VisualiserStates } from './ts/components';
import { filterDataByFilters, getDatasetEntryCountStatus } from './DatasetUtils';

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
        if (!this.props.rerender) return;

        let context: DBSchemaContextInterface = this.context;
        const selectedPatternIndex = context.selectedPatternIndex;
        const selectedPattern = context.visSchema[selectedPatternIndex];
        const patternMatchStatus = context.visSchemaMatchStatus[selectedPatternIndex][context.selectedMatchResultIndexInPattern];
        const selectedPatternTemplateCode = selectedPattern.template
        
        if (!context.dataLoaded) {
            if (this.state.renderedDataLoaded) {
                this.setState({
                    renderedDataLoaded: false
                });
            }
            return;
        }

        if (!patternMatchStatus || !patternMatchStatus.matched) {
            this.setState({
                renderFailed: true,
                renderedAttributesIndices: context.selectedAttributesIndices,
                renderedTableIndex: context.selectedEntitiesIndices[0],
                renderedMatchResultIndex: context.selectedMatchResultIndexInPattern,
                renderedVisSchemaIndex: selectedPatternIndex,
                renderedFilters: context.filters,
                renderedDataLoaded: context.dataLoaded
            })
            renderEmptyChart();
            return;
        }

        const filteredData = filterDataByFilters(context.data, context, context.filters);
        
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
            
            const primaryRelation = context.relationsList[context.relHierarchyIndices[0][0]];
            const datasetEntryCountStatus = getDatasetEntryCountStatus(filteredData, selectedPattern, primaryRelation);
            if (filteredData.length > 0 && !datasetEntryCountStatus) {
                // Print warning?
                if (!context.visKeyOverride) {
                    this.props.showVisKeyCountConfirmModal();
                    return;
                }
                // this.setState({
                //     renderFailed: true,
                //     renderedAttributesIndices: context.selectedAttributesIndices,
                //     renderedTableIndex: context.selectedEntitiesIndices[0],
                //     renderedMatchResultIndex: context.selectedMatchResultIndexInPattern,
                //     renderedVisSchemaIndex: selectedPatternIndex,
                //     renderedFilters: context.filters,
                //     renderedDataLoaded: context.dataLoaded
                // });
                // renderEmptyChart(true);
            }

            if (primaryRelation.type === VISSCHEMATYPES.MANYMANY && patternMatchStatus.vs.type === VISSCHEMATYPES.ONEMANY) {
                const responsibleManyFk = primaryRelation.parentEntity.fk[(patternMatchStatus.manyManyOneSideFkIndex === 0) ? 1 : 0];
                firstTablePrimaryKeyNames = 
                    responsibleManyFk.columns.map(col => {
                            return `pk_${primaryRelation.parentEntity.tableName}_${col.fkColName}`;
                        });
            } else if (patternMatchStatus.vs.type === VISSCHEMATYPES.ONEMANY) {
                firstTablePrimaryKeyNames = 
                    primaryRelation.childRelations[0].table.pk.columns.map(col => {
                            return `pk_${primaryRelation.childRelations[0].table.tableName}_${col.colName}`;
                        });
            }
            else {
                firstTablePrimaryKeyNames = 
                    primaryRelation.parentEntity
                        .pk.columns.map(col => {
                            return `pk_${primaryRelation.parentEntity.tableName}_${col.colName}`;
                        });
            }
    
            selectedAttributesPublicKeyNames = 
                context.selectedAttributesIndices[0].map(att => att.table.pk.columns.map(col => `pk_${att.table.tableName}_${col.colName}`))
    
            selectedAttributesForeignKeyNames = context.selectedAttributesIndices[0].map(att => {
                if (!patternMatchStatus || !patternMatchStatus.responsibleRelation) return;
                const responsibleFkInRel = 
                    patternMatchStatus.responsibleRelation.childRelations
                        .find(cr => cr.table.idx === att.table.idx);
                if (responsibleFkInRel) {
                    // If defined:
                    // NOTE: Wrong for many-many?
                    if (primaryRelation.type === VISSCHEMATYPES.MANYMANY && patternMatchStatus.vs.type === VISSCHEMATYPES.ONEMANY) {
                        const responsibleFk = primaryRelation.parentEntity.fk[patternMatchStatus.manyManyOneSideFkIndex];
                        return responsibleFk
                            .columns.map(col => `pk_${primaryRelation.parentEntity.tableName}_${col.fkColName}`);
                    }
                    const responsibleFk = 
                            att.table.fk[responsibleFkInRel.fkIndex];
                    return responsibleFk
                            .columns.map(col => `pk_${responsibleFkInRel.table.tableName}_${col.fkColName}`);
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

        // console.log(params);

        if (!context.data || context.data.length === 0) {
            this.setState({
                renderFailed: true,
                renderedAttributesIndices: context.selectedAttributesIndices,
                renderedTableIndex: context.selectedEntitiesIndices[0],
                renderedMatchResultIndex: context.selectedMatchResultIndexInPattern,
                renderedVisSchemaIndex: selectedPatternIndex,
                renderedFilters: context.filters,
                renderedDataLoaded: context.dataLoaded
            });
            renderEmptyChart();
            return;
        }
        
        renderVisualisation(selectedPatternTemplateCode, filteredData, params);
        this.setState({
            renderFailed: false,
            renderedAttributesIndices: context.selectedAttributesIndices,
            renderedMatchResultIndex: context.selectedMatchResultIndexInPattern,
            renderedTableIndex: context.selectedEntitiesIndices[0],
            renderedVisSchemaIndex: selectedPatternIndex,
            renderedFilters: context.filters,
            renderedDataLoaded: context.dataLoaded
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
        if (context.showVisKeyCountConfirmModal) {
            return false;
        }
        if (context.dataLoaded) {
            if (context.dataLoaded === this.state.renderedDataLoaded) {
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
        if (this.state) {
            if (this.renderStateDidChange()) {
                this.visualisationHandler();
            }
        }
    }

    render() {
        return (
            <div className="row g-0" id="main-vis-cont">
                <div className="col">
                    {/* <div className="btn-group btn-group-sm" id="a1-scale-btn-group" role="group" aria-label="Axis log scale radio buttons">
                        <input type="radio" className="btn-check" name="btnradio" id="btnradio1" autoComplete="off"
                            data-att-index="a1" data-is-log={false} onChange={this.onAxisScaleChange} />
                        <label className="btn btn-outline-primary" htmlFor="btnradio1">Linear scale</label>

                        <input type="radio" className="btn-check" name="btnradio" id="btnradio2" autoComplete="off" 
                            data-att-index="a1" data-is-log={true}  onChange={this.onAxisScaleChange}/>
                        <label className="btn btn-outline-primary" htmlFor="btnradio2">Log scale</label>
                    </div> */}
                    <div id="graph-cont">
                    </div>
                {/* {this.filterButton()} */}
                </div>
            </div>
        )
    }
}

Visualiser.contextType = DBSchemaContext;

const renderEmptyChart = (isCountFailed?: boolean) => {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 800 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

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

    svg.append("text").text(isCountFailed ? "Key count does not match pattern constraints" : "Render failed");
}

const renderVisualisation = (visSpecificCode: string, data: object[], args: object) => {
    if (!visSpecificCode) return; // Do not render if no template name is specified
    
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 800 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

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