const query = (state, apiCall, args) => {
    if(typeof apiCall == 'undefined') {
        throw new Error(`The API endpoint does not exist.`);
    }

    const { actionName } = apiCall;
    state = { ...state };

    let res = null;
    if(state.api[actionName]) {
        if(typeof args != 'undefined') {
            // Select a specific parameter call in the actionName endpoint
            res = state.api[actionName][JSON.stringify(args)];
        } else {
            // Return all requests for the endpoint
            res = state.api[actionName];

            return {
                isLoading: res && !!Object.keys(res).find(r => res[r].isLoading),
                hasStarted: res != null,
                hasFailed: res && !!Object.keys(res).find(r => !!res[r].error),
                result: res && !res.isLoading
                    ? Object.keys(res).map(r => ({
                        params: JSON.parse(r),
                        payload: res[r].result
                    }))
                    : null,
                headers: res && !res.isLoading ? Object.keys(res).map(r => res[r].headers) : {},
                error: res && !res.isLoading ? Object.keys(res).map(r => res[r].error) : null,
                status: res && !res.isLoading ? Object.keys(res)[0].status : null
            };
        }
    }

    return {
        isLoading: false,
        hasStarted: res != null,
        hasFailed: res && !!res.error,
        result: null,
        headers: {},
        error: null,
        ...res
    };
};

export default query;
