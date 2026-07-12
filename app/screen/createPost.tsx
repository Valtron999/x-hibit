import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreatePostScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handlePost = () => {
    if (title.trim() || content.trim()) {
      console.log('Post created:', { title, content });
      setTitle('');
      setContent('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Post</Text>
      
      <TextInput
        style={styles.titleInput}
        placeholder="Post title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#999"
      />
      
      <TextInput
        style={styles.contentInput}
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={6}
        placeholderTextColor="#999"
        textAlignVertical="top"
      />
      
      <TouchableOpacity style={styles.postButton} onPress={handlePost}>
        <Text style={styles.postButtonText}>Post</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 14,
    color: '#333',
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
