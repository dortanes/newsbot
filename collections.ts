import { collection } from "typesaurus";
import { Source, NewsItem, Setting } from "./typings/entities";

export default () => ({
  sources: collection<Source>("sources"),
  settings: collection<Setting>("settings"),
  news: collection<NewsItem>("news"),
});
