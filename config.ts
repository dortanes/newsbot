import dotenv from "dotenv";
dotenv.config();

export default {
  token: String(process.env.TELEGRAM_TOKEN),
  credentialsPath: process.env.CREDENTIALS_PATH ?? "./credentials.json",
  removeStrings: [
    // Strings to remove from description
    "ДАННОЕ СООБЩЕНИЕ (МАТЕРИАЛ) СОЗДАНО И (ИЛИ) РАСПРОСТРАНЕНО ИНОСТРАННЫМ СРЕДСТВОМ МАССОВОЙ ИНФОРМАЦИИ, ВЫПОЛНЯЮЩИМ ФУНКЦИИ ИНОСТРАННОГО АГЕНТА, И (ИЛИ) РОССИЙСКИМ ЮРИДИЧЕСКИМ ЛИЦОМ, ВЫПОЛНЯЮЩИМ ФУНКЦИИ ИНОСТРАННОГО АГЕНТА.Спасите «Медузу»!https://support.meduza.io",
  ],
};
