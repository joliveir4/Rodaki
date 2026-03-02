import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImagePickerProps {
  imageUri?: string | null;
  onImageSelected: (uri: string) => void;
  loading?: boolean;
  label?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ImagePicker: React.FC<ImagePickerProps> = ({
  imageUri,
  onImageSelected,
  loading = false,
  label = 'Comprovante de pagamento',
}) => {
  const pickImage = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso à sua galeria para enviar o comprovante.',
      );
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos acesso à câmera.');
      return;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const handlePress = () => {
    Alert.alert('Adicionar comprovante', 'Como deseja adicionar?', [
      { text: 'Câmera', onPress: takePhoto },
      { text: 'Galeria', onPress: pickImage },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        onPress={handlePress}
        disabled={loading}
        activeOpacity={0.8}
        style={styles.picker}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <View style={styles.changeOverlay}>
              <Text style={styles.changeLabel}>Trocar imagem</Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📎</Text>
            <Text style={styles.placeholderText}>Toque para adicionar comprovante</Text>
            <Text style={styles.placeholderHint}>Câmera ou galeria</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  picker: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    minHeight: 160,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  changeLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  placeholder: {
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.lg,
  },
  placeholderIcon: {
    fontSize: 32,
  },
  placeholderText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  placeholderHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textDisabled,
    textAlign: 'center',
  },
});
