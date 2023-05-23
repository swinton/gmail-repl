#!/usr/bin/env node --experimental-repl-await
require('dotenv').config();

const fs = require('fs').promises;
const process = require('process');
const repl = require('repl');
const path = require('path');
const homedir = require('os').homedir();
const { type } = require('os');

const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

const _ = require('lodash');

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

async function getProfile(gmail) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users/getProfile
  const resp = await gmail.users.getProfile({ userId: 'me'})
  return resp.data
}

async function listMessages(gmail, q, params = {}) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
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

async function getMessage(gmail, id, params = {}) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get
  const resp = await gmail.users.messages.get({ userId: 'me', id, ...params })
  return resp.data
}

async function listThreads(gmail, q, params = {}) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users.threads/list
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

async function getThread(gmail, id, params = {}) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users.threads/get
  const resp = await gmail.users.threads.get({ userId: 'me', id, ...params })
  return resp.data
}

async function batchDeleteMessages(gmail, q) {
  // https://developers.google.com/gmail/api/reference/rest/v1/users.messages/batchDelete
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

// Context initializer
const initializeContext = async (context, gmail) => {
  context.gmail = gmail;
  context.profile = _.partial(getProfile, gmail);
  context.messages = _.partial(listMessages, gmail);
  context.message = _.partial(getMessage, gmail);
  context.threads = _.partial(listThreads, gmail);
  context.thread = _.partial(getThread, gmail);
  context.unread = _.partial(listThreads, gmail, 'is:unread');
  context.bulkDeleteThreads = _.partial(batchDeleteMessages, gmail);
};

(async () => {
  const auth = await authorize();
  const gmail = google.gmail({version: 'v1', auth});
  const profile = await getProfile(gmail);

  // Start a repl
  const r = repl.start(`📧 ${ profile.emailAddress } ❯ `);

  // Initialize
  await initializeContext(r.context, gmail);

  // Listen for the reset event
  r.on('reset', initializeContext);

  // Initialize a history log file
  r.setupHistory(path.join(homedir, '.node_repl_history'), () => {});
})();
