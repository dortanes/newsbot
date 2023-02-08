import config from "./config";
import { initializeApp, cert } from "firebase-admin/app";
initializeApp({
  credential: cert(config.credentialsPath),
});

import cron from "node-cron";
import Queue from "promise-queue";
import dayjs from "dayjs";
import { add } from "typesaurus";
import RSS from "./rss";
import TG from "./tg";
import { Source } from "./typings/entities/sources.entity";
import { Setting } from "./typings/entities/settings.entity";
import { NewsItem } from "./typings/entities/news.entity";
import collections from "./collections";
import { useColsCache } from "./colsCache";
import cleanText from "./utils/cleanText.util";

const cols = collections();
const colsCache = {
  news: useColsCache<NewsItem>(cols.news),
  settings: useColsCache<Setting>(cols.settings),
  sources: useColsCache<Source>(cols.sources),
};
const rss = new RSS();
const tg = new TG(colsCache);
const queue = new Queue(1, Infinity);

console.info("app :: started");

const executeQueue = async (source: Source, user: Setting, item: NewsItem) => {
  try {
    await tg.publishItem(item, source, user);
  } catch (_) {
    console.error(_);
  }
  await new Promise((r) => setTimeout(r, 300));
};

cron.schedule("* * * * *", async () => {
  console.info(
    "executing a task",
    colsCache.sources().length,
    colsCache.settings().length,
    colsCache.news().length
  );
  const sources = colsCache.sources();
  console.info("finded %s sources", sources.length);

  for (const source of sources) {
    console.info("parse %s", source.url);
    // Read RSS feed from url
    const src = await rss.parse(source.url);
    const { item: items }: { item: NewsItem[] } = src;

    console.info("retreived %s items", items.length);

    const users = colsCache
      .settings()
      .filter((user) => user.sources.includes(source.guid));

    console.info("finded %s users", users.length);

    items
      .filter(
        (item) =>
          item.guid &&
          !colsCache.news().find((i) => i.guid === item.guid) &&
          dayjs().diff(dayjs(item.pubDate), "day") <= 1
      )
      .map(async (item: NewsItem) => {
        const itemData: NewsItem = {
          content_encoded: "", // item["content:encoded"]
          dc_creator: item["dc:creator"] ?? "",
          description: cleanText(item.description) ?? "",
          enclosure: item.enclosure ?? "",
          guid: item.guid ?? "",
          link: item.link ?? "",
          media_content: item["media:content"] ?? "",
          pubDate: item.pubDate ?? "",
          source: source.guid,
          title: item.title ?? "",
        };

        // Push news item to database
        await add(cols.news, itemData);

        users.map((u) =>
          queue.add(async () => await executeQueue(source, u, itemData))
        );
      });
  }

  console.log("running a task every minute");
});
