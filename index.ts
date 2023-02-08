import cron from "node-cron";
import Queue from "promise-queue";
import dayjs from "dayjs";
import RSS from "./rss";
import TG from "./tg";
import config from "./config";
import { Source } from "./typings/entities/sources.entity";
import { Setting } from "./typings/entities/settings.entity";
import { NewsItem } from "./typings/entities/news.entity";
import cols from "./collections";
import cleanText from "./utils/cleanText.util";
import { Query } from "node-appwrite";
import { createHash } from "crypto";

const rss = new RSS();
const tg = new TG();
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

cron.schedule("*/2 * * * *", async () => {
  try {
    console.info("executing a task");

    const sources = await cols.sources.list();
    console.info("finded %s sources", sources.total);

    for (const source of sources.documents) {
      console.info("parse %s", source.url);
      // Read RSS feed from url
      const src = await rss.parse(source.url);
      const { item: items }: { item: NewsItem[] } = src;

      console.info("retreived %s items", items.length);

      const users = await cols.settings.list([
        Query.search("sources", source.guid),
      ]);

      console.info("finded %s users", users.total);

      items
        .filter(
          (item) => item.guid && dayjs().diff(dayjs(item.pubDate), "day") <= 1
        )
        .map(async (item: NewsItem) => {
          const itemId = createHash("md5")
            .update(JSON.stringify(item.guid ?? item.title))
            .digest("hex")
            .slice(0, 36);

          const checkExists =
            (await cols.news.count([Query.equal("$id", itemId)])) > 0;
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
          await cols.news.create(itemData, itemId);

          users.documents.map((u) =>
            queue.add(async () => await executeQueue(source, u, itemData))
          );
        });
    }

    console.log("running a task every minute");
  } catch (e) {
    console.error(e);
  }
});
