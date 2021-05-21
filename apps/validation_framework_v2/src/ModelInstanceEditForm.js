import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import axios from 'axios';
import PropTypes from 'prop-types';
import React from 'react';
import ContextMain from './ContextMain';
import ErrorDialog from './ErrorDialog';
import { datastore } from "./datastore";
import { replaceEmptyStringsWithNull } from "./utils";
import LoadingIndicatorModal from './LoadingIndicatorModal';
import ModelInstanceArrayOfForms from './ModelInstanceArrayOfForms';
import Theme from './theme';

let versionAxios = null;

export default class ModelInstanceEditForm extends React.Component {
    signal = axios.CancelToken.source();
    static contextType = ContextMain;

    constructor(props, context) {
        super(props, context);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleFieldChange = this.handleFieldChange.bind(this);
        this.createPayload = this.createPayload.bind(this);
        this.checkRequirements = this.checkRequirements.bind(this);
        this.checkVersionUnique = this.checkVersionUnique.bind(this);

        const [authContext,] = this.context.auth;
        //
        //

        this.state = {
            instances: [{
                id: "",
                version: "",
                description: "",
                parameters: "",
                morphology: "",
                source: "",
                code_format: "",
                license: "",
                hash: "",
                timestamp: "",
                uri: ""
            }],
            auth: authContext,
            loading: false
        }

        this.handleErrorEditDialogClose = this.handleErrorEditDialogClose.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.checkVersionUnique = this.checkVersionUnique.bind(this);
        this.createPayload = this.createPayload.bind(this);
    }

    componentDidMount() {
        this.setState({ instances: [{ ...this.props.instance }] })
    }

    handleErrorEditDialogClose() {
        this.setState({ 'errorEditModelInstance': null });
    };

    handleCancel() {
        console.log("Hello")
        this.props.onClose();
    }

    async checkVersionUnique(newVersion) {
        let isUnique = false;
        if (versionAxios) {
            versionAxios.cancel();
        }
        versionAxios = axios.CancelToken.source();

        await datastore.getModelInstanceFromVersion(this.props.modelID, newVersion, versionAxios)
            .then(res => {

                if (res.data.length === 0) {
                    isUnique = true;
                }
            })
            .catch(err => {
                if (axios.isCancel(err)) {
                    console.log('Error: ', err.message);
                } else {
                    cons0le.log(err);
                }
            });
        return isUnique
    }

    createPayload() {
        let payload = {
            ...this.state.instances[0]
        }
        return replaceEmptyStringsWithNull(payload);
    }

    async checkRequirements(payload) {
        // rule 1: model instance version cannot be empty
        let error = null;
        if (payload.version === "") {
            error = "Model instance 'version' cannot be empty!"
        }
        else {
            // rule 2: if version has been changed, check if new version is unique
            if (payload.version !== this.props.instance.version) {
                let isUnique = await this.checkVersionUnique(payload.version);
                if (!isUnique) {
                    error = "Model instance 'version' has to be unique within a model!"
                }
            }
        }
        if (error) {
            cons0le.log(error);
            this.setState({
                errorEditModelInstance: error,
            });
            return false;
        } else {
            return true;
        }
    }

    async handleSubmit() {
        this.setState({ loading: true }, async () => {
            let payload = this.createPayload();

            if (await this.checkRequirements(payload)) {
                datastore.updateModelInstance(this.props.modelID, payload, this.signal)
                    .then(modelInstance => {

                        this.props.onClose(modelInstance);
                    })
                    .catch(err => {
                        if (axios.isCancel(err)) {
                            console.log('Error: ', err.message);
                        } else {
                            cons0le.log(err);
                            this.setState({
                                errorEditModelInstance: err.response,
                            });
                        }
                        this.setState({ loading: false })
                    });
            } else {
                this.setState({ loading: false })
            }
        })
    }

    handleFieldChange(event) {
        const target = event.target;
        let value = target.value;
        const name = target.name;

        if (name === "version") {
            this.checkVersionUnique(value)
        }
        this.setState({
            [name]: value
        });
    }

    render() {

        let errorMessage = "";
        if (this.state.errorEditModelInstance) {
            errorMessage = <ErrorDialog open={Boolean(this.state.errorEditModelInstance)} handleErrorDialogClose={this.handleErrorEditDialogClose} error={this.state.errorEditModelInstance.message || this.state.errorEditModelInstance} />
        }
        return (
            <Dialog onClose={this.handleClose}
                aria-labelledby="Form for editing a new model instance"
                open={this.props.open}
                fullWidth={true}
                maxWidth="md">
                <DialogTitle style={{ backgroundColor: Theme.tableHeader }}>Edit an existing model instance</DialogTitle>
                <DialogContent>
                    <LoadingIndicatorModal open={this.state.loading} />
                    <Box my={2}>
                        <form>
                            <Grid container spacing={3}>
                                <ModelInstanceArrayOfForms
                                    name="instances"
                                    value={this.state.instances}
                                    modelScope={this.props.modelScope}
                                    onChange={this.handleFieldChange} />
                            </Grid>
                        </form>
                    </Box>
                    <div>
                        {errorMessage}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleCancel} color="default">
                        Cancel
          </Button>
                    <Button onClick={this.handleSubmit} color="primary">
                        Save changes
          </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

ModelInstanceEditForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired
};
