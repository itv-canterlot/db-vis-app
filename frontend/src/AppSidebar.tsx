import * as React from 'react';

import { SidebarBubbleBlock } from './UIElements';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { Table } from './ts/types';

import * as ComponentTypes from './ts/components';
export class AppSidebar extends React.Component<ComponentTypes.AppSidebarProps, {isLoaded?: boolean}> {
    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false
        }
    }

    componentDidMount() {
        if (this.state.isLoaded) return;
        this.setState({
            isLoaded: true
        })
    }

    render() {
        /* Bubble 1: database address */
        const databaseAddressHeader = (
        <div className="row">
            <div className="col">
                <i className="fas fa-database me-2" />Database address:
            </div>
        </div>);

        const databaseAddressBody = (
            <div className="row">
                <div className="col overflow-ellipses overflow-hidden">
                    <strong>
                        {this.props.databaseLocation}
                    </strong>
                </div>
            </div>
        );

        const context: DBSchemaContextInterface = this.context;
        let selectedEntities: Table[] = [];
        
        if (context.selectedEntitiesIndices.length > 0) {
            selectedEntities = context.selectedEntitiesIndices.map(idx => context.allEntitiesList[idx]);
        }



        /* Bubble 2: Selected table */
        const selectedTableBubbleHeader = (
            <div className="row">
                <div className="col">
                    <i className="fas fa-table me-2" />Starting table:
                </div>
            </div>);

        const selectedTableBubbleBody = (
            <div>
                <div className="row">
                    <div className="col overflow-ellipses overflow-hidden">
                        <strong>
                            {selectedEntities.length > 0 ? selectedEntities.map(ent => ent.tableName).join(",") : (<em>None selected</em>)}
                        </strong>
                    </div>
                </div>
                <div className="row">
                    <div className="col overflow-ellipses overflow-hidden">
                    </div>
                </div>
            </div>
        );

        /* Bubble 3: database address */
        const matchedSchemaHeader = (
            <div className="row">
                <div className="col">
                    <i className="fas fa-sitemap me-2" />Edit schema?
                </div>
            </div>);
    
        const matchedSchemaBody = (
            <div className="row">
                <div className="col overflow-ellipses overflow-hidden">
                    <strong>
                        {context.selectedEntitiesIndices.length >= 0 ? "TODO" : <em>Not available</em>}
                    </strong>
                </div>
            </div>
        );

        /* Bubble 4: Filter dataset */
        const filterDatasetHeader = (
            <div className="row">
                <div className="col">
                    <i className="fas fa-filter me-2" />Filter
                </div>
            </div>);

    
        const filterDatasetBody = (
            <div className="row">
                <div className="col overflow-ellipses overflow-hidden">
                    <strong>
                        {context.selectedEntitiesIndices.length >= 0 ? context.filters.length + (" filter(s) applied") : <em>Not available</em>}
                    </strong>
                </div>
            </div>
        );
        
        return (
        <div className="col-4 col-lg-3" id="app-sidebar-cont">
            <div className="row">
                <div className="col g-0 p-3">
                    <SidebarBubbleBlock 
                        headerElement={databaseAddressHeader} 
                        bodyElement={databaseAddressBody} 
                        isLoaded={this.state.isLoaded} />
                    <SidebarBubbleBlock 
                        headerElement={selectedTableBubbleHeader} 
                        bodyElement={selectedTableBubbleBody} 
                        isLoaded={this.state.isLoaded}
                        onClick={this.props.onClickShowStartingTableSelectModal} />
                    <SidebarBubbleBlock
                        headerElement={matchedSchemaHeader}
                        bodyElement={matchedSchemaBody}
                        isLoaded={this.state.isLoaded}
                        onClick={undefined} />
                    <SidebarBubbleBlock
                        headerElement={filterDatasetHeader}
                        bodyElement={filterDatasetBody}
                        isLoaded={this.state.isLoaded}
                        onClick={this.props.onClickShowFilterSelectModal} />
                </div>
            </div>
        </div>
        );
    }
}
AppSidebar.contextType = DBSchemaContext;