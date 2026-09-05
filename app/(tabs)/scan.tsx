import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import MlkitOcr, { DetectorType } from "rn-mlkit-ocr";
import LanguagePicker from "../../src/components/LanguagePicker";
import { Language } from "../../src/types";
import { LANGUAGES } from "../../src/constants/languages";
import { translateText } from "../../src/services/translate";
import { addHistory } from "../../src/services/storage";

const SCAN_INTERVAL_MS = 2000;

const DETECTOR_ORDER: DetectorType[] = [
  "latin",
  "chinese",
  "japanese",
  "korean",
  "devanagari",
];

function extractOcrText(
  ocrResult: unknown
): string {
  if (typeof ocrResult === "string") return ocrResult;
  const obj = ocrResult as { text?: string; blocks?: { text: string }[] };
  if (obj?.text) return obj.text;
  if (Array.isArray((ocrResult as { blocks?: unknown }).blocks)) {
    return (ocrResult as { blocks: { text: string }[] }).blocks
      .map((b) => b.text)
      .join("\n");
  }
  return "";
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[0]);
  const [detectedLang, setDetectedLang] = useState<Language | null>(null);
  const [scannedText, setScannedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState("");
  const [availableDetectors, setAvailableDetectors] = useState<DetectorType[]>(
    []
  );
  const [autoScan, setAutoScan] = useState(true);
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const busyRef = useRef(false);
  const lastTextRef = useRef("");

  useEffect(() => {
    let mounted = true;
    MlkitOcr.getAvailableLanguages()
      .then((langs) => {
        if (mounted) setAvailableDetectors(langs);
      })
      .catch(() => {
        if (mounted) setAvailableDetectors(DETECTOR_ORDER);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const runOcr = useCallback(
    async (uri: string): Promise<string> => {
      const detectors =
        availableDetectors.length > 0 ? availableDetectors : DETECTOR_ORDER;
      const results = await Promise.all(
        detectors.map(async (detector) => {
          try {
            const res = await MlkitOcr.recognizeText(uri, detector);
            return extractOcrText(res);
          } catch {
            return "";
          }
        })
      );
      return results.reduce((best, current) =>
        current.length > best.length ? current : best
      );
    },
    [availableDetectors]
  );

  const handleScan = useCallback(async () => {
    if (busyRef.current || !cameraRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) {
        return;
      }

      const text = await runOcr(photo.uri);
      if (!text.trim()) {
        return;
      }

      const normalized = text.trim();
      if (normalized === lastTextRef.current) {
        return;
      }
      lastTextRef.current = normalized;
      setScannedText(normalized);

      const res = await translateText({
        text: normalized,
        sourceLanguage: "auto",
        targetLanguage: targetLang.code,
      });

      const detected = res.detectedLanguage
        ? LANGUAGES.find(
            (l) =>
              l.code.toLowerCase() === res.detectedLanguage?.toLowerCase()
          ) ?? null
        : null;
      setDetectedLang(detected);

      setTranslatedText(res.translatedText);
      await addHistory({
        id: Date.now().toString(),
        sourceText: normalized,
        translatedText: res.translatedText,
        sourceLanguage: detected?.code ?? "auto",
        targetLanguage: targetLang.code,
        createdAt: new Date().toISOString(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [runOcr, targetLang]);

  useEffect(() => {
    if (!autoScan || !cameraReady) return;
    const interval = setInterval(handleScan, SCAN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [autoScan, cameraReady, handleScan]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera permission needed</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.langRow}>
        <View style={styles.autoBadge}>
          <Text style={styles.autoBadgeText}>
            {detectedLang ? "Auto:" : "Auto"}
          </Text>
          {detectedLang ? (
            <Text style={styles.autoBadgeLang}>{detectedLang.name}</Text>
          ) : null}
        </View>
        <Text style={styles.arrow}>→</Text>
        <LanguagePicker selected={targetLang} onSelect={setTargetLang} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          autofocus="on"
          onCameraReady={() => setCameraReady(true)}
        >
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            {busy ? (
              <View style={styles.scanningBadge}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.scanningText}>Scanning...</Text>
              </View>
            ) : null}
          </View>
        </CameraView>
      </View>

      <View style={styles.controlRow}>
        <TouchableOpacity
          style={[styles.scanToggle, autoScan && styles.scanToggleOn]}
          onPress={() => setAutoScan((v) => !v)}
        >
          <Text style={styles.scanToggleText}>
            {autoScan ? "Auto-Scan On" : "Auto-Scan Off"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scanButton, busy && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={busy}
        >
          <Text style={styles.scanButtonText}>Scan Now</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.resultArea}
        contentContainerStyle={styles.resultContent}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {scannedText ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Detected Text</Text>
            <Text style={styles.cardText}>{scannedText}</Text>
          </View>
        ) : null}

        {translatedText ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Translation</Text>
            <Text style={styles.translatedCardText}>{translatedText}</Text>
            <TouchableOpacity
              onPress={() =>
                Speech.speak(translatedText, { language: targetLang.code })
              }
              style={styles.speakRow}
            >
              <Text style={styles.speakIcon}>🔊</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  permText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  permButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  arrow: {
    fontSize: 20,
    color: "#007AFF",
    fontWeight: "700",
  },
  autoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f4fd",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  autoBadgeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007AFF",
  },
  autoBadgeLang: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginLeft: 4,
  },
  cameraContainer: {
    height: 280,
    margin: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: "80%",
    height: "70%",
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  scanningBadge: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  scanningText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  controlRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 12,
  },
  scanToggle: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  scanToggleOn: {
    backgroundColor: "#d1e7fd",
  },
  scanToggleText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "700",
  },
  scanButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  resultArea: {
    flex: 1,
    marginTop: 8,
  },
  resultContent: {
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  errorCard: {
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  translatedCardText: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "500",
    lineHeight: 22,
  },
  speakRow: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  speakIcon: {
    fontSize: 20,
  },
});