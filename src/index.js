import * as methods from './httpMethods';
import applyUrlWithPlaceholders from './applyUrlWithPlaceholders';
import request from './request';

const defaultConfigure = options => options;
const defaultHandleResolve = (req, res) => Promise.resolve(res);
const defaultHandleReject = (req, err) => Promise.reject(err);

export { get, post, patch, put, destroy } from './httpMethods';
export { default as middleware } from './middleware';
export { default as query } from './query';
export { default as reducer } from './reducer';

export default class API {
    constructor(endpoints, config) {
        this.config = {
            ...config,
            configureOptions: config.configureOptions || defaultConfigure,
            configureHeaders: config.configureHeaders || defaultConfigure,
            handleResolve: config.handleResolve || defaultHandleResolve,
            handleReject: config.handleReject || defaultHandleReject
        };

        this.pendingPromises = {};

        this.addEndpoints(endpoints);
    }

    createEndpoint(name, endpoint) {
        const { path, required, method: methodConfig } = endpoint;

        // Create list of required placeholders
        const requiredPlaceholders = required || [];
        const placeholderRegexp = /:([^\/$]+)/g;
        let match;
        while(match = placeholderRegexp.exec(path)) {
            requiredPlaceholders.push(match[1]);
        }

        // Create direct function on the API class
        this[name] = (...args) => {
            // Run the args through the method config
            args = methodConfig(...args);

            const placeholders = args.placeholders || {};
            const options = args.options || {};

            const augmentedOptions = {
                ...options,
                headers: this.config.configureHeaders({
                    'Content-Type': 'appication/json',
                    Accept: 'application/json',
                    ...options.headers
                })
            };

            const missingPlaceholders = requiredPlaceholders.filter(name => !placeholders[name]);
            if(missingPlaceholders.length) {
                console.error(`The ${name} API call cannot be performed. The following params were not specified: ${missingPlaceholders.join(', ')}`);

                const neverEndingPromise = new Promise(() => 1);
                neverEndingPromise.noop = true;

                return neverEndingPromise;
            }

            const promiseId = JSON.stringify([name, args]);
            if(this.pendingPromises[promiseId]) {
                return this.pendingPromises[promiseId];
            }

            const createRequest = () => {
                const opts = this.config.configureOptions(augmentedOptions);
                const phlds = applyUrlWithPlaceholders(path, placeholders);
                const req = request(this.config.baseUrl, phlds, opts);

                req.placeholders = phlds;
                req.config = opts;
                req.retry = () => createRequest();

                this.pendingPromises[promiseId] = req;

                const promise = req
                    .then(res => this.config.handleResolve(req, res))
                    .then(res => {
                        delete this.pendingPromises[promiseId];
                        return res;
                    })
                    .catch(err => {
                        delete this.pendingPromises[promiseId];
                        return Promise.reject(err);
                    })
                    .catch(err => this.config.handleReject(req, err));

                promise.actionName = name;
                promise.params = args;
                
                return promise;
            };

            return createRequest();
        };
        
        this[name].actionName = name;

        return this;
    }

    addEndpoints(endpoints) {
        Object.keys(endpoints).forEach(name => {
            this.createEndpoint(name, endpoints[name]);
        });
    }
}
