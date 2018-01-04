import {
    Commit, CommitRecord, CardData, CardDataRecord,
} from './models';
import { Map as IMap, List } from 'immutable';
import { ActionRecord } from '../../models/Action';
import { Card, CardRecord, CardTagRecord } from '../../models/Card';

export const makeDeepCardData = (cardData: CardData): CardDataRecord => {
    return new CardDataRecord({
        card: makeDeepCard(cardData.card),
        commits: List<CommitRecord>(cardData.commits.map(
            commit => makeDeepCommit(commit as Commit))
        )
    });
};

export const makeDeepCommit = (commit: Commit): CommitRecord => {
    return new CommitRecord({
        id: commit.id,
        time: commit.time,
        cardId: commit.cardId,
        terminalId: commit.terminalId,
        user: commit.user,
        state: makeDeepCard(commit.state),
        actions: List<ActionRecord>(commit.actions.map(action => new ActionRecord(action)))
    });
};

export const makeDeepCard = (card: Card): CardRecord => {
    return new CardRecord({
        id: card.id,
        time: card.time,
        tags: IMap<string, CardTagRecord>(card.tags),
        cards: List<CardRecord>(card.cards && card.cards.map(c => makeDeepCard(c)))
    });
};