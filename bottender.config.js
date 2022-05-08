module.exports = {
  session: {
    driver: 'memory',
    stores: {
      memory: { maxSize: 500 },
    },
  },
  initialState: {},
  channels: {
    telegram: {
      enabled: true,
      path: '/webhooks/telegram',
      accessToken: process.env.TELEGRAM_ACCESS_TOKEN,
    },
  },
};
