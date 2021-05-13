import { rollups } from 'd3-array';
import * as React from 'react';
import { SearchDropdownListProps, SidebarBubbleBlockProps } from './ts/components';
class SearchDropdownList extends React.Component<SearchDropdownListProps, {showList?: boolean, filtering?: boolean, loaded?: boolean, keyword: string}> {
    inputRef: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);

        this.state = {
            showList: false,
            filtering: false,
            loaded: false,
            keyword: ""
        };

        this.inputRef = React.createRef();
    }

    onListItemClick = (e) => {
        e.preventDefault();
        
        // Send the selected index to parent
        this.props.onListSelectionChange(e);
        // Unfocus from the input box
        this.blurInput();
        // Fill in input box with the name of the selected element
        const inputNode = this.inputRef.current as HTMLInputElement;
        const selectedItemNode = e.target as HTMLAnchorElement;
        inputNode.value = selectedItemNode.getAttribute("data-content");
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
                        {this.props.listFilter(this.props.dropdownList, this.state.keyword).map(this.props.arrayRenderer ? this.arrayRendererHandler : this.defaultArrayMapper)}
                        {/* {this.props.listFilter(this.props.dropdownList, this.state.keyword).map(e => {
                            return (<li>e</li>)
                        })} */}
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
    
    onKeyDown = (e: React.KeyboardEvent) => {
        // TODO: Ctrl
        if (e.key === "Escape") {
            e.preventDefault();
            this.blurInput();
            return;
        } else if (e.key === "Backspace") {
            this.setState({
                keyword: this.state.keyword.slice(0, this.state.keyword.length - 1)
            })
        } else if (e.key.length > 1) {
            const inputNode = this.inputRef.current as HTMLInputElement;
            this.setState({
                keyword: inputNode.value
            });
            return;
        } else {
            const inputNode = this.inputRef.current as HTMLInputElement;
            this.setState({
                keyword: inputNode.value + e.key
            });
            return;
        }
    }

    handleListFilter = (text) => {
        // Object.entries(filteredDropdown)
        if (this.state.loaded) {
            return;
        }

        this.setState({
            loaded: false
        }, () => {
            let entireList;
            
            if (Array.isArray(this.props.dropdownList)) {
                entireList = this.props.dropdownList;
            } else {
                entireList = Object.entries(this.props.dropdownList);
            }
            
            let filteredDropdown;
            if (this.props.listFilter) {
                filteredDropdown = this.props.listFilter(entireList, text)
            } else {
                filteredDropdown = entireList;
            }

            this.setState({
                loaded: true,
            });
        })

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
        this.setState({
            keyword: inputNode.value
        })

        // this.handleListFilter(inputNode.value);
    }

    render() {
        return (
            <div className="col">
                <div className="input-group mb-0">
                    <div className="input-group-prepend">
                        <span className="input-group-text">{this.props.prependText}</span>
                    </div>
                    <input type="text" className="form-control dropdown-toggle" data-toggle="dropdown" 
                        placeholder={this.props.placeholder} aria-label="Relation"
                        onFocus={this.onInputFocus}
                        onBlur={this.onInputBlur}
                        ref={this.inputRef}
                        onKeyDown={this.onKeyDown}
                         />
                </div>
                <div>
                    {this.renderListElements()}
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