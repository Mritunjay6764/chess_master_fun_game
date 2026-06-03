// src/components/PromotionModal.tsx — bottom-sheet promotion picker (BUG-4 fix).
// Shown when chess.js indicates the candidate move requires a promotion. The
// user must explicitly pick a piece before the move is committed.
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChessPiece } from '@components/Pieces/MeridaPieces';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import type { Color, PieceSymbol } from '@/types/index';

interface Props {
  visible: boolean;
  color: Color;
  onPick: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

const CHOICES: PieceSymbol[] = ['q', 'r', 'b', 'n'];

export const PromotionModal: React.FC<Props> = ({ visible, color, onPick, onCancel }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
    <Pressable style={styles.backdrop} onPress={onCancel}>
      <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.title}>Promote to…</Text>
        <View style={styles.row}>
          {CHOICES.map((c) => (
            <Pressable key={c} onPress={() => onPick(c as 'q' | 'r' | 'b' | 'n')} style={styles.choice}>
              <ChessPiece type={c} color={color} size={56} />
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.cancel} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
  },
  choice: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  cancel: {
    marginTop: SPACING.lg,
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  cancelText: { color: COLORS.textSecondary, fontSize: 15 },
});
