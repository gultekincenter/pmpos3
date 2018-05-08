import * as React from 'react';
import { connect } from 'react-redux';
import { ApplicationState } from '../../store';
import * as ClientStore from '../../store/Client';
import * as ChatStore from '../../store/Chat';
import { WithStyles } from 'material-ui';
import { RouteComponentProps } from 'react-router';
import decorate, { Style } from './style';
import TopBar from '../TopBar';
import Typography from 'material-ui/Typography/Typography';
import LoginControl from './LoginControl';
import DialogContent from 'material-ui/Dialog/DialogContent';
import DialogActions from 'material-ui/Dialog/DialogActions';
import Button from 'material-ui/Button/Button';
import NetworkDialog from './NetworkDialog';

type DispatchType = typeof ClientStore.actionCreators & typeof ChatStore.actionCreators;

export type PageProps =
    ClientStore.ClientState
    & WithStyles<keyof Style>
    & DispatchType
    & RouteComponentProps<{}>;

interface State {
    networkName: string;
    serverName: string;
    networkDialogShown: boolean;
}

class LoginPage extends React.Component<PageProps, State> {
    constructor(props: PageProps) {
        super(props);
        this.state = {
            networkName: props.networkName,
            serverName: props.serverName,
            networkDialogShown: false
        };
    }

    getDialog() {
        if (this.props.loggedInUser) {
            return (
                <DialogContent>
                    <div>Please Reload to change the Network</div>
                    <DialogActions>
                        <Button onClick={e => {
                            this.setState({ networkDialogShown: false });
                            this.props.SetModalState(false);
                        }}>Close</Button>
                    </DialogActions>
                </DialogContent>
            );
        }
        return (
            <NetworkDialog
                networkName={this.state.networkName}
                serverName={this.state.serverName}
                onClick={(networkName, serverName) => {
                    this.setState({
                        networkName: networkName,
                        serverName: serverName,
                        networkDialogShown: false
                    });
                    this.props.SetModalState(false);
                }} />
        );
    }

    public render() {
        let { loggedInUser } = this.props;
        return (
            <div className={this.props.classes.root}>
                <TopBar
                    title={`Login (${this.state.networkName}${loggedInUser ? '/' : ''}${loggedInUser})`}
                    secondaryCommands={[
                        {
                            icon: 'home',
                            onClick: () => {
                                this.setState({ networkDialogShown: true });
                                this.props.SetModalComponent(this.getDialog());
                            }
                        }
                    ]}
                />
                <div className={this.props.classes.content}>
                    <Typography variant="headline">Welcome to PM-POS</Typography>

                    <LoginControl
                        captureKeys={!this.state.networkDialogShown}
                        onPinEntered={pin => {
                            this.props.SetLoggedInUser(pin);
                            this.props.SetTerminalId(
                                this.props.terminalId,
                                this.state.networkName,
                                this.state.serverName);
                            this.props.connectProtocol(
                                this.props.terminalId,
                                this.state.networkName,
                                this.state.serverName,
                                pin
                            );
                            if (pin && pin !== '' && this.props.location.pathname === '/login') {
                                this.props.history.push('/');
                            }
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default decorate(connect(
    (state: ApplicationState) => state.client,
    ClientStore.actionCreators
)(LoginPage));