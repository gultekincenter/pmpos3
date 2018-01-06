import * as React from 'react';
import { connect } from 'react-redux';
import * as CardStore from '../../store/Cards';
import { RouteComponentProps } from 'react-router';
import { WithStyles, List, ListItem } from 'material-ui';
import decorate, { Style } from './style';
import { ApplicationState } from '../../store/index';
import { Map as IMap } from 'immutable';
import TopBar from '../TopBar';
import { CardRecord } from '../../models/Card';
import Divider from 'material-ui/Divider/Divider';
import ListItemText from 'material-ui/List/ListItemText';

type PageProps =
    { cards: IMap<string, CardRecord>, card: CardRecord }
    & WithStyles<keyof Style>
    & typeof CardStore.actionCreators
    & RouteComponentProps<{ id?: string }>;

class CardsPage extends React.Component<PageProps, {}> {
    createTestCards() {
        for (let index = 0; index < 100; index++) {
            this.props.addCard();
            for (let index1 = 0; index1 < 50; index1++) {
                this.props.addPendingAction(undefined, 'SET_CARD_TAG', {
                    name: 'Tag' + index1, value: 'Value' + index1
                });
            }
            // this.props.commitCard();
        }
    }

    getSecondaryCommands(parentCard: CardRecord | undefined) {
        let result = [
            {
                icon: 'add', onClick: () => {
                    this.props.addCard(parentCard);
                    this.props.history.push('/card');
                }
            }
        ];

        if (parentCard) {
            result.unshift({
                icon: 'edit', onClick: () => {
                    this.props.history.push('/card/' + parentCard.id);
                }
            });
        }

        return result;
    }

    getMenuCommand(parentCard?: CardRecord) {
        if (parentCard) {
            return { icon: 'close', onClick: () => { this.props.history.goBack(); } };
        }
        return undefined;
    }

    renderCards(cards: CardRecord[], parentCard?: CardRecord) {
        return cards.map(card => {
            return card && (
                <div key={card.id}>
                    <ListItem
                        button
                        onClick={(e) => {
                            if (card.tags.has('Ref')) {
                                this.props.history.push('/cards/' + card.id);
                            } else {
                                let cardId = card.id;
                                if (parentCard) {
                                    cardId = `${parentCard.id}/${card.id}`;
                                }
                                this.props.history.push('/card/' + cardId);
                            }
                            e.preventDefault();
                        }}
                    >
                        <ListItemText primary={card.display} secondary={card.id} />
                    </ListItem>
                    <Divider />
                </div>
            );
        });
    }

    getTitle(parentCard?: CardRecord) {
        let suffix = '';
        if (parentCard) {
            suffix = ` (${parentCard.display})`;
        }
        return 'Cards' + suffix;
    }

    public render() {
        let cards = this.props.cards;
        let parentCard: CardRecord | undefined;
        if (this.props.match.params.id) {
            parentCard = this.props.cards.get(this.props.match.params.id);
            if (parentCard) {
                cards = parentCard.cards;
            }
        }

        return (
            <div className={this.props.classes.root}>
                <TopBar
                    title={this.getTitle(parentCard)}
                    menuCommand={this.getMenuCommand(parentCard)}
                    secondaryCommands={this.getSecondaryCommands(parentCard)}
                />

                <div className={this.props.classes.content}>
                    <List>
                        {this.renderCards(cards.valueSeq().toArray(), parentCard)}
                    </List>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: ApplicationState) => ({
    cards: state.cards.cards,
    card: state.cards.currentCard
});

export default decorate(connect(
    mapStateToProps,
    CardStore.actionCreators
)(CardsPage));