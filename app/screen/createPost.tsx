import { Icons } from "@/constants/icons";
import { categories } from "@/data/category";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePost } from "@/hooks/useCreatePost";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* =========================
   🔥 TYPES
========================= */
type PickedImage = {
  uri: string;
  width: number;
  height: number;
  fileSize?: number; // bytes, when the picker/browser exposes it
};

type DraftShape = {
  title: string;
  description: string;
  selectedCategory: string;
  tags: string[];
  image: PickedImage | null;
  savedAt: number;
};

/* =========================
   🔥 CONSTANTS
========================= */
const BREAKPOINTS = { laptop: 1024 };

const STEPS = [
  { key: "artwork", label: "Artwork" },
  { key: "details", label: "Details" },
  { key: "category", label: "Category & tags" },
  { key: "review", label: "Review" },
] as const;

const STAGE_MESSAGES = [
  "Compressing image...",
  "Uploading artwork...",
  "Creating post...",
  "Done!",
];

/* =========================
   🔥 HELPERS
========================= */
function formatBytes(bytes?: number) {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function draftKey(userId?: string) {
  return `create_post_draft_${userId ?? "guest"}`;
}

function categoryLabel(cat: unknown): string {
  if (typeof cat === "string") return cat;
  if (cat && typeof cat === "object") {
    if ("title" in (cat as any)) return (cat as any).title;
    if ("name" in (cat as any)) return (cat as any).name;
  }
  return String(cat);
}

/* =========================
   🔥 PILL CATEGORY SELECTOR
   Replaces CategoryTabs with a wrapping pill row per the brief. Reads
   `categories` as either string[] or {id,name}[] — adjust categoryLabel
   above if your actual shape differs.
========================= */
function PillCategorySelector({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (val: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {categories.map((cat, i) => {
        const label = categoryLabel(cat);
        const isActive = label === active;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect(label)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: isActive ? "#ED3237" : "#2e2b2b",
              borderWidth: 1,
              borderColor: isActive ? "#ED3237" : "#3d3a3a",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* =========================
   🔥 TAG CHIP INPUT
   Single input, Enter (or the + button) commits a chip — matches the
   "type tag, press Enter" pattern from the brief instead of N separate
   input rows.
========================= */
function TagChipInput({
  tags,
  onAdd,
  onRemove,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}) {
  const [value, setValue] = useState("");

  const commit = () => {
    const cleaned = value.trim().replace(/^#/, "");
    if (cleaned) onAdd(cleaned);
    setValue("");
  };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#2e2b2b",
          borderRadius: 10,
          paddingHorizontal: 14,
          height: 52,
        }}
      >
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={commit}
          placeholder="Type a tag and press enter"
          placeholderTextColor="#bdbdbd"
          style={{ flex: 1, color: "#fff", fontSize: 15 }}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={commit}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#ED3237",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image source={Icons.add} style={{ width: 12, height: 12, tintColor: "#fff" }} />
        </TouchableOpacity>
      </View>

      {tags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => onRemove(tag)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#444",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                gap: 6,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>#{tag}</Text>
              <Text style={{ color: "#bdbdbd", fontSize: 13 }}>×</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* =========================
   🔥 ARTWORK UPLOADER
   Hero-sized dropzone. Drag-and-drop only wires up on web (RN has no
   cross-platform DnD primitive); native/web click both go through
   ImagePicker, which already opens the browser's file dialog on web.
========================= */
function ArtworkUploader({
  image,
  height,
  onPick,
  onDropFile,
}: {
  image: PickedImage | null;
  height: number;
  onPick: () => void;
  onDropFile: (file: File) => void;
}) {
  const dropRef = useRef<View>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    // On web, `View` renders a real <div>, so `dropRef.current` is usable
    // as a DOM node via the `as any` cast — RN's ref typing doesn't know
    // about the underlying DOM element.
    const node = dropRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const prevent = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onEnter = (e: DragEvent) => {
      prevent(e);
      setDragActive(true);
    };
    const onLeave = (e: DragEvent) => {
      prevent(e);
      setDragActive(false);
    };
    const onDrop = (e: DragEvent) => {
      prevent(e);
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) onDropFile(file);
    };

    node.addEventListener("dragover", prevent);
    node.addEventListener("dragenter", onEnter);
    node.addEventListener("dragleave", onLeave);
    node.addEventListener("drop", onDrop);

    return () => {
      node.removeEventListener("dragover", prevent);
      node.removeEventListener("dragenter", onEnter);
      node.removeEventListener("dragleave", onLeave);
      node.removeEventListener("drop", onDrop);
    };
  }, [onDropFile]);

  const orientation =
    image && image.width && image.height
      ? image.width === image.height
        ? "Square"
        : image.width > image.height
        ? "Landscape"
        : "Portrait"
      : null;

  return (
    <View>
      <TouchableOpacity
        ref={dropRef as any}
        onPress={onPick}
        activeOpacity={0.9}
        style={{
          width: "100%",
          height,
          borderRadius: 20,
          backgroundColor: "#1c1a1a",
          borderWidth: 2,
          borderColor: dragActive ? "#ED3237" : "transparent",
          borderStyle: dragActive ? "dashed" : "solid",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {image ? (
          <Image source={{ uri: image.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <>
            <View
              style={{
                width: 56,
                height: 56,
                backgroundColor: "#2e2b2b",
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Image source={Icons.add} style={{ width: 24, height: 24, tintColor: "#fff" }} />
            </View>
            <Text style={{ color: "#eaeaea", fontSize: 18, fontWeight: "600" }}>
              {Platform.OS === "web" ? "Drag & drop artwork" : "Upload artwork"}
            </Text>
            <Text style={{ color: "#787575", fontSize: 13, marginTop: 4 }}>
              {Platform.OS === "web" ? "or browse files" : "Tap to browse files"}
            </Text>
            <Text style={{ color: "#787575", fontSize: 12, marginTop: 10 }}>PNG · JPG · WEBP · Max 20MB</Text>
          </>
        )}
      </TouchableOpacity>

      {image && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <Text style={{ color: "#9c9996", fontSize: 12 }}>
            {image.width}×{image.height}
            {formatBytes(image.fileSize) ? ` · ${formatBytes(image.fileSize)}` : ""}
            {orientation ? ` · ${orientation}` : ""}
          </Text>
          <TouchableOpacity onPress={onPick}>
            <Text style={{ color: "#ED3237", fontWeight: "600", fontSize: 13 }}>Change image</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* =========================
   🔥 LIVE PREVIEW CARD
   Renders the post approximately as it'll appear once published.
========================= */
function PreviewCard({
  image,
  title,
  description,
  tags,
  authorName,
  authorAvatar,
}: {
  image: PickedImage | null;
  title: string;
  description: string;
  tags: string[];
  authorName?: string;
  authorAvatar?: string;
}) {
  return (
    <View style={{ backgroundColor: "#141414", borderRadius: 16, overflow: "hidden" }}>
      {image ? (
        <Image source={{ uri: image.uri }} style={{ width: "100%", height: 320 }} resizeMode="cover" />
      ) : (
        <View style={{ width: "100%", height: 320, backgroundColor: "#1c1a1a", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#555" }}>No artwork yet</Text>
        </View>
      )}
      <View style={{ padding: 16 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }} numberOfLines={2}>
          {title || "Untitled artwork"}
        </Text>
        {!!description && (
          <Text style={{ color: "#9c9996", fontSize: 13, marginTop: 6 }} numberOfLines={3}>
            {description}
          </Text>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={{ width: 26, height: 26, borderRadius: 13, marginRight: 8 }} />
          ) : (
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#333", marginRight: 8 }} />
          )}
          <Text style={{ color: "#eaeaea", fontSize: 13, fontWeight: "600" }}>{authorName || "You"}</Text>
        </View>

        {tags.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {tags.map((t) => (
              <Text key={t} style={{ color: "#ED3237", fontSize: 12, fontWeight: "600" }}>
                #{t}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/* =========================
   🔥 SCREEN
========================= */
const CreatePostScreen = () => {
  const Route = useRouter();
  const { profile } = useAuth();
  const { createPost, submitting, error } = useCreatePost();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINTS.laptop;

  const [step, setStep] = useState(0);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [stageIndex, setStageIndex] = useState(0);

  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const draftLoadedRef = useRef(false);

  /* ── Draft restore on mount ───────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(draftKey(profile?.id));
        if (!raw) {
          draftLoadedRef.current = true;
          return;
        }
        const draft: DraftShape = JSON.parse(raw);

        Alert.alert("Restore draft?", "You have an unsaved draft from a previous session.", [
          {
            text: "Discard",
            style: "destructive",
            onPress: async () => {
              await AsyncStorage.removeItem(draftKey(profile?.id));
              draftLoadedRef.current = true;
            },
          },
          {
            text: "Restore",
            onPress: () => {
              setTitle(draft.title ?? "");
              setDescription(draft.description ?? "");
              setSelectedCategory(draft.selectedCategory ?? "");
              setTags(draft.tags ?? []);
              // Native image URIs from a previous session may point to a
              // now-cleared temp file — if it fails to load, Image's
              // onError below clears it back out rather than showing a
              // broken box.
              if (draft.image) setImage(draft.image);
              draftLoadedRef.current = true;
            },
          },
        ]);
      } catch {
        draftLoadedRef.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Debounced autosave ───────────────────────────────────────────── */
  const saveDraftNow = useCallback(async () => {
    const draft: DraftShape = {
      title,
      description,
      selectedCategory,
      tags,
      image,
      savedAt: Date.now(),
    };
    try {
      await AsyncStorage.setItem(draftKey(profile?.id), JSON.stringify(draft));
      setDraftSavedAt(draft.savedAt);
    } catch {
      // Non-fatal — drafts are a convenience, not a required path.
    }
  }, [title, description, selectedCategory, tags, image, profile?.id]);

  useEffect(() => {
    if (!draftLoadedRef.current) return; // don't save until initial load/restore settles
    const hasContent = !!image || title.trim() || description.trim() || tags.length > 0;
    if (!hasContent) return;

    const timer = setTimeout(saveDraftNow, 800);
    return () => clearTimeout(timer);
  }, [title, description, selectedCategory, tags, image, saveDraftNow]);

  /* ── Image picking (also used by web drag-and-drop) ───────────────── */
  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload artwork.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: (asset as any).fileSize,
      });
    }
  }, []);

  const handleDropFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const probe = new (window as any).Image();
    probe.onload = () => {
      setImage({
        uri: objectUrl,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
        fileSize: file.size,
      });
    };
    probe.src = objectUrl;
  }, []);

  /* ── Tags ──────────────────────────────────────────────────────────── */
  const addTag = useCallback((tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }, []);
  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  /* ── Publish ───────────────────────────────────────────────────────── */
  const isFormValid = !!image && title.trim().length > 0 && !!selectedCategory && !submitting;

  const handlePublish = useCallback(async () => {
    if (!profile) {
      Route.push("/authscreen/login");
      return;
    }
    if (!isFormValid || !image) return;

    setStageIndex(0);
    stageTimerRef.current = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGE_MESSAGES.length - 2));
    }, 700);

    const post = await createPost({
      userId: profile.id,
      imageUri: image.uri,
      imageWidth: image.width,
      imageHeight: image.height,
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      tags,
    });

    if (stageTimerRef.current) clearInterval(stageTimerRef.current);

    if (!post) return; // `error` from the hook is already set and rendered below

    setStageIndex(STAGE_MESSAGES.length - 1); // "Done!"
    await AsyncStorage.removeItem(draftKey(profile.id));
    setTimeout(() => Route.back(), 400);
  }, [profile, isFormValid, image, title, description, selectedCategory, tags, createPost, Route]);

  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, []);

  /* ── Step navigation (mobile wizard) ──────────────────────────────── */
  const canProceed = useMemo(() => {
    if (step === 0) return !!image;
    if (step === 1) return title.trim().length > 0;
    if (step === 2) return !!selectedCategory;
    return true;
  }, [step, image, title, selectedCategory]);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBackStep = () => setStep((s) => Math.max(s - 1, 0));

  const heroHeight = isDesktop ? 560 : 420;

  /* ── Shared field blocks ──────────────────────────────────────────── */
  const titleField = (
    <View>
      <Text style={fieldLabelStyle}>Title</Text>
      <View style={fieldBoxStyle}>
        <TextInput
          placeholder="Give your artwork a name"
          placeholderTextColor="#bdbdbd"
          value={title}
          onChangeText={setTitle}
          style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}
        />
      </View>
    </View>
  );

  const descriptionField = (
    <View>
      <Text style={fieldLabelStyle}>Description</Text>
      <View style={[fieldBoxStyle, { minHeight: 130 }]}>
        <TextInput
          placeholder="Tell people about this piece"
          placeholderTextColor="#bdbdbd"
          value={description}
          onChangeText={(val) => val.length <= 1000 && setDescription(val)}
          multiline
          textAlignVertical="top"
          style={{ color: "#fff", fontSize: 15, flex: 1 }}
        />
      </View>
      <Text style={{ color: "#9c9996", textAlign: "right", fontSize: 12, marginTop: 4 }}>
        {description.length} / 1000
      </Text>
    </View>
  );

  const categoryField = (
    <View>
      <Text style={fieldLabelStyle}>Category</Text>
      <PillCategorySelector active={selectedCategory} onSelect={setSelectedCategory} />
    </View>
  );

  const tagsField = (
    <View>
      <Text style={fieldLabelStyle}>Tags</Text>
      <TagChipInput tags={tags} onAdd={addTag} onRemove={removeTag} />
    </View>
  );

  const previewCard = (
    <PreviewCard
      image={image}
      title={title}
      description={description}
      tags={tags}
      authorName={profile?.name}
      authorAvatar={profile?.profilePicture}
    />
  );

  const publishButton = (
    <TouchableOpacity
      style={{
        width: "100%",
        height: 58,
        borderRadius: 14,
        backgroundColor: "#ED3237",
        alignItems: "center",
        justifyContent: "center",
        opacity: isFormValid ? 1 : 0.5,
      }}
      disabled={!isFormValid}
      onPress={handlePublish}
    >
      {submitting ? (
        <View style={{ alignItems: "center" }}>
          <ActivityIndicator color="#fff" />
          <Text style={{ color: "#fff", fontSize: 12, marginTop: 4 }}>
            {STAGE_MESSAGES[stageIndex]}
          </Text>
        </View>
      ) : (
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Publish artwork</Text>
      )}
    </TouchableOpacity>
  );

  /* =========================
     DESKTOP — split layout, no wizard. Artwork left, everything else
     right, review/preview folded into the bottom of the right column.
  ========================= */
  if (isDesktop) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingVertical: 16,
          }}
        >
          <TouchableOpacity onPress={() => Route.back()} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image source={Icons.back} style={{ width: 18, height: 18, tintColor: "#fff" }} />
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>Create artwork</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {draftSavedAt && (
              <Text style={{ color: "#787575", fontSize: 12 }}>
                Draft saved {new Date(draftSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            )}
            <TouchableOpacity onPress={saveDraftNow}>
              <Text style={{ color: "#bdbdbd", fontWeight: "600" }}>Save draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePublish}
              disabled={!isFormValid}
              style={{
                backgroundColor: "#ED3237",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 10,
                opacity: isFormValid ? 1 : 0.5,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>Publish</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
          <View style={{ flexDirection: "row", gap: 40, maxWidth: 1400, alignSelf: "center", width: "100%" }}>
            <View style={{ width: 500, flexShrink: 0 }}>
              <ArtworkUploader image={image} height={heroHeight} onPick={handlePickImage} onDropFile={handleDropFile} />
            </View>

            <View style={{ flex: 1, gap: 22 }}>
              {titleField}
              {descriptionField}
              {categoryField}
              {tagsField}

              {error && <Text style={{ color: "#ED3237" }}>{error}</Text>}

              <View>
                <Text style={{ color: "#BDBFC1", fontSize: 14, fontWeight: "600", marginBottom: 10 }}>
                  Live preview
                </Text>
                {previewCard}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* =========================
     MOBILE — step-by-step wizard.
  ========================= */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#030303" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <TouchableOpacity onPress={step === 0 ? () => Route.back() : goBackStep}>
            <Image source={step === 0 ? Icons.close : Icons.back} style={{ width: 20, height: 20, tintColor: "#fff" }} />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{STEPS[step].label}</Text>
          <TouchableOpacity onPress={saveDraftNow}>
            <Text style={{ color: "#bdbdbd", fontSize: 13, fontWeight: "600" }}>Save draft</Text>
          </TouchableOpacity>
        </View>

        {/* Step dots */}
        <View style={{ flexDirection: "row", gap: 6, marginTop: 14, marginBottom: 6 }}>
          {STEPS.map((s, i) => (
            <View
              key={s.key}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: i <= step ? "#ED3237" : "#2e2b2b",
              }}
            />
          ))}
        </View>
        {draftSavedAt && (
          <Text style={{ color: "#787575", fontSize: 11, marginBottom: 4 }}>
            Draft saved {new Date(draftSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <ArtworkUploader image={image} height={heroHeight} onPick={handlePickImage} onDropFile={handleDropFile} />
        )}

        {step === 1 && (
          <View style={{ gap: 20 }}>
            {titleField}
            {descriptionField}
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 24 }}>
            {categoryField}
            {tagsField}
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: 16 }}>
            {previewCard}
            {error && <Text style={{ color: "#ED3237", textAlign: "center" }}>{error}</Text>}
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {step < STEPS.length - 1 ? (
          <TouchableOpacity
            onPress={goNext}
            disabled={!canProceed}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 14,
              backgroundColor: "#ED3237",
              alignItems: "center",
              justifyContent: "center",
              opacity: canProceed ? 1 : 0.5,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Continue</Text>
          </TouchableOpacity>
        ) : (
          publishButton
        )}
      </View>
    </SafeAreaView>
  );
};

/* =========================
   STYLES (kept as plain objects — used across mobile + desktop fields)
========================= */
const fieldLabelStyle = { color: "#fff", fontSize: 16, fontWeight: "600" as const, marginBottom: 8 };
const fieldBoxStyle = {
  backgroundColor: "#2e2b2b",
  borderRadius: 10,
  padding: 14,
};

export default CreatePostScreen;

// import CategoryTabs from "@/components/category";
// import { Icons } from "@/constants/icons";
// import { categories } from "@/data/category";
// import { useAuth } from "@/hooks/useAuth";
// import { useCreatePost } from "@/hooks/useCreatePost";
// import * as ImagePicker from "expo-image-picker";
// import { useRouter } from "expo-router";
// import React, { useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
// } from "react-native";
// import { SafeAreaView } from 'react-native-safe-area-context';

// type PickedImage = {
//   uri: string;
//   width: number;
//   height: number;
// };

// const CreatePostScreen = () =>  {
//     const Route = useRouter();
//     const { profile } = useAuth();
//     const { createPost, submitting, error } = useCreatePost();

//     const [keyboardVisible, setKeyboardVisible] = useState(false);
//     const [selectedCategory, setSelectedCategory] = useState("");
//     const [tagInputs, setTagInputs] = useState([""]);
//     const [tags, setTags] = useState<string[]>([]);

//     const [image, setImage] = useState<PickedImage | null>(null);
//     const [title, setTitle] = useState("");
//     const [description, setDescription] = useState("");

//     const handleTagChange = (index: number, value: string) => {
//       const updatedInputs = [...tagInputs];
//       updatedInputs[index] = value;
//       setTagInputs(updatedInputs);
//     };

//     const handleAddTagField = () => {
//       setTagInputs([...tagInputs, ""]);
//     };

//     const handleAddTag = (index: number) => {
//       const value = tagInputs[index].trim();

//       if (!value) return;

//       if (!tags.includes(value)) {
//         setTags([...tags, value]);
//       }

//       const updatedInputs = [...tagInputs];
//       updatedInputs[index] = "";
//       setTagInputs(updatedInputs);
//     };

//     const handlePickImage = async () => {
//       const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert("Permission needed", "Allow photo library access to upload artwork.");
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ["images"],
//         quality: 0.9,
//       });

//       if (!result.canceled && result.assets?.[0]) {
//         const asset = result.assets[0];
//         setImage({ uri: asset.uri, width: asset.width, height: asset.height });
//       }
//     };

//     const isFormValid =
//       !!image && title.trim().length > 0 && !!selectedCategory && !submitting;

//     const handlePublish = async () => {
//       if (!profile) {
//         Route.push("/authscreen/login");
//         return;
//       }

//       if (!isFormValid || !image) return;

//       const post = await createPost({
//         userId: profile.id,
//         imageUri: image.uri,
//         imageWidth: image.width,
//         imageHeight: image.height,
//         title: title.trim(),
//         description: description.trim(),
//         category: selectedCategory,
//         tags,
//       });

//       if (!post) {
//         // `error` from useCreatePost is already set and rendered below
//         return;
//       }

//       Route.back();
//     };

// React.useEffect(() => {
//   const show = Keyboard.addListener("keyboardDidShow", () => {
//     setKeyboardVisible(true);
//   });

//   const hide = Keyboard.addListener("keyboardDidHide", () => {
//     setKeyboardVisible(false);
//   });

//   return () => {
//     show.remove();
//     hide.remove();
//   };
// }, []);

//     return (
//     <SafeAreaView style={{ flex: 1, padding: 10 }}>
//     <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <View style={{ flex: 1 }}>
//         <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
//           <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20}}>
//               <TouchableOpacity onPress={()=> Route.back()}>
//                   <Image source={Icons.close} style={{ width: 20, height: 20 }} />
//               </TouchableOpacity>
//               <Text style={styles.title}>Create New Post</Text>
//           </View>

//           <TouchableOpacity
//             onPress={handlePickImage}
//             activeOpacity={0.85}
//             style={{ backgroundColor: "#2e2b2b", width: "95%", height: 400 , borderRadius: 15, justifyContent: "center", alignItems: "center", alignSelf: "center", overflow: "hidden" }}
//           >
//               {image ? (
//                 <Image source={{ uri: image.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
//               ) : (
//                 <>
//                   <View style={{ width: 50, height: 50, backgroundColor: "#757272", borderRadius: 25, marginBottom: 10 }}>
//                       <Image source={Icons.share} style={{ width: 25, height: 25, alignSelf: "center", marginTop: 12}} />
//                   </View>
//                   <Text style={{ color: "#bbbbbb", fontSize: 18, fontWeight: "600" }}>Upload Artwork</Text>
//                   <Text style={{ color: "#757272", fontSize: 18, fontWeight: "600" }}>JPG . PNG </Text>
//                 </>
//               )}
//           </TouchableOpacity>
//           {image && (
//             <TouchableOpacity onPress={handlePickImage} style={{ alignSelf: "center", marginTop: 8 }}>
//               <Text style={{ color: "#ED3237", fontWeight: "600" }}>Change image</Text>
//             </TouchableOpacity>
//           )}

//           <View style={{ width: "95%", alignSelf: "center", marginTop: 20, backgroundColor: "#2e2b2b", borderRadius: 10, padding: 10, height: 70 }}>
//                 <TextInput
//                     placeholder= "Title"
//                     placeholderTextColor="#bdbdbd"
//                     value={title}
//                     onChangeText={setTitle}
//                     style={{ color: "white", fontSize: 18, fontWeight: "600", width: "100%", height: "100%" }}
//                 />
//           </View>
//             <View style={{ width: "95%", alignSelf: "center", marginTop: 20, backgroundColor: "#2e2b2b", borderRadius: 10, padding: 10, height: 150 }}>
//               <TextInput
//                 placeholder="Description"
//                 placeholderTextColor="#bdbdbd"
//                 value={description}
//                 onChangeText={(val) => {
//                   if (val.length <= 1000) setDescription(val);
//                 }}
//                 multiline={true}
//                 numberOfLines={6}
//                 textAlignVertical="top"
//                 style={{ color: "white", fontSize: 18, fontWeight: "600", width: "100%", height: "100%", paddingTop: 6 }}
//               />
//             </View>
//             <View style={{marginTop: 10, width: "95%", alignSelf: "center"}}><Text style={{color: "#9C9996", textAlign: "right"}}>{description.length} / 1000</Text></View>
//             <View style={{ width: "95%", alignSelf: "center", marginTop: 20}}>
//                 <Text style={{ color: "white", fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Category</Text>
//                 <CategoryTabs
//                     data={categories}
//                     activeCategory={selectedCategory}
//                     onSelect={setSelectedCategory}
//                 />
//             </View>

//             <View style={{ width: "95%", alignSelf: "center", marginTop: 10 }}>
//               <Text style={{ color: "white", fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Tags</Text>

//               {tags.length > 0 ? (
//                 <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
//                   {tags.map((tag) => (
//                     <View key={tag} style={styles.tagChip}>
//                       <Text style={styles.tagText}>#{tag}</Text>
//                     </View>
//                   ))}
//                 </View>
//               ) : null}

//               {tagInputs.map((tagInput, index) => (
//                 <View key={`tag-${index}`} style={styles.tagInputRow}>
//                   <TextInput
//                     value={tagInput}
//                     onChangeText={(value) => handleTagChange(index, value)}
//                     placeholder="Add Tag"
//                     placeholderTextColor="#bdbdbd"
//                     style={styles.tagInput}
//                   />
//                   <TouchableOpacity style={styles.addTagButton} onPress={() => handleAddTag(index)}>
//                     {/* <Text style={styles.addTagText}>Add</Text> */}
//                     <Image source={Icons.add} style={{ width: 10, height: 10, tintColor: "#fff" }} />
//                   </TouchableOpacity>
//                 </View>
//               ))}

//               <TouchableOpacity style={styles.addMoreButton} onPress={handleAddTagField}>
//                 <Text style={styles.addMoreText}>+ Add another tag field</Text>
//               </TouchableOpacity>
//             </View>

//             {error ? (
//               <Text style={{ color: "#ED3237", textAlign: "center", marginTop: 16, width: "95%", alignSelf: "center" }}>
//                 {error}
//               </Text>
//             ) : null}
//         </ScrollView>

//         <View style={styles.bottomButtonContainer}>
//           <TouchableOpacity
//             style={[styles.bottomButton, { opacity: isFormValid ? 1 : 0.5 }]}
//             disabled={!isFormValid}
//             onPress={handlePublish}
//           >
//             {submitting ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.buttonText}>Publish Artwork</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//     )
// }


// const styles = StyleSheet.create({
//     title: {
//         fontSize: 30,
//         fontWeight: "bold",
//         color: "white",
//     },
//     bottomButtonContainer: {
//       position: 'absolute',
//       left: 0,
//       right: 0,
//       bottom: 10,
//       alignItems: 'center',
//     },
//     bottomButton: {
//       width: '95%',
//       height: 60,
//       backgroundColor: '#ED3237',
//       borderRadius: 12,
//       justifyContent: 'center',
//       alignItems: 'center',
//     },
//     buttonText: {
//       color: 'white',
//       fontSize: 16,
//       fontWeight: '600',
//     },
//     tagInputRow: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: '#2e2b2b',
//       borderRadius: 10,
//       paddingHorizontal: 10,
//       paddingVertical: 6,
//       marginBottom: 10,
//       height: 60,
//     },
//     tagInput: {
//       flex: 1,
//       color: 'white',
//       fontSize: 16,
//       fontWeight: '500',
//       paddingVertical: 8,
//     },
//     addTagButton: {
//       backgroundColor: '#ED3237',
//       paddingHorizontal: 12,
//       height: 40,
//       width: 40,  
//       justifyContent: 'center',
//       alignItems: 'center',
//       paddingVertical: 8,
//       borderRadius: 8,
//       marginLeft: 8,
//     },
//     addTagText: {
//       color: 'white',
//       fontSize: 13,
//       fontWeight: '600',
//     },
//     tagChip: {
//       backgroundColor: '#444',
//       paddingHorizontal: 10,
//       paddingVertical: 6,
//       borderRadius: 999,
//       marginRight: 8,
//       marginBottom: 8,
//     },
//     tagText: {
//       color: 'white',
//       fontSize: 13,
//       fontWeight: '600',
//     },
//     addMoreButton: {
//       alignSelf: 'flex-start',
//       marginTop: 4,
//     },
//     addMoreText: {
//       color: '#ED3237',
//       fontSize: 14,
//       fontWeight: '600',
//     },
// });

// export default CreatePostScreen;



