import * as React from 'react';
import { connect } from 'react-redux';
import * as CardStore from '../../store/Cards';
import * as moment from 'moment';
import * as shortid from 'shortid';
import { RouteComponentProps } from 'react-router';
import { WithStyles, Typography, Modal, Menu, MenuItem } from 'material-ui';
import decorate, { Style } from './style';
import { ApplicationState } from '../../store/index';
import TopBar from '../TopBar';
import { List } from 'immutable';
import { ActionRecord } from '../../models/Action';
import { CardRecord, CardTagRecord } from '../../models/Card';
import { cardOperations } from '../../modules/CardOperations';
import CardOperation from '../../modules/CardOperations/CardOperation';
import { CommitRecord } from '../../store/Cards/models';
import Commits from './Commits';
import CardPageContent from './CardPageContent';
import CardBalance from './CardBalance';
import FooterOperations from './FooterOperations';

type PageProps =
    {
        isLoaded: boolean,
        pendingActions: List<ActionRecord>
        card: CardRecord,
        commits: List<CommitRecord>
    }
    & WithStyles<keyof Style>
    & typeof CardStore.actionCreators
    & RouteComponentProps<{ id?: string }>;

interface PageState {
    anchorEl: any,
    operationComponent: any;
    modalOpen: boolean;
    operations: CardOperation[];
    showCommits: boolean;
    selectedCard: CardRecord;
    currentAction: { type: string, data: any, card: CardRecord } | undefined;
}

export class CardPage extends React.Component<PageProps, PageState> {
    constructor(props: PageProps) {
        super(props);
        this.state = {
            anchorEl: undefined,
            operationComponent: undefined,
            modalOpen: false,
            operations: cardOperations.getOperations(),
            showCommits: false,
            selectedCard: props.card,
            currentAction: undefined
        };
    }

    handleModalOpen = () => {
        this.setState({ modalOpen: true });
    }

    handleModalClose = () => {
        this.setState({ modalOpen: false });
    }

    handleMenuClick = event => {
        this.setState({ anchorEl: event.currentTarget });
    }

    handleMenuClose = () => {
        this.setState({ anchorEl: undefined });
    }

    handleCardMutation = (actionType: string, data: any) => {
        this.props.addPendingAction(this.state.selectedCard, actionType, data);
        this.handleModalClose();
    }

    handleOperation(operation: CardOperation, currentData?: any) {
        if (operation.getEditor) {
            this.setState({
                modalOpen: true,
                operationComponent: operation.getEditor
                    && operation.getEditor((at, data) => this.handleCardMutation(at, data), currentData)
            });
        } else {
            this.handleCardMutation(operation.type, {
                id: shortid.generate(), time: new Date().getTime()
            });
        }
    }

    public componentDidMount() {
        if (this.props.match.params.id) {
            this.props.loadCard(this.props.match.params.id);
        }
        if (this.props.isLoaded) {
            this.setState({ selectedCard: this.props.card });
        }
    }

    public render() {
        if (!this.props.isLoaded || !this.props.card) { return <div>Loading</div>; }
        const isMenuOpen = Boolean(this.state.anchorEl);
        return (
            <div className={this.props.classes.root}>
                <TopBar
                    title={`Card (${this.props.card.id})`}
                    menuCommand={{ icon: 'close', onClick: () => { this.props.history.goBack(); } }}
                    secondaryCommands={[
                        {
                            icon: 'folder_open',
                            menuItems: [{
                                icon: 'Display Commits', onClick: () => {
                                    this.setState({ showCommits: true });
                                }
                            }]
                        },
                        {
                            icon: 'check', onClick: () => {
                                this.props.commitCard();
                                this.props.history.push('/cards');
                            }
                        }
                    ]}
                />
                <div className={this.props.classes.content}>
                    <div>
                        <Typography>{this.props.card.id}</Typography>
                        <Typography>{moment(this.props.card.time).format('LLL')}</Typography>
                    </div>
                    <CardPageContent
                        card={this.props.card}
                        selectedCard={this.state.selectedCard}
                        onClick={(card, target) => this.setState({ selectedCard: card, anchorEl: target })}
                        handleTagClick={(card: CardRecord, v: CardTagRecord) =>
                            this.setState({ currentAction: { type: 'SET_CARD_TAG', data: v, card } })}
                    />
                    {this.state.showCommits &&
                        <Commits
                            pendingActions={this.props.pendingActions}
                            commits={this.props.commits}
                        />
                    }
                </div >
                <div className={this.props.classes.footer}>
                    <FooterOperations
                        operations={this.state.operations}
                        currentAction={this.state.currentAction}
                        handleCardMutation={this.handleCardMutation}
                    />
                    <CardBalance card={this.props.card} />
                </div>
                <Modal
                    aria-labelledby="simple-modal-title"
                    aria-describedby="simple-modal-description"
                    open={this.state.modalOpen}
                    onClose={this.handleModalClose}
                >
                    <div className={this.props.classes.modal}>
                        {this.state.operationComponent}
                    </div>
                </Modal>
                <Menu
                    id="long-menu"
                    anchorEl={this.state.anchorEl}
                    open={isMenuOpen}
                    onClose={this.handleMenuClose}
                    PaperProps={{
                        style: {
                            maxHeight: 48 * 4.5,
                            width: 200,
                        },
                    }}
                >
                    {this.state.operations.map(option => (
                        <MenuItem
                            key={option.type}
                            onClick={e => {
                                this.handleOperation(option);
                                this.handleMenuClose();
                            }}
                        >
                            {option.description}
                        </MenuItem>
                    ))}
                </Menu>
            </div>
        );
    }
}

const mapStateToProps = (state: ApplicationState) => ({
    card: state.cards.currentCard,
    commits: state.cards.currentCommits,
    pendingActions: state.cards.pendingActions,
    isLoaded: state.cards.isLoaded
});

export default decorate(connect(
    mapStateToProps,
    CardStore.actionCreators
)(CardPage));