import CategoryTabs from "@/components/category";
import { Icons } from "@/constants/icons";
import { categories } from "@/data/category";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const CreatePostScreen = () =>  {
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [tagInputs, setTagInputs] = useState([""]);
    const [tags, setTags] = useState<string[]>([]);

    const handleTagChange = (index: number, value: string) => {
      const updatedInputs = [...tagInputs];
      updatedInputs[index] = value;
      setTagInputs(updatedInputs);
    };

    const handleAddTagField = () => {
      setTagInputs([...tagInputs, ""]);
    };

    const handleAddTag = (index: number) => {
      const value = tagInputs[index].trim();

      if (!value) return;

      if (!tags.includes(value)) {
        setTags([...tags, value]);
      }

      const updatedInputs = [...tagInputs];
      updatedInputs[index] = "";
      setTagInputs(updatedInputs);
    };

React.useEffect(() => {
  const show = Keyboard.addListener("keyboardDidShow", () => {
    setKeyboardVisible(true);
  });

  const hide = Keyboard.addListener("keyboardDidHide", () => {
    setKeyboardVisible(false);
  });

  return () => {
    show.remove();
    hide.remove();
  };
}, []);

    const Route = useRouter();
    return (
    <SafeAreaView style={{ flex: 1, padding: 10 }}>
    <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
          <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20}}>
              <TouchableOpacity onPress={()=> Route.back()}>
                  <Image source={Icons.close} style={{ width: 20, height: 20 }} />
              </TouchableOpacity>
              <Text style={styles.title}>Create New Post</Text>
          </View>

          <View style={{ backgroundColor: "#2e2b2b", width: "95%", height: 400 , borderRadius: 15, justifyContent: "center", alignItems: "center", alignSelf: "center"}}>
              <View style={{ width: 50, height: 50, backgroundColor: "#757272", borderRadius: 25, marginBottom: 10 }}>
                  <Image source={Icons.share} style={{ width: 25, height: 25, alignSelf: "center", marginTop: 12}} />
              </View>
              <Text style={{ color: "#bbbbbb", fontSize: 18, fontWeight: "600" }}>Upload Artwork</Text>
              <Text style={{ color: "#757272", fontSize: 18, fontWeight: "600" }}>JPG . PNG </Text>
          </View>
          <View style={{ width: "95%", alignSelf: "center", marginTop: 20, backgroundColor: "#2e2b2b", borderRadius: 10, padding: 10, height: 70 }}>
                <TextInput
                    placeholder= "Title"
                    placeholderTextColor="#bdbdbd"
                    style={{ color: "white", fontSize: 18, fontWeight: "600", width: "100%", height: "100%" }}
                />
          </View>
            <View style={{ width: "95%", alignSelf: "center", marginTop: 20, backgroundColor: "#2e2b2b", borderRadius: 10, padding: 10, height: 150 }}>
              <TextInput
                placeholder="Description"
                placeholderTextColor="#bdbdbd"
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
                style={{ color: "white", fontSize: 18, fontWeight: "600", width: "100%", height: "100%", paddingTop: 6 }}
              />
            </View>
            <View style={{marginTop: 10, width: "95%", alignSelf: "center"}}><Text style={{color: "#2e2b2b", textAlign: "right"}}>145 / 1000</Text></View>
            <View style={{ width: "95%", alignSelf: "center", marginTop: 20}}>
                <Text style={{ color: "white", fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Category</Text>
                <CategoryTabs
                    data={categories}
                    activeCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                    showAll={false}
                />
            </View>

            <View style={{ width: "95%", alignSelf: "center", marginTop: 10 }}>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Tags</Text>

              {tags.length > 0 ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {tagInputs.map((tagInput, index) => (
                <View key={`tag-${index}`} style={styles.tagInputRow}>
                  <TextInput
                    value={tagInput}
                    onChangeText={(value) => handleTagChange(index, value)}
                    placeholder="Add Tag"
                    placeholderTextColor="#bdbdbd"
                    style={styles.tagInput}
                  />
                  <TouchableOpacity style={styles.addTagButton} onPress={() => handleAddTag(index)}>
                    {/* <Text style={styles.addTagText}>Add</Text> */}
                    <Image source={Icons.add} style={{ width: 10, height: 10, tintColor: "#fff" }} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addMoreButton} onPress={handleAddTagField}>
                
              </TouchableOpacity>
            </View>
        </ScrollView>

        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity style={styles.bottomButton} onPress={() => { /* submit action */ }}>
            <Text style={styles.buttonText}>Publish Artwork</Text>
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    )
}


const styles = StyleSheet.create({
    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: "white",
    },
    bottomButtonContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 10,
      alignItems: 'center',
    },
    bottomButton: {
      width: '95%',
      height: 60,
      backgroundColor: '#ED3237',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    tagInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2e2b2b',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 10,
      height: 60,
    },
    tagInput: {
      flex: 1,
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
      paddingVertical: 8,
    },
    addTagButton: {
      backgroundColor: '#ED3237',
      paddingHorizontal: 12,
      height: 40,
      width: 40,  
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 8,
      marginLeft: 8,
    },
    addTagText: {
      color: 'white',
      fontSize: 13,
      fontWeight: '600',
    },
    tagChip: {
      backgroundColor: '#444',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      color: 'white',
      fontSize: 13,
      fontWeight: '600',
    },
    addMoreButton: {
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    addMoreText: {
      color: '#ED3237',
      fontSize: 14,
      fontWeight: '600',
    },
});

export default CreatePostScreen;
