export interface Setting {
  id?: string;
  chatId: number;
  isDirect: boolean;
  sources: string[];
  userId: number;
}

export interface SettingUpdateDto {
  chatId?: number;
  isDirect?: boolean;
  sources?: string[];
  userId?: number;
}
