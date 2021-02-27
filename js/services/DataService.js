const BASE_URL = 'http://127.0.0.1:8000'
const TOKEN_KEY = 'token'

export default {

    getAds: async function(query=null) {
        const currentUser = await this.getUser()
        let url = `${BASE_URL}/api/ads?_expand=user&_sort=id&_order=desc`
        if (query) {
            url += `q=${query}`
        }
        const response = await fetch(url)
        if (response.ok) {
            const data = await response.json()
            return data.map(ad => {
                return {
                    id: ad.id,
                    name: ad.name.replace(/(<([^>]+)>)/gi, ""),
                    price: ad.price,
                    sale: ad.sale,
                    date: ad.createdAt || ad.updatedAt,
                    author: ad.user.username || 'Unknown',
                    image: ad.image || null,
                    canBeDeleted: currentUser ? currentUser.userId === ad.userId: false
                }
            })
        } else {
            throw new Error(`HTTP error ${response.status}`)
        }
    },

    post: async function(url, postData, json=true) {
        return await this.request('POST', url, postData, json)
    },

    delete: async function(url) {
        return await this.request('DELETE', url, {})
    },

    put: async function(url, putData, json=true) {
        return await this.request('PUT', url, putData, json)
    },

    request: async function(method, url, postData, json=true) {
        const config = {
            method: method,
            headers: {},
            body: null
        }
        if (json) {
            config.headers['Content-Type'] = 'application/json'
            config.body = JSON.stringify(postData)
        } else {
            config.body = postData
        }

        const token = await this.getToken()
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        const response = await fetch(url, config)
        const data = await response.json()

        if (response.ok) {
            return data
        } else {
            throw new Error(data.message || JSON.stringify(data))
        }
    },

    registerUser: async function(user) {
        const url = `${BASE_URL}/auth/register`
        return await this.post(url, user)
    },

    login: async function(user) {
        const url = `${BASE_URL}/auth/login`
        return await this.post(url, user)
    },

    saveToken: async function(token) {
        localStorage.setItem(TOKEN_KEY, token)
    },

    getToken: async function() {
        return localStorage.getItem(TOKEN_KEY)
    },

    isUserLogged: async function() {
        const token = await this.getToken()
        return token !== null
    },

    saveAd: async function(ad) {
        const url = `${BASE_URL}/api/ads`
        if (ad.image) {
            const imageURL = await this.uploadImage(ad.image)
            ad.image = imageURL
        }
        return await this.post(url, ad)
    },
    
    uploadImage: async function(image) {
        const form = new FormData();
        form.append('file', image);
        const url = `${BASE_URL}/upload`;
        const response = await this.post(url, form, false);
        return response.path || null;
    },

    getUser: async function() {
        try {
            const token = await this.getToken()
            const tokenParts = token.split('.')
            if (tokenParts.length !== 3) {
                return null
            }
            const payload = tokenParts[1]
            const jsonStr = atob(payload)
            const { userId, username } = JSON.parse(jsonStr)
            return { userId, username }
        } catch(error) {
            return null;
        }

    },

    deleteAd: async function(ad) {
        const url = `${BASE_URL}/api/ads/${ad.id}`
        return await this.delete(url)
    } 
}