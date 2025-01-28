# Smart 🦊 Solana Trading Bot 🎯

## Features

⚡️ High Speed and Accuracy\
⚡️ Optimized\
⚡️ Typescript\
⚡️ Raydium and Jupiter API\
⚡️ Helius RPC Provider

To view the bot: **[click here](https://web.telegram.org/k/#@Smart_SOL_Trading_Bot)**

---

## How To Use the bot 🔧

#### Start the bot

```
/start
```

To receive the alarms from bot, you should set the bot on.

#### Set configuration to control the bot actions

```
/setting
```

You can see the wallet address and private key by clicking `💳 Wallet (0)` button.

You can see the button `🆕 New Migration Alarm Off 🔴`

Click that button to set the bot on, then it will change to `🆕 New Migration Alarm On 🟢`

You can set the auto trade on to buy token automatically. `⚙ Auto Trade On 🟢`

You can set a time range when the bot will turn on and turn off using `⏳ Start At: 0:00` and `⏳ Stop At: 24:00` buttons.

To use the time range setting, you should turn on the `⏰ Time Check On 🟢`

You can set the parameters to buy and sell the token such as amount, priority fee and slippageBps.

#### To see the help

```
/help
```

---

## Getting Started 🚀

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites 📋

You'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [NPM](http://npmjs.com)) installed on your computer.

```
node@22.3.0 or higher
npm@10.8.1 or higher
git@2.45.1 or higher
```

Also, you can use [Yarn](https://yarnpkg.com/) instead of NPM ☝️

```
yarn@v1.22.10 or higher
```

---

### Creating a bot 🤖

<!-- [<img src="img/botfather.png" width="400"/>](img/botfather.png) -->

1. Search for the BotFather.

2. Send the message `/start` to the BotFather.

3. Send `/newbot`.

4. Give the bot a name e.g `testing_xyz`.

5. Give the bot a username `testing_xyz_bot`.

6. Now capture the HTTP API token it's very important!

<!-- [<img src="img/bot.png" width="400"/>](img/bot.png) -->

7. Now search for the bot name `testing_xyz` and send a message to the bot contact.

From your command line, first clone EdgeStrike:

```bash
# Clone the repository
$ git clone https://github.com/jakeenan14/EdgeStrike

# Move into the repository
$ cd EdgeStrike

# Remove the current origin repository
$ git remote remove origin
```

After that, you should make .env file and set the environment variables.

```bash
# copy .env.sample file to .env file
touch .env
```

After that command, you shoud add BOT_TOKEN, HTTP_URL, WSS_URL.

After that, you can install the dependencies either using NPM or Yarn.

Using NPM: Simply run the below commands.

```bash
# Install dependencies
$ npm install

# Start the development server
$ npm run dev
```

Using Yarn: Be aware of that you'll need to delete the `package-lock.json` file before executing the below commands.

```bash
# Install dependencies
$ yarn

# Start the development server
$ yarn start
```

**NOTE**:
If your run into issues installing the dependencies with NPM, use this below command:

```bash
# Install dependencies with all permissions
$ sudo npm install --unsafe-perm=true --allow-root
```

Once your server has started, go to @EdgeStrike bot to see how the bot acts.
