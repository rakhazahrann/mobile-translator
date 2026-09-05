import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import LanguagePicker from "../../src/components/LanguagePicker";
import { Language } from "../../src/types";
import { LANGUAGES } from "../../src/constants/languages";
import { translateText } from "../../src/services/translate";
import { addHistory } from "../../src/services/storage";

export default function TranslateScreen() {
  const [sourceLang, setSourceLang] = useState<Language>(LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[1]);
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const swapLanguages = useCallback(() => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(result);
    setResult(inputText);
  }, [sourceLang, targetLang, inputText, result]);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await translateText({
        text: inputText.trim(),
        sourceLanguage: sourceLang.code,
        targetLanguage: targetLang.code,
      });
      setResult(res.translatedText);
      await addHistory({
        id: Date.now().toString(),
        sourceText: inputText.trim(),
        translatedText: res.translatedText,
        sourceLanguage: sourceLang.code,
        targetLanguage: targetLang.code,
        createdAt: new Date().toISOString(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  }, [inputText, sourceLang, targetLang]);

  const speak = useCallback(
    (text: string, lang: string) => {
      Speech.speak(text, { language: lang });
    },
    []
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.langRow}>
          <LanguagePicker selected={sourceLang} onSelect={setSourceLang} />
          <TouchableOpacity onPress={swapLanguages} style={styles.swapButton}>
            <Text style={styles.swapText}>⇄</Text>
          </TouchableOpacity>
          <LanguagePicker selected={targetLang} onSelect={setTargetLang} />
        </View>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter text..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlignVertical="top"
          />
          {inputText.length > 0 && (
            <View style={styles.inputActions}>
              <TouchableOpacity
                onPress={() => speak(inputText, sourceLang.code)}
              >
                <Text style={styles.actionIcon}>🔊</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInputText("")}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.translateButton, loading && styles.translateButtonDisabled]}
          onPress={handleTranslate}
          disabled={loading || !inputText.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.translateButtonText}>Translate</Text>
          )}
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultText}>{result}</Text>
            <TouchableOpacity
              onPress={() => speak(result, targetLang.code)}
              style={styles.speakButton}
            >
              <Text style={styles.actionIcon}>🔊</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  swapButton: {
    padding: 8,
  },
  swapText: {
    fontSize: 22,
    color: "#007AFF",
    fontWeight: "700",
  },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  textInput: {
    fontSize: 16,
    color: "#333",
    minHeight: 80,
  },
  inputActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionIcon: {
    fontSize: 20,
  },
  clearIcon: {
    fontSize: 18,
    color: "#999",
    padding: 4,
  },
  translateButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  translateButtonDisabled: {
    opacity: 0.6,
  },
  translateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorCard: {
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    minHeight: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  resultText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  speakButton: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
});
