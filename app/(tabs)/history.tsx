import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import * as Speech from "expo-speech";
import { useFocusEffect } from "expo-router";
import { TranslationHistoryItem } from "../../src/types";
import { getHistory, clearHistory } from "../../src/services/storage";
import { LANGUAGES } from "../../src/constants/languages";

function langName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase();
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  const handleClear = () => {
    Alert.alert("Clear History", "Delete all translation history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: TranslationHistoryItem }) => (
    <View style={styles.card}>
      <View style={styles.langBadgeRow}>
        <Text style={styles.langBadge}>
          {langName(item.sourceLanguage)} → {langName(item.targetLanguage)}
        </Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.sourceText}>{item.sourceText}</Text>
      <View style={styles.divider} />
      <View style={styles.resultRow}>
        <Text style={styles.translatedText}>{item.translatedText}</Text>
        <TouchableOpacity
          onPress={() =>
            Speech.speak(item.translatedText, {
              language: item.targetLanguage,
            })
          }
        >
          <Text style={styles.speakIcon}>🔊</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {history.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No translation history yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  clearButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  langBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  langBadge: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  time: {
    fontSize: 11,
    color: "#999",
  },
  sourceText: {
    fontSize: 15,
    color: "#333",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  translatedText: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  speakIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#999",
    fontSize: 15,
  },
});
