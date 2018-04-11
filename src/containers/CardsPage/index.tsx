import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as CardStore from '../../store/Cards';
import * as shortid from 'shortid';
import { reorder } from '../../lib/helpers';
import { RouteComponentProps } from 'react-router';
import { CellMeasurerCache } from 'react-virtualized';
import { WithStyles, Paper, Snackbar, Button, IconButton, Icon } from 'material-ui';
import decorate, { Style } from './style';
import { ApplicationState } from '../../store/index';
import { Map as IMap, List as IList } from 'immutable';
import TopBar from '../TopBar';
import { CardRecord } from '../../models/Card';
import { CardTypeRecord } from '../../models/CardType';
import TextField from 'material-ui/TextField/TextField';
import * as h from './helpers';
import VirtualCardList from './VirtualCardList';
import DraggableCardList from './DraggableCardList';
import { ActionRecord } from '../../models/Action';

type PageProps =
    {
        cards: IList<CardRecord>,
        card: CardRecord,
        cardTypes: IMap<string, CardTypeRecord>,
        rootCardTypes: string[],
        currentCardType: CardTypeRecord,
        cardListScrollTop: number,
        searchValue: string,
        showAllCards: boolean
    }
    & WithStyles<keyof Style>
    & typeof CardStore.actionCreators
    & RouteComponentProps<{}>;

interface State {
    currentCardType: CardTypeRecord;
    items: any[];
    itemCount: number;
    scrollTop: number;
    searchValueText: string;
    snackbarOpen: boolean;
}

class CardsPage extends React.Component<PageProps, State> {

    private debouncedSearch;
    private debouncedHandleScroll;
    private itemCount = 50;

    public cache = new CellMeasurerCache({
        defaultWidth: 100,
        defaultHeight: 999999,
        fixedWidth: true
    });

    constructor(props: PageProps) {
        super(props);
        let filteredItems = h.getFilteredItems(props.cards, props.searchValue, props.showAllCards);
        this.state = {
            currentCardType: props.currentCardType,
            items: h.getItems(filteredItems, 0, this.itemCount),
            itemCount: filteredItems.count(),
            scrollTop: props.cardListScrollTop,
            searchValueText: props.searchValue,
            snackbarOpen: false
        };
    }

    componentWillMount() {
        this.debouncedHandleScroll = _.debounce(this.handle_scroll, 100);
        this.debouncedSearch = _.debounce(this.updateSearch, 200);
    }

    componentWillReceiveProps(nextProps: PageProps) {
        if (nextProps.currentCardType.name !== this.state.currentCardType.name) {
            this.setState({
                currentCardType: nextProps.currentCardType
            });
            this.cache.clearAll();
        }
        if (this.props.searchValue !== nextProps.searchValue
            || nextProps.currentCardType.name !== this.state.currentCardType.name) {
            this.setState({ scrollTop: 0 });
        }
        let filteredItems = h.getFilteredItems(nextProps.cards, nextProps.searchValue, nextProps.showAllCards);
        this.setState({
            searchValueText: nextProps.searchValue,
            items: h.getItems(filteredItems, 0, this.itemCount),
            itemCount: filteredItems.count(),
        });
    }

    handle_scroll(scrollTop: number) {
        this.setState({ scrollTop });
    }

    saveSortOrder = (list: CardRecord[]) => {
        for (let index = 0; index < list.length; index++) {
            const item = list[index];
            if (item.index !== index) {
                list[index] = item.set('index', index);
                let actionData =
                    new ActionRecord({
                        id: shortid.generate(),
                        cardId: item.id,
                        actionType: 'SET_CARD_INDEX',
                        data: { index }
                    });
                this.props.postCommit(item, IList<ActionRecord>([actionData]));
            }
        }
        return list;
    }

