# Redux Chunk

> 📤 A redux library to declaratively interact with any API

Redux Chunk allows you to define your API endpoints across chunks in webpack chunked application. For large APIs, it makes sense to dynamically add paths to your SDK-style endpoints list and it improves the separation of concerns, with each action file defining it's own endpoints and request structure.

There are many API helpers for Redux, we based this library off [redux-bees](https://github.com/cantierecreativo/redux-bees) but we created (read: copied) this library to work with APIs that may not be standardized. i.e. it doesn't use [JSON API](http://jsonapi.org) 100%. If your API does, you should consider using `redux-bees`.

## Install

```bash
npm install redux-chunk --save
```

## Usage

You can use Redux Chunk in your existing Redux app by following these steps:

#### Add the redux-chunk reducer and middleware to your Redux store

```js
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';

import {
  reducer as apiReducer,
  middleware as apiMiddleware,
} from 'redux-chunk';

const reducer = combineReducers({
  // ...your other reducers
  api: apiReducer,
});

const store = createStore(reducer, applyMiddleware(apiMiddleware));
```

#### Create an API helper file

You can define general endpoints in your main bundle or wait to define endpoints in chunked actions. You can configure dynamic headers such as adding the user's access token to `Authorization` when they are logged in.

```js
import API { get, post, patch, destroy } from 'redux-chunk';
import { store } from 'index'; // The result of your createStore

const endpoints = {
    getItems: { method: get, path: '/items' },
    getItem: { method: get, path: '/items/:id' },
    createItem: { method: post, path: '/items' },
    updateItem: { method: patch, path: '/items/:id' },
    deleteItem: { method: destroy, path: '/items/:id' }
};
const options = {
    baseUrl: 'https://api.example.com',
    configureHeaders: headers => ({
        ...headers,
        Authorization: `Bearer ${store.getState().auth.access_token}`
    })
};

const api = new API(endpoints, options);

export default api;
```

#### Resolve/Reject middleware

If you need to execute specific code before or after every request or retry a request if a particular response is returned, you can use the `handleResolve` and `handleReject` options:

```js
const options = {
    baseUrl: 'https://api.example.com',
    handleResolve: (req, res) => {
        // Only return the result, the request is given to you here for checking sent placeholders or headers
        return Promise.resolve({ ...res, extra: 'thing' });
    },
    handleReject: (req, res) => {
        if(res.body.message.indexOf('Access Token Expired') > -1) {
            // Refresh the access token then retry the request using .retry() method
            return req.retry();
        }
        
        return res;
    }
};
```

#### You can then perform API actions like this:

```js
api.getItems()
    .then(res => {
        // {
        //   status: 200,
        //   headers: {...},
        //   body: [
        //     {
        //       name: 'my-item',
        //       price: 100
        //     }
        //   ]
        // }
    })
    .catch(err => {
        // {
        //   status: 500,
        //   headers: {...}
        //   body: {
        //     message: 'Something went wrong.'
        //   }
        // }
    });
```

The arguments you pass to your endpoint depend on the HTTP method and the presence of placeholders in the path declared for the endpoint.

```js
api.getItem({ id: 12 });
// GET https://api.example.com/items/12

api.getItem({ id: 12, custom: 'query' });
// GET https://api.example.com/items/12?custom=query

api.createItem({ name: 'my-item', price: 100 });
// POST https://api.example.com/items

api.updateItem({ id: 12, price: 200 });
// PATCH https://api.example/items/12

api.deleteItem({ id: 12 });
// DELETE https://api.example.com/items/12
```

If you perform multiple concurrent requests to the same endpoint with the same parameters, a single API call will be performed, and every request will be attached to the same promise:

```js
api.getItem({ id: 12 })
    .then(data => console.log(data));

// This won't produce a new API call

api.getPost({ id: 12 })
    .then(data => console.log(data));
```

#### Use it in your Redux actions

You can dispatch the API request promises as Redux actions which are stored in the state of your application under an `api` key.

```js
const getItem = id => {
    return api.getItem({ id });
};
```

With `redux-thunk`:

```js
const getItem = id => {
    return dispatch => {
        // Asynchronous things here
        dispatch(api.getItem({ id }))
    };
};
```

It's also possible to mutate the result:

```js
const getItem = id => {
    const placeholders = { id };

    const req = api.getItem(placeholders);
    req.then(res => {
        // Do anything to the result
        res.body.extras = { extra: 'thing' };

        // Return it to the redux-chunk middleware
        return res;
    });
    
    // Requires these to be added back to the Promise sequence
    req.actionName = 'getItem';
    req.params = { options: {}, placeholders };

    return req;
};
```

#### Accessing the results in Redux state

The results of your API requests are cached in the `api` section of your Redux state. It should be considered private, and accessed via the `query` state selector.

```js
store.getState();
// {
//   api: {
//     getItem: {
//       '{}': {
//         isLoading: false,
//         error: null,
//         headers: {...},
//         status: 200,
//         result: [...]
//       },
//       '{"id":12}': {
//         isLoading: false,
//         error: null,
//         headers: {...},
//         status: 200,
//         result: {...}
//       }
//     }
//   }
// }
```

The `query` function takes the following arguments:

- query(state, apiCall)
- query(state, apiCall, placeholders)

If you don't include placeholders, the query will return all requests that have been made to that endpoint.

Examples:

```js
query(state, api.getItem, { id: 12 })
// {
//   hasStarted: true,
//   isLoading: false,
//   hasFailed: false,
//   result: { id: 12, name: 'my-item', price: 100 }
//   headers: {...},
//   status: 200,
//   error: null,
// }

query(state, api.getItems)
// {
//   hasStarted: true,
//   isLoading: false,
//   hasFailed: false,
//   result: [
//     { payload: { id: 12, name: 'my-item', price: 100 }, params: { id: 12 } }
//   ],
//   headers: [...],
//   status: 200,
//   error: null
// }
```

#### Accessing the results in your React Components

To make it easier to integrate data fetching in React Components, you can use the `query` state selector inside a `connect` HOC from the `react-redux` lib.

```js
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { query } from 'redux-chunk';

import api from 'helpers/api';

const App = ({ item }) => (
    <div className="app">
        {item.result && !item.isLoading ? (
            <p>{item.name}</p>
        ) : item.hasFailed ? (
            <p>{item.error}</p>
        ) : (
            <p>Loading...</p>
        )}
    </div>
);

export default connect(
    state => ({ item: query(state, api.getItems, { id: 12 }) })
)(App);
```

#### Adding more endpoints

In action files that are loaded in by chunked modules, you can add new endpoints to your built API with the `addEndpoints` function.

```js
import { get } from 'redux-chunk';

import api from 'helpers/api';

api.addEndpoints({
    getPosts: { method: get, path: '/posts' }
});

const getPosts = () => {
    return api.getPosts();
};
```
