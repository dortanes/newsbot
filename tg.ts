import TelegramBot from "node-telegram-bot-api";
import { Query } from "node-appwrite";
import config from "./config";
import { Setting, SettingUpdateDto } from "./typings/entities/settings.entity";
import cols from "./collections";
import { NewsItem } from "./typings/entities/news.entity";
import { Source } from "./typings/entities/sources.entity";
export default class TG {
  private bot = new TelegramBot(config.token, { polling: true });
  private db: FirebaseFirestore.Firestore;

  constructor() {
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
    const isProfileExists =
      (await cols.settings.count([Query.equal("chatId", msg.chat.id)])) > 0;

    if (!isProfileExists)
      await cols.settings.create({
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

    const settings = await cols.settings.getOne([
      Query.equal("chatId", msg.chat.id),
    ]);
    if (!settings) return;

    let text: string = "";

    // Main menu
    if (action === "main") return this._sendMainMenu(msg);
    // Sources list
    else if (action === "sources") {
      text =
        "Предоставляю тебе список источников, которые ты можешь включить, либо исключить из списка новостей.";

      const sources = await cols.sources.list();

      let curLine = 0;
      let curCount = 0;
      keyboard.reply_markup.inline_keyboard[curLine] = [];

      sources.documents.forEach((source) => {
        const enabled = settings?.sources?.includes(source.guid);

        if (curCount % 3 === 0) {
          curLine++;
          keyboard.reply_markup.inline_keyboard[curLine] = [];
        }

        keyboard.reply_markup.inline_keyboard[curLine].push({
          text: (enabled ? "✅" : "❌") + " " + source.title,
          callback_data: "src:" + source.guid,
        });

        curCount++;
      });
    } else {
      // Get source
      const source = await cols.sources.getOne([
        Query.equal(
          "guid",
          action?.replace("toggle:", "")?.replace("src:", "")
        ),
      ]);
      if (!source) return;

      // Toggle source
      if (action?.startsWith("toggle:")) {
        // Push or remove source
        settings?.sources?.includes(source.guid)
          ? settings.sources?.splice(settings.sources.indexOf(source.guid), 1)
          : settings.sources?.push(source.guid);

        await cols.settings.update<SettingUpdateDto>(settings.$id, {
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
      (item.link !== "" ? `\n\n[Читать в источнике](${item.link})` : ``) +
      `\n#${source.title
        .toLowerCase()
        .replace(/\s/g, "")
        .replace(/[^a-zA-Zа-яА-Я]/g, "")}`;

    console.info(text);
    await this.bot.sendMessage(Number(user.chatId), text, {
      parse_mode: "Markdown",
    });
  }

  private _cleanText(text: string) {
    return text.length > 500 ? text.slice(0, 500) + "..." : text;
  }
}
