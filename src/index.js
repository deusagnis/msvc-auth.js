class MsvcAuth{
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

    static setToken(token, msvcName='default',remember = true){
        this.services[msvcName]['token'] = token

        if(remember) this.setTokenToLocalStorage(token,msvcName)
    }

    static setUser(user, msvcName='default'){
        this.services[msvcName]['user'] = user
    }

    static getUser(msvcName='default'){
        return this.services[msvcName]['user']
    }

    static getIdentifyTries(msvcName='default'){
        return this.services[msvcName]['triedToIdentify']
    }

    static async identify(msvcApi){
        const serviceSettings = this.chooseSettings(msvcApi['msvcName'])
        serviceSettings.settings['triedToIdentify']++

        const response = await msvcApi[serviceSettings.settings['authApiName']].getUser().send()

        if(response === false) return false

        this.setUser(response.result,serviceSettings['asName'])

        return response.result
    }

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

    static genLocalStorageTokenKey(msvcName){
        return msvcName + '_'+'access_token'
    }

    static getTokenFromLocalStorage(msvcName){
        const token = localStorage.getItem(this.genLocalStorageTokenKey(msvcName))
        if(token === null) return false

        return token
    }

    static setTokenToLocalStorage(token,msvcName='default'){
        localStorage.setItem(this.genLocalStorageTokenKey(msvcName),token)
    }

    static removeTokenFromLocalStorage(msvcName='default'){
        localStorage.removeItem(this.genLocalStorageTokenKey(msvcName))
    }

    static logout(msvcName='default'){
        this.forgetToken(msvcName)
        this.forgetUser(msvcName)
    }

    static forgetUser(msvcName='default'){
        this.services[msvcName].user = false
    }

    static forgetToken(msvcName='default'){
        this.removeTokenFromLocalStorage(msvcName)
        this.removeTokenFromServices(msvcName)
    }

    static removeTokenFromServices(msvcName='default'){
        this.services[msvcName].token = false
    }

    static async prepareApi(msvcApi){
        const serviceSettings = this.chooseSettings(msvcApi['msvcName'])

        if(serviceSettings.settings['autoIdentify'] === true && serviceSettings.settings['triedToIdentify'] === 0){
            await this.identify(msvcApi)
        }

        if(serviceSettings.settings['prepareParams'] === false) return

        const token = this.detectSettingsToken(serviceSettings)

        if(token === false) return

        msvcApi.params = this.prepareParams(msvcApi.params,token)
    }

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