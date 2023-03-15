import dotenv from "dotenv";
dotenv.config();

export default {
  token: String(process.env.TELEGRAM_TOKEN),
  mongoUrl: String(process.env.MONGO_URL),
  mongoDb: String(process.env.MONGO_DB),
  removeStrings: [
    // Strings to remove from description
    "ДАННОЕ СООБЩЕНИЕ (МАТЕРИАЛ) СОЗДАНО И (ИЛИ) РАСПРОСТРАНЕНО ИНОСТРАННЫМ СРЕДСТВОМ МАССОВОЙ ИНФОРМАЦИИ, ВЫПОЛНЯЮЩИМ ФУНКЦИИ ИНОСТРАННОГО АГЕНТА, И (ИЛИ) РОССИЙСКИМ ЮРИДИЧЕСКИМ ЛИЦОМ, ВЫПОЛНЯЮЩИМ ФУНКЦИИ ИНОСТРАННОГО АГЕНТА.Спасите «Медузу»!https://support.meduza.io",
    "The post ",
    " first appeared on Вёрстка.",
    "first appeared on Вёрстка.",
  ],
};

export type ColsKeys = "news" | "sources" | "settings";
