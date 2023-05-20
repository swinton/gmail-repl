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
await profile()
```

### List messages
> [`users.messages.list`](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list)

- See: [Search operators you can use with Gmail](https://support.google.com/mail/answer/7190?hl=en)

```javascript
// List all messages
await messages()

// List all from <email>
await messages('from:me@example.com')

// List unread from <email> sent after <date>
await messages('from:me@example.com is:unread after:2023/05/19')
```

### Read a message
> [`users.messages.get`](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get)

```javascript
await message('1883a5111e8ef47c')
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
