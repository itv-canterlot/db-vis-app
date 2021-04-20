const React = require('react');
const ReactDOM = require('react-dom');

class SearchDropdownList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showList: false,
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
        inputNode.value = selectedItemNode.textContent;
    }

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
                        {this.props.dropdownList.map((item, index) => {
                            <a className={"dropdown-item" + (index == this.props.selectedIndex ? " active" : "")} 
                                data-key={index} data-index={index} key={index} href="#" onMouseDown={this.onListItemClick}>{item}</a>
                        })}
                    </div>
                )
            } else {
                let itemList = Object.entries(this.props.dropdownList)
                    .map(([k, v], index) => {
                        return <a className={"dropdown-item" + (index == this.props.selectedIndex ? " active" : "")} 
                            data-key={k} data-index={index} key={k} href="#" onMouseDown={this.onListItemClick}>{v}</a>
                    })
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
        this.props.updateListHandler();
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

    render() {
        return (
            <div>
                <div className="input-group mb-0">
                    <div className="input-group-prepend">
                        <span className="input-group-text">{this.props.prependText}</span>
                    </div>
                    <input type="text" className="form-control dropdown-toggle" data-toggle="dropdown" 
                        placeholder={this.props.placeholder} aria-label="Relation"
                        onFocus={this.onInputFocus}
                        onBlur={this.onInputBlur}
                        ref={this.inputRef}
                         />
                </div>
                {this.renderListElements()}
            </div>
        );
    }
}

export default SearchDropdownList;