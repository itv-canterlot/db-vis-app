import * as React from 'react';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { AppMainContProps, AppMainContStates } from './ts/components';
import { Visualiser } from './Visualiser';
import { keyCountCheck } from './VisSchemaMatcher';
import { SchemaExplorer } from './SchemaExplorer';

export class AppMainCont extends React.Component<AppMainContProps, AppMainContStates> {
    constructor(props) {
        super(props);
        this.state = {
            explorerExpanded: false
        }
    }

    onExpansionClick = () => {
        this.setState({
            explorerExpanded: !this.state.explorerExpanded
        })
    }

    onDataChange = (data: object) => {
        if (this.props.onDataChange) {
            this.props.onDataChange(data);
        }
    }

    render() {
        if (this.props.load) {
            return (<div>Loading...</div>);
        }
        
        const context: DBSchemaContextInterface = this.context;

        const schemaExplorerAccordianTitle = () => {
            const selectedEntitiesIndices = context.selectedEntitiesIndices;
            const selectedRelationsIndices = context.selectedRelationsIndices;
            const selectedAttributesIndices = context.selectedAttributesIndices;
            const selectedPattern = context.visSchema[context.selectedPatternIndex];
            
            if (selectedEntitiesIndices.length === 0 && selectedRelationsIndices.length === 0) {
                return (
                    <h5>
                        <span className="badge bg-secondary">No data selected</span>
                    </h5>
                );
            } else {
                const selectedAttributeLength = selectedAttributesIndices.reduce(((acc, atts) => acc + atts.length), 0)
                return (
                    <div className="d-flex">
                        <h5>
                            <span className="badge bg-success me-1">{selectedEntitiesIndices.length} entities</span>
                        </h5>
                        <h5>
                            <span className="badge bg-info me-1">{selectedRelationsIndices.length} relations</span>
                        </h5>
                        <h5>
                            <span className="badge bg-warning me-1">{selectedAttributeLength} attributes</span>
                        </h5>
                        <h5>
                            <span className="badge bg-primary me-1">{(selectedPattern === undefined) ? "No pattern selected" : ("Pattern: " + selectedPattern.name)}</span>
                        </h5>
                    </div>
                );
            }
        };

        const renderVisualiser = () => {
            // There must be a pattern selected
            if (context.selectedPatternIndex < 0) return false;
            return context.selectedEntitiesIndices.length > 0 || context.selectedRelationsIndices.length > 0;
        }

        return (
            <div className="col-8 col-lg-9 g-0">
                <div className="accordion" id="accordionFlushExample">
                    <div className="accordion-item">
                        <div id="flush-collapseOne" className="accordion-collapse collapse" aria-labelledby="flush-headingOne" data-bs-parent="#accordionFlushExample">
                            <SchemaExplorer 
                                expanded={this.state.explorerExpanded}
                                onExpansionClick={this.onExpansionClick}
                                onVisPatternIndexChange={this.props.onVisPatternIndexChange}
                                onClickShowFilterSelectModal={this.props.onClickShowFilterSelectModal}
                                onMatchResultIndexChange={this.props.onMatchResultIndexChange}
                                onSelectedAttributeIndicesChange={this.props.onSelectedAttributeIndicesChange}
                                onRelHierarchyChange={this.props.onRelHierarchyChange}
                                 />
                        </div>
                        <h2 className="accordion-header" id="flush-headingOne">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
                            {schemaExplorerAccordianTitle()}
                        </button>
                        </h2>
                    </div>
                </div>
                <div className="row g-0">
                    <div className="col">
                        {
                            renderVisualiser() ? 
                            <Visualiser 
                                showVisKeyCountConfirmModal={this.props.showVisKeyCountConfirmModal}
                                rerender={this.props.rerender}
                                onDataChange={this.onDataChange} />
                                : null
                        }
                    </div>
                </div>
            </div>
        );
    }
}
AppMainCont.contextType = DBSchemaContext;

const groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};

export const groupBySecondLevelAttr = function(xs, key1, key2) {
    return xs.reduce(function(rv, x) {
      (rv[x[key1][key2]] = rv[x[key1][key2]] || []).push(x);
      return rv;
    }, {});
};