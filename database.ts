import { Collection, MongoClient } from "mongodb";
import { NewsItem } from "./typings/entities/news.entity.js";
import { Setting } from "./typings/entities/settings.entity.js";
import { Source } from "./typings/entities/sources.entity.js";

export type DB = {
  news: Collection<NewsItem>;
  settings: Collection<Setting>;
  sources: Collection<Source>;
};

export default async function initMongo(mongoURL: string, mongoDB: string) {
  const client = new MongoClient(mongoURL);
  await client.connect();

  const db = client.db(mongoDB);

  const cols: DB = {
    news: db.collection<NewsItem>("news"),
    settings: db.collection<Setting>("settings"),
    sources: db.collection<Source>("sources"),
  };

  return cols;
}
