# 👀 status bot

Monitor your website by one command. Powered by Telegram bot.

## Demo

https://t.me/status_demo_bot

## Deployment

1. clone this repository

```
$ git clone git@github.com:maxam2017/status-bot
```

2. install dependencies

```
$ yarn install
```

3. put your bot token into `.env`

```
$ TELEGRAM_ACCESS_TOKEN=...
```

4. run this app and set your bot's webhook url

```
$ npx bottender telegram webhook set \
--webhook [your app domain]/webhooks/telegram
```

## License

Distributed under the [MIT License](https://choosealicense.com/licenses/mit/). See `license` for more information.
