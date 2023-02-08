import { writeFileSync } from "fs";
import { onAll, Collection } from "typesaurus";

// Used to cache collections
export function useColsCache<T>(col: Collection<T>) {
  let docs = [];
  onAll(col, (refs) => {
    docs = refs.map((ref) => ({
      ...ref.data,
      id: ref.ref.id,
    }));
    writeFileSync("./data" + col.path + ".json", JSON.stringify(docs));
  });
  return () => docs as T[];
}
