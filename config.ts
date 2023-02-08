import dotenv from "dotenv";
dotenv.config();

export default {
  token: String(process.env.TELEGRAM_TOKEN),
  credentialsPath: process.env.CREDENTIALS_PATH ?? "./credentials.json",
  appwriteEndpoint: process.env.APPWRITE_ENDPOINT ?? "http://localhost/v1",
  appwriteProject: process.env.APPWRITE_PROJECT ?? "5df5acd0d48c2",
  appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID ?? "5df5acd0d48c2",
  appwriteKey: process.env.APPWRITE_KEY ?? "",
  appwriteDatabaseColsIds: {
    news: "63e39d0fd1b19acbb6a6",
    sources: "63e39d0a4ad29469a6b1",
    settings: "63e39d0192b7e1a78215",
  },
  removeStrings: [
    // Strings to remove from description
    "ДАННОЕ СООБЩЕНИЕ (МАТЕРИАЛ) СОЗДАНО И (ИЛИ) РАСПРОСТРАНЕНО ИНОСТРАННЫМ СРЕДСТВОМ МАССОВОЙ ИНФОРМАЦИИ, ВЫПОЛНЯЮЩИМ ФУНКЦИИ ИНОСТРАННОГО АГЕНТА, И (ИЛИ) РОССИЙСКИМ ЮРИДИЧЕСКИМ ЛИЦОМ, ВЫПОЛНЯЮЩИМ ФУНКЦИИ ИНОСТРАННОГО АГЕНТА.Спасите «Медузу»!https://support.meduza.io",
    "The post ",
    " first appeared on Вёрстка.",
    "first appeared on Вёрстка.",
  ],
};

export type ColsKeys = "news" | "sources" | "settings";
