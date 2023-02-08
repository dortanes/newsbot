import data from "./data";
import useDatabase from "../database";
import { NewsItem, Setting, Source } from "../typings/entities";

const cols = {
  news: useDatabase<NewsItem>("news"),
  sources: useDatabase<Source>("sources"),
  settings: useDatabase<Setting>("settings"),
};

(async () => {
  await Promise.all(
    data.map(async (item: any) => {
      console.log(
        await cols.sources.create(
          {
            ...item,
            id: undefined,
          },
          item.id
        )
      );
    })
  );

  console.info("Done");
})();
