import CardOperation from '../CardOperation';
import { CardRecord } from '../../../models/Card';
import RuleManager from '../../RuleManager';

export default class SetState extends CardOperation {
    constructor() {
        super('SET_STATE', 'Set State');
    }
    canApply(card: CardRecord, data: any): boolean {
        return !card.isClosed;
    }
    readConcurrencyData(card: CardRecord, actionData: any) {
        return undefined;
    }
    reduce(card: CardRecord, data: any): CardRecord {
        if (data.name) { RuleManager.setState(data.name, data.value); }
        return card;
    }
    fixData(data: any) {
        return data;
    }
}