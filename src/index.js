class MsvcAuth{
    /**
     * Transmit access token in request headers.
     * @type {boolean}
     */
    static tokenInHeaders = false
    /**
     * Header key for access token.
     * @type {string}
     */
    static tokenHeaderKey = 'Auth-Access-Token'

    /**
     * Collection of service api control settings.
     * @type {Object}
     */
    static services = {
        default: {
            user: false,
            prepareParams: true,
            triedToIdentify: 0,
            token: false,
            authApiName: 'auth',
            autoIdentify: true,
        }
    }

    /**
     * Add service for usage api.
     * @param msvcName {string}
     * @param token {string|boolean}
     * @param autoIdentify {boolean}
     * @param prepareParams {boolean}
     * @param user {Object|boolean}
     * @param authApiName {string}
     */
    static addService(
        msvcName = 'default',
        token = false,
        autoIdentify = true,
        prepareParams = true,
        user= false,
        authApiName='auth'
    ){
        this.services[msvcName] = {
            user: user,
            prepareParams: prepareParams,
            triedToIdentify: 0,
            token: token,
            authApiName: authApiName,
            autoIdentify: autoIdentify,
        }
    }

    /**
     * Set token for service.
     * @param token {string|boolean}
     * @param msvcName {string}
     * @param remember {boolean}
     */
    static setToken(token, msvcName='default',remember = true){
        this.services[msvcName]['token'] = token

        if(remember) this.setTokenToLocalStorage(token,msvcName)
    }

    /**
     * Set user object for service.
     * @param user {Object|boolean}
     * @param msvcName {string}
     */
    static setUser(user, msvcName='default'){
        this.services[msvcName]['user'] = user
    }

    /**
     * Get user object for service.
     * @param msvcName
     * @returns {boolean}
     */
    static getUser(msvcName='default'){
        return this.services[msvcName]['user']
    }

    /**
     * Get amount of tries to authenticate user.
     * @param msvcName
     * @returns {number}
     */
    static getIdentifyTries(msvcName='default'){
        return this.services[msvcName]['triedToIdentify']
    }

    /**
     * Send request for identify current user.
     * @param msvcApi
     */
    static async identify(msvcApi){
        const serviceSettings = this.chooseSettings(msvcApi['msvcName'])
        serviceSettings.settings['triedToIdentify']++

        const response = await msvcApi[serviceSettings.settings['authApiName']].getUser().send()

        if(response === false) return false

        this.setUser(response.result,serviceSettings['asName'])

        return response.result
    }

    /**
     * Choose control api settings by service.
     * @param msvcName
     */
    static chooseSettings(msvcName){
        if(typeof this.services[msvcName] === 'object'){
            return {
                settings: this.services[msvcName],
                asName: msvcName
            }
        }else{
            return {
                settings: this.services['default'],
                asName: 'default'
            }
        }
    }

    /**
     * Detect access token.
     * @param serviceSettings
     * @returns {boolean|string}
     */
    static detectSettingsToken(serviceSettings){
        if(serviceSettings.settings['token'] !== false){
            return serviceSettings.settings['token']
        }

        if(serviceSettings.settings['user'] === false){
            return this.getTokenFromLocalStorage(serviceSettings.asName)
        }

        if(typeof serviceSettings.settings['user']['access_token'] === 'string'){
            return serviceSettings.settings['user']['access_token']
        }

        return false
    }

    /**
     * Generate local storage key for access token.
     * @param msvcName
     * @returns {string}
     */
    static genLocalStorageTokenKey(msvcName){
        return msvcName + '_'+'access_token'
    }

    /**
     * Get access token from local storage.
     * @param msvcName
     * @returns {string|boolean}
     */
    static getTokenFromLocalStorage(msvcName){
        const token = localStorage.getItem(this.genLocalStorageTokenKey(msvcName))
        if(token === null) return false

        return token
    }

    /**
     * Set access token to local storage.
     * @param token
     * @param msvcName
     */
    static setTokenToLocalStorage(token,msvcName='default'){
        localStorage.setItem(this.genLocalStorageTokenKey(msvcName),token)
    }

    /**
     * Remove access token from local storage.
     * @param msvcName
     */
    static removeTokenFromLocalStorage(msvcName='default'){
        localStorage.removeItem(this.genLocalStorageTokenKey(msvcName))
    }

    /**
     * Logout for service.
     * @param msvcName {string}
     */
    static logout(msvcName='default'){
        this.forgetToken(msvcName)
        this.forgetUser(msvcName)
    }

    /**
     * Remove user object from service api control settings.
     * @param msvcName
     */
    static forgetUser(msvcName='default'){
        this.services[msvcName].user = false
    }

    /**
     * Remove access token from local storage and service api control settings.
     * @param msvcName
     */
    static forgetToken(msvcName='default'){
        this.removeTokenFromLocalStorage(msvcName)
        this.removeTokenFromServices(msvcName)
    }

    static removeTokenFromServices(msvcName='default'){
        this.services[msvcName].token = false
    }

    /**
     * Prepare MsvcApi object to use authentication.
     * @param msvcApi
     * @returns {Promise<void>}
     */
    static async prepareApi(msvcApi){
        const serviceSettings = this.chooseSettings(msvcApi['msvcName'])

        if(serviceSettings.settings['autoIdentify'] === true && serviceSettings.settings['triedToIdentify'] === 0){
            await this.identify(msvcApi)
        }

        if(serviceSettings.settings['prepareParams'] === false) return

        const token = this.detectSettingsToken(serviceSettings)

        if(token === false) return

        if(this.tokenInHeaders){
            this.setHeaderToken(msvcApi,token)
        }else{
            msvcApi.params = this.prepareParams(msvcApi.params,token)
        }
    }

    /**
     * Set Header with access token to settings of MsvcApi.
     * @param msvcApi
     * @param token
     */
    static setHeaderToken(msvcApi,token){
        msvcApi.fetchSettings.headers[this.tokenHeaderKey] = token
    }

    /**
     * Prepare MsvcApi request params object.
     * @param params {Object|null}
     * @param token {string|boolean}
     * @returns Object
     */
    static prepareParams(params, token){
        if(params === null){
            params = {}
        }
        if(typeof params === 'object' && typeof params['token'] !== 'string'){
            params['token'] = token
        }

        return params
    }
}

export default MsvcAuth