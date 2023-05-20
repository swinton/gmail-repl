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

### Batch delete
> [`users.messages.batchDelete`](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/batchDelete)

- See: [Search operators you can use with Gmail](https://support.google.com/mail/answer/7190?hl=en)

#### Batch delete unimportant promotional messages

```javascript
await batchDeleteMessages('category:promotions -is:important -is:starred')
```

#### Batch delete messages from before 2021

```javascript
await batchDeleteMessages('before:2021/01/01')
```
