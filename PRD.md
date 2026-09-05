# PRD: Mobile Translator

## 1. Ringkasan

Mobile Translator adalah aplikasi mobile React Native untuk membantu pengguna berkomunikasi saat berada di luar negeri. Aplikasi menyediakan terjemahan teks, mode percakapan dua arah, input suara, output suara, dan riwayat percakapan.

Versi awal fokus pada MVP online dengan provider terjemahan gratis atau free-tier. Karena aplikasi digunakan untuk pribadi, MVP tidak membutuhkan backend atau server sendiri. Aplikasi mobile langsung memanggil provider translate gratis yang tidak membutuhkan API key rahasia.

## 2. Masalah

Saat berada di luar negeri, pengguna sering kesulitan berkomunikasi karena perbedaan bahasa. Aplikasi translate umum bisa membantu, tetapi mode percakapan yang cepat, sederhana, dan mobile-friendly masih penting untuk situasi seperti bertanya arah, belanja, transportasi, hotel, dan keadaan darurat.

## 3. Tujuan

- Membantu pengguna menerjemahkan teks antar bahasa.
- Membantu percakapan dua arah secara cepat.
- Mendukung input suara agar pengguna tidak perlu mengetik.
- Membacakan hasil terjemahan agar lawan bicara mudah memahami.
- Menyimpan riwayat percakapan lokal untuk referensi.
- Memulai dengan provider translate gratis/free-tier tanpa server sendiri.

## 4. Non-Tujuan

- Terjemahan offline penuh pada MVP pertama.
- Akurasi setara penerjemah manusia.
- Chat antar pengguna.
- Akun pengguna dan sinkronisasi cloud.
- Pembayaran atau subscription.
- Admin dashboard.

## 5. Target Pengguna

- Traveler luar negeri.
- Pelajar atau pekerja yang tinggal di negara lain.
- Pengguna yang sering berinteraksi dengan orang asing.
- Pengguna yang butuh bantuan translate cepat di situasi harian.

## 6. Use Case Utama

### 6.1 Translate Teks

Pengguna memilih bahasa asal dan bahasa tujuan, mengetik teks, lalu melihat hasil terjemahan.

### 6.2 Conversation Mode

Pengguna memilih dua bahasa. Pengguna menekan tombol mic untuk bahasa A atau bahasa B. Aplikasi menangkap suara, mengubah suara menjadi teks, menerjemahkan, lalu menampilkan dan membacakan hasil.

### 6.3 Text-to-Speech

Pengguna menekan tombol speaker untuk membacakan hasil terjemahan.

### 6.4 Riwayat

Pengguna melihat daftar terjemahan sebelumnya, termasuk teks asli, hasil terjemahan, bahasa, dan waktu.

## 7. Fitur MVP

### 7.1 Pilih Bahasa

- Pengguna dapat memilih bahasa asal.
- Pengguna dapat memilih bahasa tujuan.
- Pengguna dapat menukar bahasa asal dan tujuan.
- Bahasa awal default: Indonesia ke Inggris.

### 7.2 Translate Teks

- Input teks manual.
- Tombol translate.
- Loading state saat proses translate.
- Error state saat gagal.
- Hasil terjemahan tampil jelas.

### 7.3 Conversation Mode

- Dua tombol input percakapan: bahasa pengguna dan bahasa lawan bicara.
- Setiap hasil percakapan masuk ke daftar chat lokal di layar.
- Tampilan membedakan pembicara A dan B.
- Hasil dapat dibacakan.

### 7.4 Text-to-Speech

- Aplikasi dapat membacakan hasil terjemahan.
- Tersedia tombol speaker di hasil translate dan conversation item.

### 7.5 History Lokal

- Menyimpan terjemahan terakhir di device.
- Menampilkan riwayat terjemahan.
- Pengguna dapat menghapus semua riwayat.

### 7.6 Translate Provider Langsung

- Aplikasi mobile langsung memanggil provider translate gratis.
- Provider awal: LibreTranslate public instance atau MyMemory.
- Aplikasi tidak menyimpan API key rahasia.
- Backend dapat ditambahkan nanti jika aplikasi menjadi publik atau membutuhkan provider berbayar.

## 8. Fitur Setelah MVP

- Offline translation dengan ML Kit On-Device Translation.
- Deteksi bahasa otomatis.
- Favorit phrase.
- Phrasebook untuk situasi umum.
- Export riwayat.
- Pengaturan suara dan kecepatan bicara.
- Mode darurat dengan kalimat penting.
- Camera OCR translate.
- Multi-provider fallback.

## 9. User Flow

### 9.1 Translate Teks

1. Pengguna membuka aplikasi.
2. Pengguna memilih bahasa asal dan tujuan.
3. Pengguna mengetik teks.
4. Pengguna menekan tombol translate.
5. Aplikasi mengirim request ke provider translate.
6. Provider mengembalikan hasil translate.
7. Aplikasi menampilkan hasil.
8. Aplikasi menyimpan hasil ke history lokal.

### 9.2 Conversation

1. Pengguna membuka tab Conversation.
2. Pengguna memilih bahasa A dan bahasa B.
3. Pengguna menekan mic bahasa A.
4. Aplikasi merekam suara dan mengubah ke teks.
5. Aplikasi menerjemahkan teks ke bahasa B.
6. Aplikasi menampilkan pasangan teks asli dan terjemahan.
7. Aplikasi membacakan hasil jika auto-speak aktif.
8. Lawan bicara menekan mic bahasa B untuk membalas.

