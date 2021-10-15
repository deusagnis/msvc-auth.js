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

    static setToken(token, msvcName='default'){
        this.services[msvcName]['token'] = token
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
        serviceSettings['triedToIdentify']++

        const response = await msvcApi[serviceSettings['authApiName']].getUser().send()

        if(response === false) return false

        this.setUser(response.result,msvcApi['msvcName'])

        return response.result
    }

    static chooseSettings(msvcName){
        if(typeof this.services[msvcName] === 'object'){
            return this.services[msvcName]
        }else{
            return this.services['default']
        }
    }

    static detectSettingsToken(serviceSettings){
        if(serviceSettings['token'] !== false){
            return serviceSettings['token']
        }

        if(serviceSettings['user'] === false){
            return false
        }

        if(typeof serviceSettings['user']['access_token'] === 'string'){
            return serviceSettings['user']['access_token']
        }

        return false
    }

    static async prepareApi(msvcApi){
        const serviceSettings = this.chooseSettings(msvcApi['msvcName'])

        if(serviceSettings['autoIdentify'] === true && serviceSettings['triedToIdentify'] === 0){
            await this.identify(msvcApi)
        }

        if(serviceSettings['prepareParams'] === false) return

        const token = this.detectSettingsToken(serviceSettings)

        if(token === false) return

        msvcApi.params = this.prepareParams(msvcApi.params)
    }

    static prepareParams(params, token){
        if(typeof params === 'object' && typeof params['token'] !== 'string'){
            params['token'] = token
        }

        return params
    }
}

export default MsvcAuth