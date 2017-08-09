import immutable from 'object-path-immutable';

export default function reducer(state = {}, action) {
    if(!action.meta || !action.meta.api) {
        return state;
    }

    let newState = state;
    const { type, name, params } = action.meta;
    let json = '{}';
    if(params) {
        json = JSON.stringify(params.placeholders);
    }
    const param = param => [name, json, param];

    switch(type) {
        case 'request':
            newState = immutable.set(newState, param('isLoading'), true);
            newState = immutable.set(newState, param('error'), null);

            return newState;
        case 'response':
            const { body, headers, status } = action.payload;
            newState = immutable.set(newState, param('isLoading'), false);
            newState = immutable.set(newState, param('headers'), headers);
            newState = immutable.set(newState, param('status'), status);

            if(body) {
                newState = immutable.set(newState, param('result'), body);
            }

            return newState;
        case 'error':
            newState = immutable.set(newState, param('isLoading'), false);
            newState = immutable.set(newState, param('hasFailed'), true);
            newState = immutable.set(newState, param('result'), null);

            if(action.payload instanceof Error) {
                const message = action.payload.message;
                newState = immutable.set(newState, param('error'), message);
                newState = immutable.del(newState, param('headers'));
                newState = immutable.del(newState, param('status'));
            } else {
                const { error, headers, status } = action.payload;
                newState = immutable.set(newState, param('error'), body);
                newState = immutable.set(newState, param('headers'), headers);
                newState = immutable.set(newState, param('status'), status);
            }

            return newState;
        default:
            return state;
    }
}
