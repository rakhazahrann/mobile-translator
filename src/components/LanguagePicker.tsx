import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Language } from "../types";
import { LANGUAGES } from "../constants/languages";

type Props = {
  selected: Language;
  onSelect: (lang: Language) => void;
};

export default function LanguagePicker({ selected, onSelect }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.buttonText}>{selected.name}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Select Language</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    item.code === selected.code && styles.itemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      item.code === selected.code && styles.itemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.itemCode}>{item.code.toUpperCase()}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  arrow: {
    marginLeft: 6,
    fontSize: 10,
    color: "#666",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#333",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  itemSelected: {
    backgroundColor: "#e8f4fd",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  itemTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  itemCode: {
    fontSize: 13,
    color: "#999",
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  closeText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
});
