import TelegramBot from "node-telegram-bot-api";
import { getFirestore } from "firebase-admin/firestore";
import config from "./config";
import { Setting } from "./typings/entities/settings.entity";

import collections from "./collections";
import { NewsItem } from "./typings/entities/news.entity";
import { Source } from "./typings/entities/sources.entity";
import { add, update } from "typesaurus";
const cols = collections();

type ColsCache = {
  news: () => NewsItem[];
  settings: () => Setting[];
  sources: () => Source[];
};

export default class TG {
  private bot = new TelegramBot(config.token, { polling: true });
  private db: FirebaseFirestore.Firestore;
  private colsCache: ColsCache;

  constructor(colsCache: ColsCache) {
    this.db = getFirestore();
    this.colsCache = colsCache;

    this.bot.onText(/\/start/, (msg) => this.onStartMessage(msg));
    this.bot.on("callback_query", (cq) => this.onCallbackQuery(cq));
  }

  private _sendMainMenu(msg: TelegramBot.Message | undefined) {
    this.bot.sendMessage(
      Number(msg?.chat.id),
      "*Привет! Меня зовут Newierra.* Я постоянно слежу за последними новостями от независимых СМИ, и могу поделиться ими с тобой.",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📰 Источники",
                callback_data: "sources",
              },
            ],
          ],
        },
      }
    );
  }

  private async onStartMessage(msg: TelegramBot.Message) {
    const settings = this.colsCache
      .settings()
      .filter((setting) => setting.chatId === msg.chat.id).length;

    if (settings === 0)
      await add(cols.settings, {
        userId: Number(msg?.from?.id),
        chatId: Number(msg?.chat.id),
        sources: [],
        isDirect: Number(msg?.chat.id) > 0,
      });

    this._sendMainMenu(msg);
  }

  private async onCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const keyboard: any = {
      reply_markup: {
        inline_keyboard: [],
      },
    };

    const settings = this.colsCache
      .settings()
      .find((setting) => setting.chatId === msg.chat.id);
    if (!settings) return;

    let text: string = "";

    // Main menu
    if (action === "main") return this._sendMainMenu(msg);
    // Sources list
    else if (action === "sources") {
      text =
        "Предоставляю тебе список источников, которые ты можешь включить, либо исключить из списка новостей.";

      const sources = this.colsCache.sources();

      sources.forEach((source) => {
        const enabled = settings?.sources?.includes(source.guid);

        keyboard.reply_markup.inline_keyboard.push([
          {
            text: (enabled ? "✅" : "❌") + " " + source.title,
            callback_data: "src:" + source.guid,
          },
        ]);
      });
    } else {
      // Get source
      const source = this.colsCache
        .sources()
        .find(
          (source) =>
            source.guid === action?.replace("toggle:", "")?.replace("src:", "")
        );
      if (!source) return;

      // Toggle source
      if (action?.startsWith("toggle:")) {
        // Push or remove source
        settings?.sources?.includes(source.guid)
          ? settings.sources?.splice(settings.sources.indexOf(source.guid), 1)
          : settings.sources?.push(source.guid);

        await update(cols.settings, settings.id, {
          sources: settings.sources,
        });
      }

      text =
        `*Название:* ${source.title}\n` +
        `*Описание:* ${source.description}\n` +
        `*Актуальная тема:* ${source.actualTopic}\n` +
        `*Язык:* ${source.language.toUpperCase()}\n` +
        `\n${source.links.join("\n")}`;

      // Check if source is enabled
      const enabled = settings?.sources?.includes(source.guid);
      // Build keyboard
      keyboard.reply_markup.inline_keyboard.push([
        {
          text: enabled ? "✅ Подключено" : "❌ Отключено",
          callback_data: "toggle:" + source.guid,
        },
      ]);
    }

    // Build keyboard
    keyboard.reply_markup.inline_keyboard.push([
      {
        text: "🔙 Назад",
        callback_data: action === "sources" ? "main" : "sources",
      },
    ]);

    this.bot.editMessageText(text, {
      chat_id: msg?.chat.id,
      message_id: msg?.message_id,
      ...keyboard,
      parse_mode: "Markdown",
    });
  }

  public async publishItem(item: NewsItem, source: Source, user: Setting) {
    const text =
      `${source.title}: *${item.title}*` +
      (item.description !== ""
        ? `\n\n${this._cleanText(item.description)}`
        : ``) +
      (item.link !== "" ? `\n\n[Источник](${item.link})` : ``) +
      `\n#${source.title.toLowerCase().replace(/\s/g, "")}`;

    console.info(text);
    await this.bot.sendMessage(Number(user.chatId), text, {
      parse_mode: "Markdown",
    });
  }

  private _cleanText(text: string) {
    return text.length > 500 ? text.slice(0, 500) + "..." : text;
  }
}
