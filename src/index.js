module.exports = async function App(/** @type {import('bottender').TelegramContext} */ context) {
  await context.sendText('Welcome to Bottender');
};
