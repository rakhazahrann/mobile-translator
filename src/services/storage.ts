import AsyncStorage from "@react-native-async-storage/async-storage";
import { TranslationHistoryItem } from "../types";

const HISTORY_KEY = "@translation_history";
const MAX_HISTORY = 100;

export async function getHistory(): Promise<TranslationHistoryItem[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addHistory(
  item: TranslationHistoryItem
): Promise<void> {
  const history = await getHistory();
  history.unshift(item);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
