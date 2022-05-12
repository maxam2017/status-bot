const fetch = require('node-fetch');
const { getDB } = require('./db');
const { safeCreateHttpsURL } = require('./utils');

const Step = {
  Init: 0,
  WaitForURL: 1,
  Failed: 2,
  Confirmation: 3,
};

const RetryOption = {
  Refetch: 'Poke again',
  TryAnother: 'Use another URL',
};

module.exports = async function App(context) {
  /**
   * @type {import('bottender').TelegramEvent}
   */
  const event = context.event;

  const {
    entities = [],
    text = '',
    chat: { id: chatId },
  } = event.message || {};

  // state management
  function goto(step) {
    context.setState({
      ...context.state,
      [chatId]: { ...context.state[chatId], step },
    });
  }

  function setState(obj) {
    context.setState({
      ...context.state,
      [chatId]: { ...context.state[chatId], ...obj },
    });
  }

  function getState() {
    return { step: Step.Init, ...context.state[chatId] };
  }

  const firstEntry = entities[0];
  const isBotCommand = firstEntry && firstEntry.type === 'bot_command';

  if (isBotCommand) {
    const { offset, length } = firstEntry;
    const cmd = text.substring(offset, offset + length);
    switch (cmd) {
      case '/start': {
        return context.sendMessage('Want to monitor your website? Try /watch command now');
      }
      case '/watch': {
        await context.sendMessage(
          'Please enter the URL you want to monitor\nwhich URL should start with <code>https://</code>',
          { parse_mode: 'HTML' }
        );
        goto(Step.WaitForURL);
        return;
      }
      case '/unsubscribe': {
        const db = getDB();
        db.serialize(async () => {
          db.all('select * from record where chatId = ?', [chatId], async (err, rows) => {
            if (err) {
              console.error(err);
              await context.sendMessage('Oops, something went wrong. Please try again.');
            } else {
              if (rows.length === 0) {
                await context.sendMessage("There's not any subscription.");
                await context.sendMessage('Want to monitor your website? Try /watch command now');
              } else {
                await context.sendMessage('Click the URL you want to unsubscribe', {
                  reply_markup: JSON.stringify({
                    keyboard: rows.map((row) => [{ text: row.url }]),
                    resize_keyboard: true,
                    one_time_keyboard: true,
                  }),
                });
              }
            }
            db.close();
          });
        });
        goto(Step.Confirmation);
        return;
      }
    }
  }

  async function poke(url) {
    await context.sendMessage('Poking URL... (Please wait for seconds)');
    const res = await fetch(url);
    if (res.ok) {
      const db = getDB();
      db.serialize(() => {
        db.run(
          'create TABLE if not exists record (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,chatId TEXT, url TEXT, duration NUMBER)'
        );
        const query = 'INSERT INTO record(chatId,url,duration) VALUES (?,?,?)';
        db.run(query, [chatId, url.toString(), 5]);
      });
      db.close();
      await context.sendMessage(
        `Subscribe success 🎉 We would Poke it every 5 minutes.\nIf you want to unsubscribe, please use /unsubscribe command.`
      );
    } else {
      setState({ url });
      await context.sendMessage(
        `[${res.status}]: ${res.statusText}\nOops, something went wrong, would you like to...`,
        {
          reply_markup: JSON.stringify({
            keyboard: [[RetryOption.Refetch], [RetryOption.TryAnother]],
            resize_keyboard: true,
            one_time_keyboard: true,
          }),
        }
      );
      goto(Step.Failed);
    }
  }

  const state = getState();
  switch (state.step) {
    case Step.WaitForURL: {
      const url = safeCreateHttpsURL(text.trim());
      if (!url) {
        await context.sendMessage(`Entered URL is invalid. Please try again.`);
      } else {
        await poke(url);
      }
      return;
    }
    case Step.Failed: {
      const option = (() => {
        const t = text.toLowerCase();
        if (t.includes(RetryOption.Refetch.toLowerCase())) return RetryOption.Refetch;
        if (t.includes(RetryOption.TryAnother.toLowerCase())) return RetryOption.TryAnother;
      })();
      switch (option) {
        case RetryOption.Refetch:
          await poke(state.url);
          break;
        case RetryOption.TryAnother:
          await context.sendMessage(
            'Please enter the URL you want to monitor\nwhich URL should start with <code>https://</code>',
            { parse_mode: 'HTML' }
          );
          goto(Step.WaitForURL);
          break;
        default:
          await context.sendMessage('Would you like to...', {
            reply_markup: JSON.stringify({
              keyboard: [[RetryOption.Refetch], [RetryOption.TryAnother]],
              resize_keyboard: true,
              one_time_keyboard: true,
            }),
          });
      }
      return;
    }
    case Step.Confirmation: {
      const db = getDB();
      db.serialize(async () => {
        db.run(`delete from record where chatId = ? and url = ?`, [chatId, text], async (err) => {
          if (err) {
            console.error(err);
            await context.sendMessage('Oops, something went wrong. Please try again.');
          } else {
            await context.sendMessage(`Unsubscribe ${text} successfully.`);
          }
        });
      });
      db.close();
      goto(Step.Init);
      return;
    }
  }

  return context.sendMessage('👀');
};
