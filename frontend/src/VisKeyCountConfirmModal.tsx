import * as React from 'react';
import bootstrap = require('bootstrap');

export class VisKeyCountConfirmModal extends React.Component<{onClose: Function, onSelectFiltering: Function, onConfirm: Function}, {}> {
    cachedFilterValueRef: React.RefObject<HTMLInputElement>;

    constructor(props) {
        super(props);
    }

    modalComponent: bootstrap.Modal = undefined;

    handleOnClose = (e: React.BaseSyntheticEvent) => {
        const isCancel = e.target.getAttribute("data-cancel") === "true"
        if (this.modalComponent) {
            this.modalComponent.hide();
        }
        this.props.onClose(isCancel);
    };

    handleSelectFiltering = () => {
        if (this.modalComponent) {
            this.modalComponent.hide();
        }
        this.props.onSelectFiltering();
    }

    handleConfirm = () => {
        if (this.modalComponent) {
            this.modalComponent.hide();
        }
        this.props.onConfirm();
    }

    componentDidMount() {
        const modalElement = document.getElementById("starting-table-select-modal");
        this.modalComponent = new bootstrap.Modal(modalElement, {
            keyboard: false
        });
        this.modalComponent.show();

        modalElement.addEventListener('hidden.bs.modal', () => {
            this.props.onClose();
        });
    }

    render() {        
        return (
            <div className="modal fade d-block" role="dialog" id="starting-table-select-modal">
                <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: "80%" }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Key count check failed</h5>
                            <button type="button" className="close" aria-label="Close" onClick={this.handleOnClose}>
                                <span aria-hidden="true"><i className="fas fa-times" /></span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-danger" role="alert">
                                <p>
                                    Dataset currently selected is too large to fit into the defined visualisation pattern. 
                                </p>
                                <p>
                                    While it is possible to proceed with the visualisation generation, the end result might become unreadable. Continue rendering?
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className={"btn btn-success"} onClick={this.handleConfirm}>Continue</button>
                            <button type="button" className="btn btn-primary disabled" onClick={this.handleSelectFiltering}>Filter dataset</button>
                            <button type="button" className="btn btn-secondary"  data-cancel="true" onClick={this.handleOnClose}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}