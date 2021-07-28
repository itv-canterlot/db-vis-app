import { rollups } from 'd3-array';
import * as React from 'react';
import { convertCompilerOptionsFromJson } from 'typescript';
import { SearchDropdownListProps, SidebarBubbleBlockProps } from './ts/components';
class SearchDropdownList extends React.Component<SearchDropdownListProps, {showList?: boolean, filtering?: boolean, loaded?: boolean}> {
    inputRef: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);

        this.state = {
            showList: false,
            filtering: false,
            loaded: false,
        };

        this.inputRef = React.createRef();
    }

    onListItemClick = (e) => {
        e.preventDefault();
        
        // Send the selected index to parent
        this.props.onListSelectionChange(e);
        // Unfocus from the input box
        this.blurInput();
        // Clear input box
        const inputNode = this.inputRef.current as HTMLInputElement;
        inputNode.value = "";
    }

    // Default renderer for mapping array/object
    defaultArrayMapper = (item, index) => { 
        return <a className={"dropdown-item" + (index == this.props.selectedIndex ? " active" : "")} 
            data-key={index} data-index={index} data-content={item} key={index} href="#" onMouseDown={this.onListItemClick}>{item}</a>
    }

    defaultObjectMapper = ([k, v], index) => {
        return <a className={"dropdown-item" + (index == this.props.selectedIndex ? " active" : "")} 
            data-key={k} data-index={index} data-content={v} key={k} href="#" onMouseDown={this.onListItemClick}>{v}</a>
    }

    arrayRendererHandler = (item, index) => this.props.arrayRenderer(item, index, this.onListItemClick, this.props.selectedIndex);

    renderListElements = () => {
        if (!this.props.dropdownList || this.props.dropdownList.length == 0) {
            return (
                <div className={"dropdown-menu dropdown-custom-text-content" + (this.state.showList ? " d-block" : "")}>
                    <a className="dropdown-item disabled" data-key="-1" data-index="-1" key="-1" href="#"><i>No content</i></a>
                </div>
            )
        } else {
            if (Array.isArray(this.props.dropdownList)) {
                return (
                    <div className={"dropdown-menu dropdown-custom-text-content" + (this.state.showList ? " d-block" : "")}>
                        {this.props.listFilter ?
                            this.props.listFilter(this.props.dropdownList, this.props.innerVal).map(this.props.arrayRenderer ? this.arrayRendererHandler : this.defaultArrayMapper) :
                            this.props.dropdownList.map(this.props.arrayRenderer ? this.arrayRendererHandler : this.defaultArrayMapper)
                        }
                    </div>
                )
            } else {
                let itemList = Object.entries(this.props.dropdownList)
                    .map(this.props.objectRenderer ? this.arrayRendererHandler : this.defaultObjectMapper)
                return (
                    <div className={"dropdown-menu dropdown-custom-text-content" + (this.state.showList ? " d-block" : "")}>
                        {
                            itemList
                        }
                    </div>
                );
            }
        }
    }

    onInputFocus = () => {
        if (this.props.updateListHandler) this.props.updateListHandler();
        this.setState({
            showList: true
        });
        
        const inputNode = this.inputRef.current as HTMLInputElement;
        inputNode.select();
    }

    onInputBlur = () => {
        this.setState({
            showList: false
        });
    }

    blurInput = () => {
        const inputNode = this.inputRef.current as HTMLInputElement;
        inputNode.blur();
    }
    
    onKeyUp = (e: React.KeyboardEvent) => {
        const currentInputValue = this.inputRef.current.value
        if (currentInputValue !== this.props.innerVal) {
            this.props.updateInnerText(currentInputValue)
        }
        if (e.key === "Escape") {
            e.preventDefault();
            this.blurInput();
        }
    }

    componentDidMount() {
        if (this.state.loaded) {
            return;
        }
        // If the currently-selected index is -1, clear the input box
        const inputNode = this.inputRef.current as HTMLInputElement;
        if (!inputNode) return;
        
        if (this.props.selectedIndex < 0) {
            inputNode.value = "";
        } if (this.props.innerVal) {
            inputNode.value = this.props.innerVal;
        }
    }

    componentDidUpdate() {
        const inputNode = this.inputRef.current as HTMLInputElement;
        if (!inputNode) return;
        
        if (this.props.selectedIndex < 0) {
            inputNode.value = "";
        } if (this.props.innerVal) {
            inputNode.value = this.props.innerVal;
        }
    }

    render() {
        return (
            <div className="col">
                <div className="input-group mb-0">
                    {this.renderListElements()}
                    {this.props.prependText === undefined ? null : (
                        <div className="input-group-prepend">
                            <span className="input-group-text">{this.props.prependText}</span>
                        </div>
                    )}
                    <input type="text" className="form-control dropdown-toggle" data-toggle="dropdown" 
                        placeholder={this.props.placeholder} aria-label="Relation"
                        onFocus={this.onInputFocus}
                        onBlur={this.onInputBlur}
                        ref={this.inputRef}
                        id={this.props.id}
                        onKeyUp={this.onKeyUp}
                         />
                </div>
            </div>
        );
    }
}

class SidebarBubbleBlock extends React.Component<SidebarBubbleBlockProps, {}> {
    render() {
        const loadingBody =
            !this.props.isLoaded ? (
                <div className="row">
                    <div className="col overflow-ellipses overflow-hidden">
                        <em>Loading...</em>
                    </div>
                </div>
            ) : null;

        return (
            <div className="row ms-auto me-auto app-sidebar-bubbleblock p-2 mb-3" onClick={this.props.onClick}>
                <div className="col">
                    {this.props.headerElement}
                    {this.props.isLoaded ? this.props.bodyElement : loadingBody}
                </div>
            </div>
        )
    }
}

export {SearchDropdownList, SidebarBubbleBlock};