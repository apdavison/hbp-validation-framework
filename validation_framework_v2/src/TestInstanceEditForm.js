import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import axios from 'axios';
import PropTypes from 'prop-types';
import React from 'react';
import ErrorDialog from './ErrorDialog';
import { baseUrl } from "./globals";
import { replaceEmptyStringsWithNull } from "./utils";
import TestInstanceArrayOfForms from './TestInstanceArrayOfForms';
import ContextMain from './ContextMain';
import Theme from './theme';
import LoadingIndicatorModal from './LoadingIndicatorModal';

let versionAxios = null;

export default class TestInstanceEditForm extends React.Component {
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
        // console.log(authContext);
        // console.log(authContext.token);

        this.state = {
            instances: [{
                id: "",
                version: "",
                repository: "",
                path: "",
                description: "",
                parameters: "",
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
        this.setState({ 'errorEditTestInstance': null });
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

        let url = baseUrl + "/tests/" + this.props.testID + "/instances/?version=" + newVersion;
        let config = {
            cancelToken: versionAxios.token,
            headers: {
                'Authorization': 'Bearer ' + this.state.auth.token,
            }
        };
        await axios.get(url, config)
            .then(res => {
                console.log(res.data);
                if (res.data.length === 0) {
                    isUnique = true;
                }
            })
            .catch(err => {
                if (axios.isCancel(err)) {
                    console.log('Error: ', err.message);
                } else {
                    console.log(err);
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
        // rule 1: test instance version cannot be empty
        let error = null;
        if (payload.version === "") {
            error = "Test instance 'version' cannot be empty!"
        }
        else {
            // rule 2: if version has been changed, check if new version is unique
            if (payload.version !== this.props.instance.version) {
                let isUnique = await this.checkVersionUnique(payload.version);
                if (!isUnique) {
                    error = "Test instance 'version' has to be unique within a test!"
                }
            }
        }
        if (error) {
            console.log(error);
            this.setState({
                errorEditTestInstance: error,
            });
            return false;
        } else {
            return true;
        }
    }

    async handleSubmit() {
        this.setState({ loading: true }, async () => {
            let payload = this.createPayload();
            console.log(payload);
            if (await this.checkRequirements(payload)) {
                let url = baseUrl + "/tests/" + this.props.testID + "/instances/" + payload.id;
                let config = {
                    cancelToken: this.signal.token,
                    headers: {
                        'Authorization': 'Bearer ' + this.state.auth.token,
                        'Content-type': 'application/json'
                    }
                };

                axios.put(url, payload, config)
                    .then(res => {
                        console.log(res);
                        this.props.onClose(res.data);
                    })
                    .catch(err => {
                        if (axios.isCancel(err)) {
                            console.log('Error: ', err.message);
                        } else {
                            console.log(err);
                            this.setState({
                                errorEditTestInstance: err.response,
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
        console.log(name + " => " + value);
        if (name === "version") {
            this.checkVersionUnique(value)
        }
        this.setState({
            [name]: value
        });
    }

    render() {
        console.log(this.state.instances)
        let errorMessage = "";
        if (this.state.errorEditTestInstance) {
            errorMessage = <ErrorDialog open={Boolean(this.state.errorEditTestInstance)} handleErrorDialogClose={this.handleErrorEditDialogClose} error={this.state.errorEditTestInstance.message || this.state.errorEditTestInstance} />
        }
        return (
            <Dialog onClose={this.handleClose}
                aria-labelledby="Form for editing a new test instance"
                open={this.props.open}
                fullWidth={true}
                maxWidth="md">
                <DialogTitle style={{ backgroundColor: Theme.tableHeader }}>Edit an existing test instance</DialogTitle>
                <DialogContent>
                    <LoadingIndicatorModal open={this.state.loading} />
                    <Box my={2}>
                        <form>
                            <Grid container spacing={3}>
                                <TestInstanceArrayOfForms
                                    name="instances"
                                    value={this.state.instances}
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
                        Edit Test Instance
          </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

TestInstanceEditForm.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired
};
