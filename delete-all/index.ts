import { Query } from "node-appwrite";
import useDatabase from "../database";
import { NewsItem, Setting, Source } from "../typings/entities";

const cols = {
  news: useDatabase<NewsItem>("news"),
  sources: useDatabase<Source>("sources"),
  settings: useDatabase<Setting>("settings"),
};

(async () => {
  let list: any = { documents: [], count: 1 };
  while (list.count !== 0) {
    list = await cols.news.list([Query.limit(100)]);
    console.info("Deleting", list.documents.length, "items");
    await Promise.all(
      list.documents.map(async (item) => await cols.news.delete(item.$id))
    );
    list.count = list.documents.length;
  }

  console.info("Done");
})();
