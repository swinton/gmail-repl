#!/usr/bin/env node --experimental-repl-await
require('dotenv').config();

const fs = require('fs').promises;
const process = require('process');
const repl = require('repl');
const path = require('path');
const homedir = require('os').homedir();

const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const { type } = require('os');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://mail.google.com/'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

function getProfile(gmail) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users/getProfile
  return async function(params) {
    const resp = await gmail.users.getProfile({ userId: 'me', ...params})
    return resp.data
  }
}

function listMessages(gmail) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
  return async function(q, params = {}) {
    let pageToken = ''
    const messages = []
    while (typeof pageToken !== 'undefined') {
      const { data } = await gmail.users.messages.list({ userId: 'me', maxResults: 500, pageToken, q, ...params })
      pageToken = data.nextPageToken

      if (typeof data.messages !== 'undefined' && data.messages.length > 0) {
        messages.push(...data.messages)
      }
   }
   return messages
  }
}

function getMessage(gmail) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get
  return async function(id, params = {}) {
    const resp = await gmail.users.messages.get({ userId: 'me', id, ...params })
    return resp.data
  }
}

function listThreads(gmail) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users.threads/list
  return async function(q, params = {}) {
    let pageToken = ''
    const threads = []
    while (typeof pageToken !== 'undefined') {
      const { data } = await gmail.users.threads.list({ userId: 'me', maxResults: 500, pageToken, q, ...params })
      pageToken = data.nextPageToken

      if (typeof data.threads !== 'undefined' && data.threads.length > 0) {
        threads.push(...data.threads)
      }
   }
   return threads
  }
}

function batchDeleteMessages(gmail) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users.messages/batchDelete
  return async function(q) {
    let pageToken = ''
    while (typeof pageToken !== 'undefined') {
      // Get messages
      const { data } = await gmail.users.messages.list({ userId: 'me', q, maxResults: 500, pageToken })
      pageToken = data.nextPageToken

      if (typeof data.messages !== 'undefined' && data.messages.length > 0) {
        // Batch delete all of them
        await gmail.users.messages.batchDelete({ userId: 'me', ids: data.messages.map(msg => msg.id) })
      }
    }
  }
}

function bulkDeleteThreads(gmail) {
  return async function(q) {
    let pageToken = ''
    while (typeof pageToken !== 'undefined') {
      const { data } = await gmail.users.threads.list({ userId: 'me', q, maxResults: 500, pageToken })
      pageToken = data.nextPageToken
      while (data.threads.length) {
        await Promise.all(
          data.threads.splice(0, 10).map(
            thread => {
              return gmail.users.threads.delete( { userId: 'me', id: thread.id } )
            }
          )
        )
      }
    }
  }
}

// Context initializer
const initializeContext = async (context, gmail) => {
  context.gmail = gmail;
  context.profile = getProfile(gmail);
  context.messages = listMessages(gmail);
  context.threads = listThreads(gmail);
  context.message = getMessage(gmail);
  context.bulkDeleteThreads = bulkDeleteThreads(gmail);
  context.batchDeleteMessages = batchDeleteMessages(gmail);
};

(async () => {
  const auth = await authorize();
  const gmail = google.gmail({version: 'v1', auth});
  const profile = await (getProfile(gmail))()

  // Start a repl
  const r = repl.start(`📧 ${ profile.emailAddress } ❯ `);

  // Initialize
  await initializeContext(r.context, gmail);

  // Listen for the reset event
  r.on('reset', initializeContext);

  // Initialize a history log file
  r.setupHistory(path.join(homedir, '.node_repl_history'), () => {});
})();
