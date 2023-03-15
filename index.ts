import cron from "node-cron";
import Queue from "promise-queue";
import dayjs from "dayjs";
import RSS from "./rss";
import TG from "./tg";
import config from "./config";
import { Source } from "./typings/entities/sources.entity";
import { Setting } from "./typings/entities/settings.entity";
import { NewsItem } from "./typings/entities/news.entity";
import cleanText from "./utils/cleanText.util";
import initMongo from "./database";

(async () => {
  const db = await initMongo(config.mongoUrl, config.mongoDb);

  const rss = new RSS();
  const tg = new TG(db);
  const queue = new Queue(1, Infinity);

  console.info("app :: started");

  const executeQueue = async (
    source: Source,
    user: Setting,
    item: NewsItem
  ) => {
    try {
      await tg.publishItem(item, source, user);
    } catch (_) {
      console.error(_);
    }
    await new Promise((r) => setTimeout(r, 300));
  };

  cron.schedule("*/2 * * * *", async () => {
    try {
      console.info("executing a task");

      const sources = await db.sources.find().toArray();
      console.info("finded %s sources", sources.length);

      for (const source of sources) {
        console.info("parse %s", source.url);
        // Read RSS feed from url
        const src = await rss.parse(source.url);
        const { item: items }: { item: NewsItem[] } = src;

        console.info("retreived %s items", items.length);

        const users = await db.settings
          .find({
            sources: source.guid,
          })
          .toArray();

        console.info("finded %s users", users.length);

        items
          .filter(
            (item) => item.guid && dayjs().diff(dayjs(item.pubDate), "day") <= 1
          )
          .map(async (item: NewsItem) => {
            const checkExists =
              (await db.news.countDocuments({ guid: item.guid })) > 0;
            if (checkExists) return;

            const itemData: NewsItem = {
              content_encoded: "", // item["content:encoded"]
              dc_creator: "", //String(item["dc:creator"])?.slice(0, 1000) ?? "",
              description:
                cleanText(item.description)
                  .replace(/\n/g, " ")
                  .replace(/&#[\da-fA-F]+;/g, "") ?? "",
              enclosure: "", //String(item.enclosure)?.slice(0, 1000) ?? "",
              guid: item.guid ?? "",
              link: item.link ?? "",
              media_content: "", // item["media:content"] ?? "",
              pubDate: item.pubDate ?? "",
              source: source.guid,
              title: item.title.replace(/&#[\da-fA-F]+;/g, "") ?? "",
            };

            // Push news item to database
            await db.news.insertOne(itemData);

            users.map((u) =>
              queue.add(async () => await executeQueue(source, u, itemData))
            );
          });
      }

      console.log("running a task every minute");
    } catch (e) {
      console.error(e);
    }
  });
})();
