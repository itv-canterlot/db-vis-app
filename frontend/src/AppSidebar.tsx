import * as React from 'react';
import { SidebarBubbleBlock } from './UIElements';
import { DBSchemaContext, DBSchemaContextInterface } from './DBSchemaContext';
import { EntitySelector } from './EntitySelector';

import * as ComponentTypes from './ts/components';

export class StartingTableSelectModal extends React.Component<{onClose: React.MouseEventHandler, onTableSelectChange: Function, selectedTableIndex: number}, {}> {
    constructor(props) {
        super(props);
    }

    onTableSelectChange = (e) => {
        this.props.onTableSelectChange(e);
        this.props.onClose(e);
    }
    
    render() {
        return (
            <div className="modal d-block" role="dialog" id="starting-table-select-modal">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Select starting table...</h5>
                        <button type="button" className="close" aria-label="Close" onClick={this.props.onClose}>
                        <span aria-hidden="true"><i className="fas fa-times" /></span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <EntitySelector onTableSelectChange={this.onTableSelectChange} selectedTableIndex={this.props.selectedTableIndex} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={this.props.onClose}>Close</button>
                    </div>
                    </div>
                </div>
            </div>
        );
    }
}

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

        const dbSchemaContext: DBSchemaContextInterface = this.context;
        console.log(dbSchemaContext);

        /* Bubble 2: Selected table */
        const selectedTableBubbleHeader = (
            <div className="row">
                <div className="col">
                    <i className="fas fa-table me-2" />Starting table:
                </div>
            </div>);
    
            const selectedTableBubbleBody = (
                <div className="row">
                    <div className="col overflow-ellipses overflow-hidden">
                        <strong>
                            {this.props.selectedTableIndex >= 0 ? dbSchemaContext.allEntitiesList[this.props.selectedTableIndex].tableName : (<em>None selected</em>)}
                        </strong>
                    </div>
                </div>
            );
        
        return (
        <div className="col-4 col-lg-3 p-3" id="app-sidebar-cont">
            <SidebarBubbleBlock 
                headerElement={databaseAddressHeader} 
                bodyElement={databaseAddressBody} 
                isLoaded={this.state.isLoaded} />
            <SidebarBubbleBlock 
                headerElement={selectedTableBubbleHeader} 
                bodyElement={selectedTableBubbleBody} 
                isLoaded={this.state.isLoaded}
                onClick={this.props.onClickShowStartingTableSelectModal} />
        </div>
        );
    }
}
AppSidebar.contextType = DBSchemaContext;