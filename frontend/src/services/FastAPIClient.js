const BACKEND_URL = process.env.REACT_APP_API_URL;
const X_API_KEY = process.env.REACT_APP_API_KEY;

export default class FastApiClient {
  async register(user, firstName, lastName) {
    const request = {
      email: user,
      firstName: firstName,
      lastName: lastName,
    };

    const response = await fetch(`${BACKEND_URL}/passwordless/register`, {
      method: "post",
      body: JSON.stringify(request),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": X_API_KEY,
      },
    });

    if (!response.ok) {
      const problemDetails = await response.json();

      if (problemDetails && problemDetails.detail) {
        throw new Error(`${problemDetails.detail}`);
      } else {
        throw new Error(
          `An unknown error prevented us from obtaining a registration token.`
        );
      }
    }

    return await response.json();
  }

  async signIn(token) {
    return await fetch(`${BACKEND_URL}/passwordless/login?token=${token}`, {
      method: "post",
      headers: {
        "x-api-key": X_API_KEY,
      },
    }).then((r) => r.json());
  }

  async get(url) {
    try {
      const response = await fetch(`${BACKEND_URL}${url}`, {
        method: "get",
        headers: {
          "x-api-key": X_API_KEY,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        const message = await response.text();
        console.error(message);
        return { error: message };
      }
    } catch (error) {
      const message = `An error occurred while fetching data: ${error}`;
      console.error(message);
      return { error: message };
    }
  }

  async put(url) {
    try {
      const response = await fetch(`${BACKEND_URL}${url}`, {
        method: "put",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": X_API_KEY,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        const message = await response.text();
        console.error(message);
        return { error: message };
      }
    } catch (error) {
      const message = `An error occurred while fetching data: ${error}`;
      console.error(message);
      return { error: message };
    }
  }
  async post(url, body) {
    try {
      const response = await fetch(`${BACKEND_URL}${url}`, {
        method: "post",
        body: JSON.stringify(body),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": X_API_KEY,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        const message = await response.text();
        console.error(message);
        return { error: message };
      }
    } catch (error) {
      const message = `An error occurred while fetching data: ${error}`;
      console.error(message);
      return { error: message };
    }
  }
  async delete(url) {
    try {
      const response = await fetch(`${BACKEND_URL}${url}`, {
        method: "delete",
        headers: {
          "x-api-key": X_API_KEY,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        const message = await response.text();
        console.error(message);
        return { error: message };
      }
    } catch (error) {
      const message = `An error occurred while fetching data: ${error}`;
      console.error(message);
      return { error: message };
    }
  }
}
