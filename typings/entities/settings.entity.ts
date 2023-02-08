export interface Setting {
  id?: string;
  chatId: number;
  isDirect: boolean;
  sources: string[];
  userId: number;
}
