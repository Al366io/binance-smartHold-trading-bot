<h1>BTC Trading Bot: A Smart Hold Strategy</h1>

<p>This trading bot is designed to automate the buying and selling of BTC on the BTC/USDT pair on Binance. Unlike aggressive trading bots, this bot focuses on a <strong>Smart Hold Strategy</strong> that aims to minimize risk while optimizing for long-term holding.</p>

<h2>How it Works</h2>

<h3>Smart Hold Strategy: Why It's Different</h3>

<p><strong>This bot is designed for those who are committed to holding BTC in the long term. It operates on the principle that you should never lose money. Here are the possible scenarios:</strong></p>

<ol>
  <li><strong>You Keep Holding BTC:</strong> The bot will not force sell your BTC. If conditions for selling are not met, you continue to hold, which is a good strategy for long-term investors.</li>
  <li><strong>You Make a Profit:</strong> If the bot does sell, it means the BTC price has gone up. Even if the price doesn't go down again, you've sold at a higher price than you bought, resulting in a profit.</li>
</ol>

<h3>Overview:</h3>

<ol>
  <li><strong>Time-Based Trading Window:</strong>
    <ul>
      <li>The bot sets a trading window every 4 hours for 1 minute, during which a sell actions can occur.</li>
      <li>To Re-Buy, which is the most important thing, the bot doesn't wait 4 hours. If the condition to buy is met, it will perform the buy action straight away</li>
    </ul>
  </li>
  <li><strong>Buying Logic:</strong>
    <ul>
      <li>Buys if the current price is 5% below the average sell price.</li>
      <li>Buys the maximum amount of BTC based on the available USDT balance.</li>
      <li>Updates relevant parameters on successful buy.</li>
    </ul>
  </li>
  <li><strong>Selling Logic:</strong>
    <ul>
      <li>Sells if the current price is 5% above the last sell price or the last buy price if it's the first time selling after a buy.</li>
      <li>Sells 12.5% of the total amount of BTC bought last time or the entire available BTC balance if it's less.</li>
    </ul>
  </li>
  <li><strong>WebSocket Connection:</strong>
    <ul>
      <li>Connects to Binance's WebSocket API for real-time price updates.</li>
      <li>Handles reconnections and error scenarios.</li>
    </ul>
  </li>
</ol>

<h2>Initial Setup and Requirements</h2>

<p>To use this trading bot, there are some initial setup steps and requirements you must fulfill:</p>

<ol>
  <li><strong>Binance Account:</strong>
    <p>You need to have an active Binance account. If you don't have one, you can sign up <a href="https://www.binance.com/">here</a>.</p>
  </li>
  <li><strong>Binance API Key:</strong>
    <p>You'll need to generate a Binance API key from your Binance account. This API key should be added to your <code>.env</code> file.</p>
  </li>
  <li><strong>.env File:</strong>
    <p>We've included a <code>.env.copy</code> file in the repository to indicate which environment variables are needed. Rename this file to <code>.env</code> and fill in the required information.</p>
  </li>
  <li><strong>Initial BTC Holding:</strong>
    <p>You need to already have some amount of BTC in your Binance account to start using the bot.</p>
  </li>
  <li><strong>Set Initial BTC Purchase Price:</strong>
    <p>When you start the bot, you'll be prompted to set the price at which you initially bought your BTC. This is crucial for the bot's buying and selling logic.</p>
  </li>
</ol>

<h2>Limitations</h2>

<p>Like any trading bot, this bot is subject to market volatility and may not always make profitable trades. Additionally, the bot is designed to trade only on the BTC/USDT pair on Binance and may not work well on other exchanges or pairs.</p>

<p><strong>Use this bot at your own risk and always do your own research before investing.</strong></p>

<h2>Contributing</h2>

<p>If you would like to contribute to the bot, please feel free to fork the repository and submit a pull request.</p>
