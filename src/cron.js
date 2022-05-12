require('dotenv').config();
const cron = require('node-cron');
const fetch = require('node-fetch');
const { getDB } = require('./db');

// every 5 minutes
cron.schedule('*/5 * * * *', function () {
  const db = getDB();

  db.serialize(() => {
    db.each(
      'select * from record',
      async (_, row) => {
        const { chatId, url } = row;
        const res = await fetch(url);
        if (!res.ok) {
          fetch(
            `https://api.telegram.org/bot${process.env.TELEGRAM_ACCESS_TOKEN}/sendMessage?${new URLSearchParams({
              chat_id: chatId,
              text: `Oops, something went wrong in ${url}`,
	      disable_web_page_preview: true,
            })}`
          );
        }
      },
      () => {
        db.close();
      }
    );
  });
});
