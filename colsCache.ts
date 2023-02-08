import { onAll, Collection } from "typesaurus";

// Used to cache collections
export function useColsCache<T>(col: Collection<T>) {
  let docs = [];
  onAll(
    col,
    (refs) =>
      (docs = refs.map((ref) => ({
        ...ref.data,
        id: ref.ref.id,
      })))
  );
  return () => docs as T[];
}
