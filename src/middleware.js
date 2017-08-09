/**
 * Middleware to handle Promises in Redux actions
 */
const middleware = () => next => promise => {
    if(!promise) {
        return;
    }

    if(!promise.then) {
        return next(promise);
    }

    if(promise.noop) {
        return;
    }

    // Mark the action as a redux-chunk 'api' action
    const meta = {
        api: true,
        name: promise.actionName,
        params: promise.params,
    };

    next({
        type: `@@redux-chunk/${promise.actionName}/request`,
        meta: { ...meta, type: 'request' },
    });

    return promise
        .then(result => {
            next({
                type: `@@redux-chunk/${promise.actionName}/response`,
                payload: result,
                meta: { ...meta, type: 'response' },
            });

            return Promise.resolve(result);
        })
        .catch(result => {
            next({
                type: `@@redux-chunk/${promise.actionName}/error`,
                payload: result,
                meta: { ...meta, type: 'error' },
            });

            return Promise.reject(result);
        });
};

export default middleware;
