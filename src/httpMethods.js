const allArgs = (...args) => ({
    placeholders: args.length >= 2 ? args[0] : {},
    body: args.length >= 2 ? args[1] : args[0],
    options: args.length == 3 ? args[2] : {}
});

/**
 * GET HTTP Method
 * 
 * @param {Object} placeholders - The request placeholders and query strings
 * @param {Object} options - Optional options for this request
 */
export const get = (placeholders = {}, options = {}) => {
    return { placeholders, options };
};

/**
 * POST HTTP Method
 * 
 * @param {*} args (body), (placeholders, body), (placeholders, body, options)
 */
export const post = (...args) => {
    const { placeholders, body, options } = allArgs(args);

    return {
        placeholders,
        options: {
            method: 'POST',
            body: body && JSON.stringify(body),
            ...options
        }
    };
};

/**
 * PATCH HTTP Method
 * 
 * @param {*} args (body), (placeholders, body), (placeholders, body, options)
 */
export const patch = (...args) => {
    const { placeholders, body, options } = allArgs(args);

    return {
        placeholders,
        options: {
            method: 'PATCH',
            body: body && JSON.stringify(body),
            ...options,
        }
    };
};

/**
 * PUT HTTP Method
 * 
 * @param {*} args (body), (placeholders, body), (placeholders, body, options)
 */
export const put = (...args) => {
    const { placeholders, body, options } = allArgs(args);

    return {
        placeholders,
        options: {
            method: 'PUT',
            mode: 'cors',
            body: body && JSON.stringify(body),
            ...options,
        }
    };
};

/**
 * DELETE HTTP Method
 * 
 * @param {Object} placeholders - The request placeholders and query strings
 * @param {Object} options - Optional options for this request
 */
export const destroy = (placeholders = {}, options = {}) => {
    return { placeholders, options: { method: 'DELETE', ...options } };
};
