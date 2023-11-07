const BACKEND_URL = process.env.REACT_APP_API_URL;

export default class FastApiClient {
    async register(user, firstName, lastName) {
        const request = {
            username: user,
            firstName: firstName,
            lastName: lastName,
            deviceName: user
        };
        console.log(JSON.stringify(request))
        const response = await fetch(`${BACKEND_URL}/passwordless/register`, {
            method: 'post',
            body: JSON.stringify(request),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
          const problemDetails = await response.json();
          console.log(problemDetails.detail)
            if (problemDetails && problemDetails.detail) {
                throw new Error(`${problemDetails.detail}`);
            } else {
                throw new Error(`An unknown error prevented us from obtaining a registration token.`);
            }
        }

        return await response.json();
    }

    async signIn(token) {
        return await fetch(`${BACKEND_URL}/passwordless/login?token=${token}`, {
            method: 'post'
        }).then(r => r.json());
    }
}