## 10. Kebutuhan Fungsional

### FR-001 Pilih Bahasa

Aplikasi harus menyediakan daftar bahasa yang didukung provider awal.

### FR-002 Tukar Bahasa

Aplikasi harus menyediakan tombol untuk menukar bahasa asal dan tujuan.

### FR-003 Translate Teks

Aplikasi harus mengirim teks ke provider translate dan menampilkan hasil terjemahan.

### FR-004 Validasi Input

Aplikasi tidak boleh mengirim request translate jika teks kosong.

### FR-005 Loading State

Aplikasi harus menampilkan status loading selama proses translate.

### FR-006 Error State

Aplikasi harus menampilkan pesan error saat translate gagal.

### FR-007 Conversation Item

Aplikasi harus menyimpan setiap percakapan sebagai item berisi teks asli, hasil translate, bahasa asal, bahasa tujuan, dan timestamp.

### FR-008 Text-to-Speech

Aplikasi harus bisa membacakan hasil terjemahan.

### FR-009 History Lokal

Aplikasi harus menyimpan history di device.

### FR-010 Hapus History

Aplikasi harus menyediakan aksi hapus semua history.

## 11. Kebutuhan Non-Fungsional

- Aplikasi harus responsif di ukuran layar mobile umum.
- Aplikasi harus tetap bisa dibuka walau internet mati.
- Translate boleh gagal jika offline, tetapi UI harus menampilkan pesan jelas.
- API key rahasia tidak boleh disimpan di aplikasi mobile.
- Request translate harus punya timeout.
- Input pengguna tidak boleh disimpan di server pada MVP.
- History hanya disimpan lokal di device.

## 12. Bahasa Awal

Daftar awal:

- Indonesia
- Inggris
- Jepang
- Korea
- Mandarin
- Spanyol
- Prancis
- Jerman
- Arab
- Thailand

Daftar final mengikuti dukungan provider yang dipilih.

## 13. Translate Service Contract

Aplikasi menggunakan fungsi internal `translateText` agar provider bisa diganti tanpa mengubah UI.

### 13.1 Function Input

```ts
type TranslateInput = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};
```

### 13.2 Function Output

```ts
type TranslateResult = {
  translatedText: string;
};
```

### 13.3 Error

```ts
type TranslateError = {
  message: string;
};
```

## 14. Data Lokal

### TranslationHistoryItem

```ts
type TranslationHistoryItem = {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
};
```

### ConversationItem

```ts
type ConversationItem = {
  id: string;
  speaker: "A" | "B";
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
};
```

## 15. Tech Stack Rekomendasi

- Mobile: React Native dengan Expo dan TypeScript.
- Navigation: Expo Router atau React Navigation.
- Local storage: AsyncStorage.
- Text-to-speech: `expo-speech`.
- Speech input: ditentukan setelah target platform final.
- Provider awal: LibreTranslate atau MyMemory.

## 16. Risiko

### 16.1 Provider Gratis Tidak Stabil

Public API gratis bisa lambat, limit, atau down.

Mitigasi: translate logic dipisah di service function agar provider mudah diganti.

### 16.2 Kualitas Terjemahan Berbeda

Provider gratis mungkin punya kualitas rendah untuk bahasa tertentu.

Mitigasi: mulai dari bahasa populer dan sediakan fallback provider nanti.

### 16.3 Speech-to-Text Kompleks

Speech-to-text bisa berbeda antara Android dan iOS.

Mitigasi: MVP bisa mulai dari teks manual, lalu tambah input suara setelah UI utama stabil.

### 16.4 Privasi

Teks pengguna dikirim langsung dari aplikasi ke provider translate.

Mitigasi: gunakan untuk pribadi, jangan kirim data sensitif, dan jangan simpan teks di server karena MVP tidak memakai server.

## 17. Metrik Sukses MVP

- Pengguna bisa menerjemahkan teks dalam kurang dari 5 detik pada koneksi normal.
- Pengguna bisa melakukan percakapan dua arah minimal 5 giliran tanpa crash.
- History tersimpan setelah aplikasi ditutup dan dibuka ulang.
- Error provider ditampilkan jelas tanpa membuat aplikasi freeze.

## 18. Acceptance Criteria

- Aplikasi bisa dibuka di Android emulator atau device.
- Translate teks Indonesia ke Inggris berhasil lewat provider gratis.
- Tombol swap bahasa bekerja.
- Empty input tidak mengirim request.
- Error network menampilkan pesan jelas.
- Hasil translate bisa dibacakan dengan text-to-speech.
- Riwayat translate tersimpan lokal.
- Riwayat bisa dihapus.

## 19. Prioritas Build

### P0

- Setup project React Native.
- Layar translate teks.
- Integrasi provider gratis.
- Loading dan error state.

### P1

- Text-to-speech.
- History lokal.
- Conversation mode teks.

### P2

- Speech-to-text.
- Auto-speak di conversation.
- Offline translation riset.

## 20. Keputusan Terbuka

- Provider gratis awal: LibreTranslate atau MyMemory.
- Target platform awal: Android saja atau Android + iOS.
- Speech-to-text: native, cloud, atau library pihak ketiga.
- Backend/server: tidak dipakai di MVP pribadi, ditambahkan hanya jika app publik atau memakai API key rahasia.
