# 🔁 `gmail-repl`

> A REPL for GMail

## Usage
```shell
./repl.js
```

## Examples

### Get profile
> [`users.getProfile`](https://developers.google.com/gmail/api/reference/rest/v1/users/getProfile)

```javascript
let data
{ data } = await gmail.users.getProfile({ userId: 'me' })
```

### List messages
> [`users.messages.list`](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list)

- See: [Search operators you can use with Gmail](https://support.google.com/mail/answer/7190?hl=en)

```javascript
let data
{ data } = await gmail.users.messages.list({ userId: 'me' })
{ data } = await gmail.users.messages.list({ userId: 'me', q: 'from:stevewinton@gmail.com' })
{ data } = await gmail.users.messages.list({ userId: 'me', q: 'from:stevewinton@gmail.com is:unread after:2023/05/19' })
```

### Read a message
> [`users.messages.get`](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get)

```javascript
let data
{ data } = await gmail.users.messages.get({ userId: 'me', id: '1883a5111e8ef47c' })
```

### List labels
> [`users.labels.list`](https://developers.google.com/gmail/api/reference/rest/v1/users.labels/list)

```javascript
let data
{ data } = await gmail.users.labels.list({ userId: 'me' })
data.labels
```

### List threads
> [`users.threads.list`](https://developers.google.com/gmail/api/reference/rest/v1/users.threads/list)

```javascript
let data
{ data } = await gmail.users.threads.list({ userId: 'me' })
{ data } = await gmail.users.threads.list({ userId: 'me', q: 'category:promotions -is:important -is:starred', maxResults: 500 })
```

### Batch delete
> [`users.messages.batchDelete`](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/batchDelete)

```javascript
let data
{ data } = await gmail.users.messages.batchDelete({ userId: 'me', ids: ['1883a5111e8ef47c'] })
```

### Batch delete 500 unstarred, unimportant threads in the promotions category
```javascript
let data
{ data } = await gmail.users.threads.list({ userId: 'me', q: 'category:promotions -is:important -is:starred', maxResults: 500 })
{ data } = await gmail.users.messages.batchDelete({ userId: 'me', ids: data.threads.map(thread => thread.id) })
```
