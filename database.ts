import { Client, Databases, ID, Models } from "node-appwrite";
import config, { ColsKeys } from "./config";

const client = new Client();
client
  .setEndpoint(config.appwriteEndpoint) // Your API Endpoint
  .setKey(config.appwriteKey) // Your API Key
  .setProject(config.appwriteProject); // Your project ID
const db = new Databases(client);

export default function useDatabase<T>(colName: ColsKeys) {
  const colId = config.appwriteDatabaseColsIds[colName];

  return {
    client: db.client,

    get: async (id: string) =>
      db.getDocument<Models.Document & T>(config.appwriteDatabaseId, colId, id),
    list: async (queries?: string[]) =>
      db.listDocuments<Models.Document & T>(
        config.appwriteDatabaseId,
        colId,
        queries
      ),
    create: async (
      data: Omit<Models.Document & T, keyof Models.Document>,
      id: string = ID.unique(),
      permissions: string[] = []
    ) =>
      db.createDocument<Models.Document & T>(
        config.appwriteDatabaseId,
        colId,
        id,
        data,
        permissions
      ),
    update: async <UT = T>(
      id: string,
      data: Omit<Models.Document & UT, keyof Models.Document>,
      permissions: string[] = []
    ) =>
      db.updateDocument<Models.Document & T>(
        config.appwriteDatabaseId,
        colId,
        id,
        data,
        permissions
      ),
    delete: async (id: string) =>
      db.deleteDocument(config.appwriteDatabaseId, colId, id),
    count: async (queries: string[]) => {
      return (
        await db.listDocuments<Models.Document & T>(
          config.appwriteDatabaseId,
          colId,
          queries
        )
      ).total;
    },
    getOne: async (queries: string[]) => {
      return (
        (
          await db.listDocuments<Models.Document & T>(
            config.appwriteDatabaseId,
            colId,
            queries
          )
        ).documents?.[0] ?? null
      );
    },
  };
}
