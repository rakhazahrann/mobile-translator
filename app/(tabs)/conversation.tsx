import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import LanguagePicker from "../../src/components/LanguagePicker";
import { Language, ConversationItem } from "../../src/types";
import { LANGUAGES } from "../../src/constants/languages";
import { translateText } from "../../src/services/translate";

export default function ConversationScreen() {
  const [langA, setLangA] = useState<Language>(LANGUAGES[0]);
  const [langB, setLangB] = useState<Language>(LANGUAGES[1]);
  const [messages, setMessages] = useState<ConversationItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeSpeaker, setActiveSpeaker] = useState<"A" | "B">("A");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const flatListRef = useRef<FlatList<ConversationItem>>(null);

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      setInputText(transcript);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    setRecording(false);
  });

  useSpeechRecognitionEvent("error", () => {
    setRecording(false);
  });

  const startListening = useCallback(async () => {
    const { granted } =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;

    const srcLang = activeSpeaker === "A" ? langA : langB;
    setRecording(true);
    ExpoSpeechRecognitionModule.start({
      lang: srcLang.code,
      interimResults: true,
      continuous: false,
    });
  }, [activeSpeaker, langA, langB]);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    setRecording(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);

    const srcLang = activeSpeaker === "A" ? langA : langB;
    const tgtLang = activeSpeaker === "A" ? langB : langA;

    try {
      const res = await translateText({
        text: inputText.trim(),
        sourceLanguage: srcLang.code,
        targetLanguage: tgtLang.code,
      });

      const item: ConversationItem = {
        id: Date.now().toString(),
        speaker: activeSpeaker,
        sourceText: inputText.trim(),
        translatedText: res.translatedText,
        sourceLanguage: srcLang.code,
        targetLanguage: tgtLang.code,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, item]);
      setInputText("");
      Speech.speak(res.translatedText, { language: tgtLang.code });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          speaker: activeSpeaker,
          sourceText: inputText.trim(),
          translatedText: "Translation failed",
          sourceLanguage: srcLang.code,
          targetLanguage: tgtLang.code,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [inputText, activeSpeaker, langA, langB, loading]);

  const renderMessage = ({ item }: { item: ConversationItem }) => {
    const isA = item.speaker === "A";
    return (
      <View style={[styles.bubble, isA ? styles.bubbleA : styles.bubbleB]}>
        <Text style={styles.speakerLabel}>
          {isA ? langA.name : langB.name}
        </Text>
        <Text style={styles.sourceText}>{item.sourceText}</Text>
        <View style={styles.divider} />
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
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.langRow}>
        <LanguagePicker selected={langA} onSelect={setLangA} />
        <Text style={styles.vs}>⇄</Text>
        <LanguagePicker selected={langB} onSelect={setLangB} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Start a conversation by typing or using the mic
            </Text>
          </View>
        }
      />

      <View style={styles.speakerToggle}>
        <TouchableOpacity
          style={[
            styles.speakerBtn,
            activeSpeaker === "A" && styles.speakerBtnActive,
          ]}
          onPress={() => setActiveSpeaker("A")}
        >
          <Text
            style={[
              styles.speakerBtnText,
              activeSpeaker === "A" && styles.speakerBtnTextActive,
            ]}
          >
            {langA.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.speakerBtn,
            activeSpeaker === "B" && styles.speakerBtnActive,
          ]}
          onPress={() => setActiveSpeaker("B")}
        >
          <Text
            style={[
              styles.speakerBtnText,
              activeSpeaker === "B" && styles.speakerBtnTextActive,
            ]}
          >
            {langB.name}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.micButton, recording && styles.micButtonActive]}
          onPress={recording ? stopListening : startListening}
        >
          <Text style={styles.micText}>{recording ? "⏹" : "🎤"}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder={`Type in ${activeSpeaker === "A" ? langA.name : langB.name}...`}
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading || !inputText.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  vs: {
    fontSize: 20,
    color: "#007AFF",
    fontWeight: "700",
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  bubble: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleA: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-start",
  },
  bubbleB: {
    backgroundColor: "#E3F2FD",
    alignSelf: "flex-end",
  },
  speakerLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  sourceText: {
    fontSize: 15,
    color: "#333",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ccc",
    marginVertical: 6,
  },
  translatedText: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "500",
  },
  speakIcon: {
    fontSize: 16,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#999",
    fontSize: 15,
  },
  speakerToggle: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  speakerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#e8e8e8",
    alignItems: "center",
  },
  speakerBtnActive: {
    backgroundColor: "#007AFF",
  },
  speakerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  speakerBtnTextActive: {
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
    gap: 8,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonActive: {
    backgroundColor: "#FF3B30",
  },
  micText: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: "#333",
  },
  sendButton: {
    backgroundColor: "#007AFF",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});
