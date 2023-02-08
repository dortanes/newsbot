import { collection } from "typesaurus";
import useDatabase from "./database";
import { Source, NewsItem, Setting } from "./typings/entities";

export default {
  news: useDatabase<NewsItem>("news"),
  sources: useDatabase<Source>("sources"),
  settings: useDatabase<Setting>("settings"),
};
