
type RegisterBlockActionAction = {
    type: 'REGISTER_BLOCK_ACTION',
    blockId: string
    payload: any
};

type ConnectProtocolAction = {
    type: 'CONNECT_PROTOCOL'
    terminalId: string
    user: string
    payload: Promise<any>
};

type ConnectProtocolRequestAction = {
    type: 'CONNECT_PROTOCOL_REQUEST'
};

type ConnectProtocolSuccessAction = {
    type: 'CONNECT_PROTOCOL_SUCCESS'
    payload: any
};

type ConnectProtocolFailAction = {
    type: 'CONNECT_PROTOCOL_FAIL'
};

type AddMessageAction = {
    type: 'ADD_MESSAGE'
    id: string
    user: string
    message: string
    date: number
};

export type KnownActions = RegisterBlockActionAction | AddMessageAction
    | ConnectProtocolAction | ConnectProtocolRequestAction | ConnectProtocolSuccessAction | ConnectProtocolFailAction;
