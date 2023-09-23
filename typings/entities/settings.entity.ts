export interface Setting {
  id?: string;
  chatId: number;
  isDirect: boolean;
  sources: string[];
  userId: number;
  disabled: boolean;
}

export interface SettingUpdateDto {
  chatId?: number;
  isDirect?: boolean;
  sources?: string[];
  userId?: number;
  disabled: boolean;
}
