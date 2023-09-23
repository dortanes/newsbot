import axios from "axios";
import { XMLParser } from "fast-xml-parser";

export default class RSS {
  async parse(url: string) {
    // Retreive RSS feed from url
    const { data } = await axios.get(url, { timeout: 10 * 1000 });

    // Parse XML data
    const parser = new XMLParser();
    const obj = parser.parse(data)["rss"]["channel"];

    return obj;
  }
}