    handleSnackbarClose = (event, reason?) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({ snackbarOpen: false });
    }

    updateSearch() {
        this.props.setSearchValue(this.state.searchValueText);
    }

    private isRowLoaded({ index }: any) {
        return !!this.state.items[index];
    }

    private loadMoreRows({ startIndex, stopIndex }: any) {
        let filteredItems = h.getFilteredItems(this.props.cards, this.props.searchValue, this.props.showAllCards);
        let items = this.state.items.concat(h.getItems(filteredItems, startIndex, stopIndex - startIndex + 1));
        this.setState({ items, itemCount: filteredItems.count() });
    }

    private renderCardList() {
        if (!this.props.searchValue && this.state.itemCount < this.itemCount * 2) {
            let groupedMap = IMap<string, any[]>(_.groupBy(this.state.items, x => x.category));
            return <DraggableCardList
                items={groupedMap}
                onDragEnd={r => this.onDragEnd(r)}
                template={this.state.currentCardType ? this.state.currentCardType.displayFormat : ''}
                onClick={c => {
                    this.props.setCardListScrollTop(this.state.scrollTop);
                    this.props.history.push(
                        process.env.PUBLIC_URL + '/card/' + c.id);
                }}
            />;
        }

        return <VirtualCardList
            rowCount={this.state.itemCount}
            scrollTop={this.state.scrollTop}
            cache={this.cache}
            isRowLoaded={x => this.isRowLoaded(x)}
            loadMoreRows={x => this.loadMoreRows(x)}
            onClick={c => {
                this.props.setCardListScrollTop(this.state.scrollTop);
                this.props.history.push(
                    process.env.PUBLIC_URL + '/card/' + c.id);
            }}
            debouncedHandleScroll={x => this.debouncedHandleScroll(x)}
            items={this.state.items}
            template={this.state.currentCardType ? this.state.currentCardType.displayFormat : ''}
        />;
    }

    public render() {
        return (
            <div className={this.props.classes.root}>
                <TopBar
                    title={this.state.currentCardType ? this.state.currentCardType.name : 'Cards'}
                    secondaryCommands={this.getSecondaryCommands()}
                />
                <TextField
                    className={this.props.classes.search}
                    label="Search"
                    value={this.state.searchValueText}
                    onChange={e => {
                        this.setState({ searchValueText: e.target.value });
                        this.debouncedSearch();
                    }}
                />
                <Paper className={this.props.classes.content}>
                    {this.renderCardList()}
                </Paper>

                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    open={this.state.snackbarOpen}
                    onClose={this.handleSnackbarClose}
                    SnackbarContentProps={{
                        'aria-describedby': 'message-id',
                    }}
                    message={<span id="message-id">Sort Order changed</span>}
                    action={[
                        <Button key="save" color="secondary" size="small"
                            onClick={e => {
                                this.saveSortOrder(this.state.items);
                                this.handleSnackbarClose(e);
                            }}>
                            Save
                        </Button>,
                        <IconButton
                            key="close"
                            aria-label="Close"
                            color="inherit"
                            onClick={this.handleSnackbarClose}
                        >
                            <Icon>close</Icon>
                        </IconButton>,
                    ]}
                />
            </div>
        );
    }

    getSecondaryCommands() {
        let result = [
            {
                icon: 'arrow_drop_down',
                menuItems: this.props.rootCardTypes.map(ct => {
                    return {
                        icon: ct, onClick: () => {
                            let item = this.props.cardTypes.valueSeq().find(c => c.name === ct);
                            if (item) { this.setState({ currentCardType: item }); }
                            this.props.setCurrentCardType(item);
                        }
                    };
                })
            },
            {
                icon: 'developer_mode',
                menuItems: [
                    {
                        icon: 'Show Hidden Cards',
                        onClick: () => {
                            this.props.setShowAllCards(!this.props.showAllCards);
                        }
                    },
                    {
                        icon: 'Create 500 Test Cards',
                        onClick: () => {
                            if (this.props.currentCardType.name === 'Customers') {
                                h.createTestCards(this.props);
                            } else {
                                alert('This function can be used for `Customers`');
                            }
                        }
                    },
                    {
                        icon: 'Delete Cards',
                        onClick: () => {
                            this.props.deleteCards(this.props.currentCardType.id);
                        }
                    }
                ]
            },
            {
                icon: 'add',
                onClick: () => {
                    if (this.props.currentCardType.id) {
                        this.props.addCard(this.props.currentCardType);
                        this.props.history.push(process.env.PUBLIC_URL + '/card');
                    }
                }
            }
        ];
        return result;
    }

    onDragEnd(result: any) {
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        if (result.source.index === result.destination.index) { return; }

        let items = reorder(
            this.state.items,
            result.source.index,
            result.destination.index
        );

        this.setState({
            items,
            snackbarOpen: true
        });
    }
}

const mapStateToProps = (state: ApplicationState) => ({
    cards: state.cards.cards,
    card: state.cards.currentCard,
    cardTypes: state.config.cardTypes,
    rootCardTypes: state.config.rootCardTypes,
    currentCardType: state.cards.currentCardType,
    cardListScrollTop: state.cards.cardListScrollTop,
    searchValue: state.cards.searchValue,
    showAllCards: state.cards.showAllCards
});

export default decorate(connect(
    mapStateToProps,
    CardStore.actionCreators
)(CardsPage));