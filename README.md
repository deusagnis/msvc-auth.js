# Client side of laravel microservice authentication

## About
This package identifies user and inject authentication credentials in requests of [MsvcApi](https://github.com/mggflow/msvc-api.js) package.

## Usage
To install:

``
npm i @mggflow/msvc-auth
``

Example implementation to MsvcApi:

```
// initiate MsvcApi with apiSettins = {....}
api[apiSettins.name] = new MsvcApi(apiSettins.api, apiSettins.name)
api[apiSettins.name].post()

api[apiSettins.name].preparingCallbacks.push(MsvcAuth.prepareApi.bind(MsvcAuth))
```