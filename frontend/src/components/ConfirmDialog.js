import React from "react";
import "./ConfirmDialog.css";

class ConfirmDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.showModal !== this.props.showModal) {
      this.setState({ showModal: this.props.showModal });
    }
  }

  handleConfirm = () => {
    if (this.props.onConfirm) {
      this.props.onConfirm();
    }
  };

  handleCancel = () => {
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  };

  render() {
    const { showModal } = this.state;
    return (
      <>
        {showModal && (
          <div className={`confirm-dialog-modal`}>
            <div className="confirm-dialog-modal-content">
              <p>{this.props.message}</p>
              <button onClick={this.handleConfirm}>Yes</button>
              <button onClick={this.handleCancel}>No</button>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default ConfirmDialog;
