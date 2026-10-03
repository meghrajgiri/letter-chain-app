/**
 * Connects the daily-puzzle previews to your Telegram.
 *
 *   npm run telegram:setup
 *
 * 1. Asks for your bot token (hidden as you type; from @BotFather).
 * 2. Asks you to send /start to the bot, then finds your chat id.
 * 3. Stores both as Supabase function secrets (linked project) and sends a
 *    test message. The token never leaves your machine except to Telegram and
 *    Supabase.
 */
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Print the prompt, then swallow the echoed characters.
      const output = rl as unknown as { _writeToOutput: (s: string) => void };
      output._writeToOutput = (s: string) => {
        if (s.includes(question)) process.stdout.write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

async function telegram(token: string, method: string, body?: object): Promise<any> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description ?? response.status}`);
  return data.result;
}

async function main() {
  console.log('Letter Chain · Telegram previews\n');
  console.log('If you have no bot yet: open Telegram, message @BotFather, send /newbot and follow the steps.');
  const token = await ask('Paste the bot token (hidden): ', true);
  if (!/^\d+:[\w-]{30,}$/.test(token)) throw new Error('That does not look like a bot token (expected 123456:ABC…).');

  const bot = await telegram(token, 'getMe');
  console.log(`\nBot found: @${bot.username}`);
  console.log(`Now open https://t.me/${bot.username} in Telegram and tap Start (or send /start).`);
  await ask('Press Enter once you have done that… ');

  const updates: any[] = await telegram(token, 'getUpdates');
  const chat = [...updates].reverse().map((u) => u.message?.chat ?? u.my_chat_member?.chat).find((c) => c?.type === 'private');
  if (!chat) throw new Error(`No message found. Send /start to @${bot.username} and run this again.`);
  console.log(`Found your chat (${chat.first_name ?? chat.username ?? chat.id}).`);

  console.log('Saving to Supabase function secrets…');
  execFileSync('npx', ['-y', 'supabase@latest', 'secrets', 'set', `TELEGRAM_BOT_TOKEN=${token}`, `TELEGRAM_CHAT_ID=${chat.id}`], { stdio: ['ignore', 'ignore', 'inherit'] });
  // Previews used to go to ntfy; stop that if it was set.
  try {
    execFileSync('npx', ['-y', 'supabase@latest', 'secrets', 'unset', 'PREVIEW_NTFY_TOPIC'], { stdio: 'ignore' });
  } catch {
    // Not set: nothing to remove.
  }

  await telegram(token, 'sendMessage', {
    chat_id: chat.id,
    text: '✅ Letter Chain is connected. Each day around 5:45 PM Nepal time you’ll get tomorrow’s daily puzzle here, with a button to swap it.',
  });
  console.log('Done! Check Telegram for a test message.');
}

main().catch((error) => {
  console.error(`\n${error.message ?? error}`);
  process.exit(1);
});
