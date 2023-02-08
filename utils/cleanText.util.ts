import config from "../config";

export default function cleanText(text: string = "") {
  config.removeStrings.map((str) => (text = text.replace(str, "")));
  return text.replace(/<\/?[^>]+(>|$)/g, "");
}
