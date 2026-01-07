/**
 * Puter.js Mock
 *
 * Mock the Puter.js SDK for testing
 */

class PuterAIMock {
  constructor() {
    this.responses = {
      chat: [],
      complete: [],
    };
  }

  setMockResponse(type, response) {
    this.responses[type].push(response);
  }

  async chat(messages, options = {}) {
    const mockResponse = this.responses.chat.shift() || {
      role: 'assistant',
      content: 'Mock AI response',
    };

    return {
      message: mockResponse,
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    };
  }

  async complete(prompt, options = {}) {
    const mockResponse = this.responses.complete.shift() || 'Mock completion';

    return {
      text: mockResponse,
      usage: {
        prompt_tokens: 5,
        completion_tokens: 10,
        total_tokens: 15,
      },
    };
  }
}

class PuterStorageMock {
  constructor() {
    this.data = new Map();
  }

  async put(key, value) {
    this.data.set(key, value);
    return { success: true };
  }

  async get(key) {
    return this.data.get(key);
  }

  async delete(key) {
    this.data.delete(key);
    return { success: true };
  }

  async list(prefix = '') {
    const keys = Array.from(this.data.keys()).filter((key) =>
      key.startsWith(prefix)
    );
    return keys;
  }

  clear() {
    this.data.clear();
  }
}

class PuterAuthMock {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
  }

  async signIn(email, password) {
    this.user = {
      id: 'mock-user-id',
      email,
      username: email.split('@')[0],
    };
    this.isAuthenticated = true;
    return { success: true, user: this.user };
  }

  async signOut() {
    this.user = null;
    this.isAuthenticated = false;
    return { success: true };
  }

  async getUser() {
    return this.user;
  }
}

class PuterKVMock {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return this.data.get(key);
  }

  async set(key, value) {
    this.data.set(key, value);
    return true;
  }

  async delete(key) {
    this.data.delete(key);
    return true;
  }

  async list(prefix = '') {
    const keys = Array.from(this.data.keys()).filter((key) =>
      key.startsWith(prefix)
    );
    return keys.map((key) => ({ key, value: this.data.get(key) }));
  }

  clear() {
    this.data.clear();
  }
}

export const puterMock = {
  ai: new PuterAIMock(),
  storage: new PuterStorageMock(),
  auth: new PuterAuthMock(),
  kv: new PuterKVMock(),
};

export default puterMock;
