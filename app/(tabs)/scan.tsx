import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import MlkitOcr, { DetectorType, OcrResult } from "rn-mlkit-ocr";
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

type OverlayLine = {
  translated: string;
  frame: { x: number; y: number; width: number; height: number };
};

function pickBestOcr(results: OcrResult[]): OcrResult | null {
  return results.reduce<OcrResult | null>((best, cur) => {
    const curLen = cur?.text?.trim().length ?? 0;
    const bestLen = best?.text?.trim().length ?? 0;
    return curLen > bestLen ? cur : best;
  }, null);
}

function unionFrame(frames: OverlayLine["frame"][]) {
  const minX = Math.min(...frames.map((f) => f.x));
  const minY = Math.min(...frames.map((f) => f.y));
  const maxX = Math.max(...frames.map((f) => f.x + f.width));
  const maxY = Math.max(...frames.map((f) => f.y + f.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function mapFrame(
  frame: OverlayLine["frame"],
  imgW: number,
  imgH: number,
  viewW: number,
  viewH: number
) {
  const scale = Math.min(viewW / imgW, viewH / imgH);
  const offsetX = (viewW - imgW * scale) / 2;
  const offsetY = (viewH - imgH * scale) / 2;
  return {
    left: offsetX + frame.x * scale,
    top: offsetY + frame.y * scale,
    width: frame.width * scale,
    height: frame.height * scale,
  };
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[0]);
  const [detectedLang, setDetectedLang] = useState<Language | null>(null);
  const [error, setError] = useState("");
  const [availableDetectors, setAvailableDetectors] = useState<DetectorType[]>(
    []
  );
  const [autoScan, setAutoScan] = useState(true);
  const [busy, setBusy] = useState(false);
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const [overlays, setOverlays] = useState<OverlayLine[]>([]);
  const [fullTranslation, setFullTranslation] = useState("");
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
    async (uri: string): Promise<OcrResult | null> => {
      const detectors =
        availableDetectors.length > 0 ? availableDetectors : DETECTOR_ORDER;
      const results = await Promise.all(
        detectors.map(async (detector) => {
          try {
            return await MlkitOcr.recognizeText(uri, detector);
          } catch {
            return { text: "", blocks: [] } as OcrResult;
          }
        })
      );
      return pickBestOcr(results);
    },
    [availableDetectors]
  );

  const unfreeze = useCallback(() => {
    setFrozenUri(null);
    setOverlays([]);
    setFullTranslation("");
    lastTextRef.current = "";
  }, []);

  const handleScan = useCallback(async () => {
    if (busyRef.current || !cameraRef.current || frozenUri) return;
    busyRef.current = true;
    setBusy(true);
    setError("");

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) {
        return;
      }

      const ocr = await runOcr(photo.uri);
      const text = ocr?.text?.trim() ?? "";
      if (!text) {
        return;
      }

      if (text === lastTextRef.current) {
        return;
      }
      lastTextRef.current = text;

      const lines =
        ocr?.blocks.flatMap((b) => b.lines).filter((l) => l.text.trim()) ?? [];

      const res = await translateText({
        text: lines.map((l) => l.text).join("\n") || text,
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

      const parts = res.translatedText.split("\n");
      const mapped: OverlayLine[] =
        lines.length === 0
          ? []
          : parts.length === lines.length
            ? lines.map((line, i) => ({
                translated: parts[i] ?? line.text,
                frame: line.frame,
              }))
            : [
                {
                  translated: res.translatedText,
                  frame: unionFrame(lines.map((l) => l.frame)),
                },
              ];

      setOverlays(mapped);
      setFullTranslation(res.translatedText);
      setImageSize({ width: photo.width, height: photo.height });
      setFrozenUri(photo.uri);

      await addHistory({
        id: Date.now().toString(),
        sourceText: text,
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
  }, [runOcr, targetLang, frozenUri]);

  useEffect(() => {
    if (!autoScan || !cameraReady || frozenUri) return;
    const interval = setInterval(handleScan, SCAN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [autoScan, cameraReady, handleScan, frozenUri]);

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

  const canMap =
    frozenUri &&
    imageSize.width > 0 &&
    imageSize.height > 0 &&
    viewSize.width > 0 &&
    viewSize.height > 0;

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

      <View
        style={styles.cameraContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setViewSize({ width, height });
        }}
      >
        {frozenUri ? (
          <View style={styles.frozenWrap}>
            <Image
              source={{ uri: frozenUri }}
              style={styles.frozenImage}
              resizeMode="contain"
            />
            {canMap
              ? overlays.map((item, i) => {
                  const box = mapFrame(
                    item.frame,
                    imageSize.width,
                    imageSize.height,
                    viewSize.width,
                    viewSize.height
                  );
                  if (box.width < 8 || box.height < 8) return null;
                  return (
                    <View key={i} style={[styles.overlayBox, box]}>
                      <Text
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        style={[
                          styles.overlayText,
                          { fontSize: Math.max(10, box.height * 0.72) },
                        ]}
                      >
                        {item.translated}
                      </Text>
                    </View>
                  );
                })
              : null}
          </View>
        ) : (
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
        )}

        {error ? (
          <View style={styles.errorBadge}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.controlRow}>
        {frozenUri ? (
          <>
            <TouchableOpacity style={styles.scanToggle} onPress={unfreeze}>
              <Text style={styles.scanToggleText}>Scan Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() =>
                Speech.speak(fullTranslation, { language: targetLang.code })
              }
              disabled={!fullTranslation}
            >
              <Text style={styles.scanButtonText}>Speak</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
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
          </>
        )}
      </View>
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
    flex: 1,
    margin: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  frozenWrap: {
    flex: 1,
  },
  frozenImage: {
    ...StyleSheet.absoluteFill,
  },
  overlayBox: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 4,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  overlayText: {
    color: "#111",
    fontWeight: "700",
    textAlign: "center",
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
  errorBadge: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(255,240,240,0.95)",
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
  },
  controlRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 12,
    marginBottom: Platform.OS === "ios" ? 12 : 12,
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
});
