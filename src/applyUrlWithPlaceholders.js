import queryString from 'query-string';

/**
 * Build a URL with the given placeholders
 * 
 * @param {string} url
 * @param {string} placeholders
 */
const applyUrlWithPlaceholders = (url, placeholders) => {
    const query = {};

    // Replace placeholders in the URL with the given values
    const completeUrl = Object.keys(placeholders).reduce((acc, key) => {
        const token = `:${key}`;

        // The URL contains a URL placeholder for the given key
        if(acc.indexOf(token) !== -1) {
            return acc.replace(token, placeholders[key])
        }

        // Else, we place the key value into the query string
        if(placeholders[key]) {
            query[key] = placeholders[key];
        }

        return acc;
    }, url);

    if(Object.keys(query).length > 0) {
        return `${completeUrl}?${queryString.stringify(query)}`;
    }

    return completeUrl;
};

export default applyUrlWithPlaceholders;
