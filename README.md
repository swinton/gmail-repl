# 🔁 `gmail-repl`

> A REPL for GMail

## Usage
```shell
./repl.js
```

## Examples

### List labels

```javascript
let { data } = await gmail.users.labels.list({ userId: 'me' })
data.labels
```

### Delete all email labeled `X`

```javascript
// TODO
```
